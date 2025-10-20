from __future__ import annotations

import copy
import json
import mimetypes
import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from threading import RLock
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

from PIL import Image, ImageDraw, ImageFont
from flask import Blueprint, Flask, abort, jsonify, redirect, render_template, request, send_from_directory, url_for
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MEDIA_DIR = DATA_DIR / "images"
STATE_FILE = DATA_DIR / "media.json"
DEFAULT_DURATION_SECONDS = 10
QUEBEC_TZ = ZoneInfo("America/Toronto")
TEXT_IMAGE_WIDTH = 1920
TEXT_IMAGE_HEIGHT = 1080
TEXT_IMAGE_MARGIN = 80
TEXT_IMAGE_BACKGROUND = "#FFFFFF"
TEXT_IMAGE_FOREGROUND = "#111111"
DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".md", ".rtf"}

DEFAULT_SETTINGS = {"overlay": {"enabled": True, "mode": "clock", "height_vh": 5.0, "background_color": "#f0f0f0", "text_color": "#111111", "logo_path": "static/img/logo-groupe-cardinal.png", "ticker_text": "Bienvenue sur Cardinal TV"}}

MEDIA_DIR.mkdir(parents=True, exist_ok=True)

STATIC_ROUTE_PREFIX = "static"


def _normalize_logo_path_value(value: Optional[str]) -> str:
    text = (value or "").strip()
    if not text:
        return DEFAULT_SETTINGS["overlay"]["logo_path"]

    lowered = text.lower()
    if lowered.startswith(("http://", "https://", "data:", "//")):
        return text

    rel = text.lstrip("/")
    static_prefix = (STATIC_ROUTE_PREFIX or "").lstrip("/")
    while static_prefix and rel.startswith(static_prefix + "/"):
        rel = rel[len(static_prefix) + 1 :]
    while rel.startswith("static/"):
        rel = rel[len("static/") :]

    rel = rel.lstrip("/")
    if not rel:
        return DEFAULT_SETTINGS["overlay"]["logo_path"]

    return f"static/{rel}"


def _guess_mimetype(*names: Optional[str]) -> Optional[str]:
    for name in names:
        if not name:
            continue
        guessed, _ = mimetypes.guess_type(str(name))
        if guessed:
            return guessed
    return None


def _build_document_directory(base_name: str, media_id: str) -> Path:
    safe_base = secure_filename(base_name) or media_id
    candidate = MEDIA_DIR / safe_base
    if candidate.exists():
        candidate = MEDIA_DIR / f"{safe_base}_{media_id}"
    if candidate.exists():
        shutil.rmtree(candidate)
    candidate.mkdir(parents=True, exist_ok=True)
    return candidate


def _resolve_mimetype(
    uploaded_mimetype: Optional[str], original_name: str, storage_name: str
) -> str:
    candidate = (uploaded_mimetype or "").strip()
    if candidate and candidate.lower() != "application/octet-stream":
        return candidate
    guessed = _guess_mimetype(original_name, storage_name)
    if guessed:
        return guessed
    return "application/octet-stream"


def _chunk_text(text: str, max_chars: int = 1200) -> List[str]:
    segments: List[str] = []
    buffer: List[str] = []
    count = 0
    for paragraph in text.splitlines():
        paragraph = paragraph.strip()
        if not paragraph:
            paragraph = "\n"
        if count + len(paragraph) > max_chars and buffer:
            segments.append("\n".join(buffer).strip())
            buffer = []
            count = 0
        buffer.append(paragraph)
        count += len(paragraph)
    if buffer:
        segments.append("\n".join(buffer).strip())
    return segments or [text]


def _convert_docx_to_pdf(source: Path, target: Path) -> Optional[Path]:
    try:
        from docx2pdf import convert as docx2pdf_convert
    except ImportError:
        return None
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        docx2pdf_convert(str(source), str(target))
        if target.exists():
            return target
    except Exception:
        return None
    return None


def _extract_docx_text_pages(source: Path) -> List[str]:
    try:
        from docx import Document
    except ImportError:
        return []
    try:
        document = Document(str(source))
    except Exception:
        return []
    paragraphs = []
    for para in document.paragraphs:
        paragraphs.append(para.text)
    text = "\n".join(paragraphs).strip()
    if not text:
        return []
    return _chunk_text(text)


def _extract_pdf_text_pages(source: Path) -> List[str]:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        return []
    try:
        reader = PdfReader(str(source))
    except Exception:
        return []
    pages: List[str] = []
    for page in reader.pages:
        try:
            text = (page.extract_text() or "").strip()
        except Exception:
            text = ""
        pages.append(text or "[Page vide]")
    if not pages:
        return []
    return pages


def _render_pdf_to_images(source: Path, target_dir: Path) -> List[str]:
    try:
        import fitz  # type: ignore
    except ImportError:
        return []

    if target_dir.exists():
        shutil.rmtree(target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    rendered_files: List[str] = []

    try:
        document = fitz.open(str(source))
    except Exception:
        return []

    try:
        for index, page in enumerate(document, start=1):
            matrix = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            filename = f"{index}.jpeg"
            output_path = target_dir / filename
            pix.save(str(output_path))
            rendered_files.append(str(output_path.relative_to(MEDIA_DIR)).replace("\\", "/"))
    finally:
        document.close()

    if not rendered_files:
        try:
            shutil.rmtree(target_dir)
        except OSError:
            pass
    return rendered_files


def _wrap_text_for_image(text: str, font: ImageFont.ImageFont, max_width: int) -> List[str]:
    words = text.replace("\r", "").split()
    if not words:
        return [""]
    lines: List[str] = []
    current: List[str] = []

    def line_width(parts: List[str]) -> int:
        test = " ".join(parts) if parts else ""
        return int(font.getlength(test)) if hasattr(font, "getlength") else font.getsize(test)[0]

    for word in words:
        candidate = current + [word]
        if line_width(candidate) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(" ".join(current))
        current = [word]
    if current:
        lines.append(" ".join(current))
    return lines or [""]


def _text_pages_to_images(target_dir: Path, pages: List[str]) -> List[str]:
    if not pages:
        return []
    if target_dir.exists():
        shutil.rmtree(target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    font = ImageFont.load_default()
    generated: List[str] = []
    max_text_width = TEXT_IMAGE_WIDTH - (2 * TEXT_IMAGE_MARGIN)

    for index, raw_page in enumerate(pages, start=1):
        image = Image.new("RGB", (TEXT_IMAGE_WIDTH, TEXT_IMAGE_HEIGHT), color=TEXT_IMAGE_BACKGROUND)
        draw = ImageDraw.Draw(image)
        wrapped_lines: List[str] = []
        for paragraph in raw_page.split("\n"):
            paragraph = paragraph.strip()
            if not paragraph:
                wrapped_lines.append("")
                continue
            wrapped_lines.extend(_wrap_text_for_image(paragraph, font, max_text_width))
        line_height = int(font.getbbox("Ag")[3] - font.getbbox("Ag")[1]) if hasattr(font, "getbbox") else font.getsize("Ag")[1]

        y = TEXT_IMAGE_MARGIN
        for line in wrapped_lines:
            if y + line_height > TEXT_IMAGE_HEIGHT - TEXT_IMAGE_MARGIN:
                break
            draw.text(
                (TEXT_IMAGE_MARGIN, y),
                line,
                font=font,
                fill=TEXT_IMAGE_FOREGROUND,
            )
            y += line_height + 6

        filename = f"{index}.jpeg"
        output_path = target_dir / filename
        image.save(output_path, format="JPEG", quality=85)
        generated.append(str(output_path.relative_to(MEDIA_DIR)).replace("\\", "/"))

    return generated


def _prepare_document_previews(
    media_id: str, source: Path, extension: str, target_dir: Path
) -> Dict[str, Any]:
    extension = extension.lower()
    previews: Dict[str, Any] = {}

    if extension == ".pdf":
        image_pages = _render_pdf_to_images(source, target_dir)
        if image_pages:
            previews["page_filenames"] = image_pages
            previews["display_mimetype"] = "image/jpeg"
            previews["display_filename"] = image_pages[0]
        else:
            text_pages = _extract_pdf_text_pages(source)
            image_from_text = _text_pages_to_images(target_dir, text_pages)
            if image_from_text:
                previews["page_filenames"] = image_from_text
                previews["display_mimetype"] = "image/jpeg"
                previews["display_filename"] = image_from_text[0]
            previews["text_pages"] = []
    elif extension in {".doc", ".docx"}:
        temp_pdf = target_dir / f"{media_id}_converted.pdf"
        converted = _convert_docx_to_pdf(source, temp_pdf)
        if converted and converted.exists():
            image_pages = _render_pdf_to_images(converted, target_dir)
            if image_pages:
                previews["page_filenames"] = image_pages
                previews["display_mimetype"] = "image/jpeg"
                previews["display_filename"] = image_pages[0]
            else:
                text_pages = _extract_pdf_text_pages(converted)
                image_from_text = _text_pages_to_images(target_dir, text_pages)
                if image_from_text:
                    previews["page_filenames"] = image_from_text
                    previews["display_mimetype"] = "image/jpeg"
                    previews["display_filename"] = image_from_text[0]
                previews["text_pages"] = []
            try:
                converted.unlink()
            except OSError:
                pass
        else:
            text_pages = _extract_docx_text_pages(source)
            image_from_text = _text_pages_to_images(target_dir, text_pages)
            if image_from_text:
                previews["page_filenames"] = image_from_text
                previews["display_mimetype"] = "image/jpeg"
                previews["display_filename"] = image_from_text[0]
            previews["text_pages"] = []
    elif extension in {".txt", ".md", ".rtf"}:
        try:
            content = source.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            content = source.read_text(encoding="latin-1", errors="ignore")
        text_pages = _chunk_text(content)
        image_from_text = _text_pages_to_images(target_dir, text_pages)
        if image_from_text:
            previews["page_filenames"] = image_from_text
            previews["display_mimetype"] = "image/jpeg"
            previews["display_filename"] = image_from_text[0]
        previews["text_pages"] = []

    return previews


def _now() -> datetime:
    return datetime.now(tz=QUEBEC_TZ).replace(microsecond=0)


def _now_iso() -> str:
    return _now().isoformat()


def _parse_datetime(raw: Optional[str]) -> Optional[datetime]:
    if not raw:
        return None
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=QUEBEC_TZ)
    else:
        parsed = parsed.astimezone(QUEBEC_TZ)
    return parsed


def _serialize_datetime(value: Optional[datetime | str]) -> Optional[str]:
    if not value:
        return None
    if isinstance(value, datetime):
        parsed = value
    else:
        parsed = _parse_datetime(value)
        if not parsed:
            return None
    parsed = parsed.astimezone(QUEBEC_TZ)
    return parsed.isoformat()


class MediaStore:
    def __init__(self, state_path: Path) -> None:
        self._path = state_path
        self._lock = RLock()
        self._data: Dict[str, Any] = {"items": []}
        self._load()
        if self._ensure_settings():
            self._save()

    def _normalize_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        item.setdefault("display_filename", item.get("filename"))
        item.setdefault("display_mimetype", item.get("mimetype"))
        page_filenames = item.get("page_filenames") or []
        text_pages = item.get("text_pages") or []
        if not isinstance(page_filenames, list):
            page_filenames = []
        if not isinstance(text_pages, list):
            text_pages = []
        item["page_filenames"] = page_filenames
        item["text_pages"] = text_pages
        item.setdefault("skip_rounds", 0)
        item.setdefault("muted", False)
        uploaded_at = item.get("uploaded_at")
        if uploaded_at:
            serialized = _serialize_datetime(uploaded_at)
            item["uploaded_at"] = serialized or _now_iso()
        else:
            item["uploaded_at"] = _now_iso()
        for key in ("start_at", "end_at"):
            if item.get(key):
                serialized = _serialize_datetime(item[key])
                item[key] = serialized
        if isinstance(item.get("skip_rounds"), str):
            try:
                item["skip_rounds"] = int(item["skip_rounds"])
            except ValueError:
                item["skip_rounds"] = 0
        if page_filenames and (
            not item.get("display_filename")
            or item["display_filename"] == item.get("filename")
        ):
            item["display_filename"] = page_filenames[0]
            item["display_mimetype"] = "image/jpeg"
        muted_value = item.get("muted")
        if isinstance(muted_value, str):
            item["muted"] = muted_value.strip().lower() in {"1", "true", "yes", "on"}
        else:
            item["muted"] = bool(muted_value)
        return item

    def _normalize_overlay(
        self, overlay: Dict[str, Any], base: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        result = copy.deepcopy(base or DEFAULT_SETTINGS["overlay"])
        for key, value in overlay.items():
            if key == "enabled":
                result["enabled"] = bool(value)
            elif key == "mode":
                mode = str(value).lower()
                result["mode"] = "ticker" if mode == "ticker" else "clock"
            elif key == "height_vh":
                try:
                    result["height_vh"] = max(0.0, float(value))
                except (TypeError, ValueError):
                    continue
            elif key == "background_color":
                if isinstance(value, str) and value:
                    result["background_color"] = value
            elif key == "text_color":
                if isinstance(value, str) and value:
                    result["text_color"] = value
            elif key == "logo_path":
                result["logo_path"] = _normalize_logo_path_value(str(value))
            elif key == "ticker_text":
                result["ticker_text"] = str(value)
        return result

    def _ensure_settings(self) -> bool:
        settings = self._data.get("settings")
        if not isinstance(settings, dict):
            settings = {}
        overlay = settings.get("overlay")
        if not isinstance(overlay, dict):
            overlay = {}
        normalized_overlay = self._normalize_overlay(overlay, DEFAULT_SETTINGS["overlay"])
        normalized_settings = {"overlay": normalized_overlay}
        changed = self._data.get("settings") != normalized_settings
        self._data["settings"] = normalized_settings
        return changed

    def get_settings(self) -> Dict[str, Any]:
        self._ensure_settings()
        with self._lock:
            return copy.deepcopy(self._data["settings"])

    def update_settings(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(updates, dict):
            raise ValueError("Paramètres invalides.")
        with self._lock:
            self._ensure_settings()
            if "overlay" in updates:
                overlay_updates = updates["overlay"]
                if not isinstance(overlay_updates, dict):
                    raise ValueError("Le bloc overlay doit être un objet.")
                current_overlay = self._data["settings"]["overlay"]
                normalized = self._normalize_overlay(overlay_updates, current_overlay)
                self._data["settings"]["overlay"] = normalized
            else:
                raise ValueError("Aucun paramètre à mettre à jour.")
            self._save()
            return copy.deepcopy(self._data["settings"])

    def _load(self) -> None:
        if not self._path.exists():
            self._save()
            return
        try:
            with self._path.open("r", encoding="utf-8") as handle:
                self._data = json.load(handle)
        except (json.JSONDecodeError, OSError):
            # Corrupted or unreadable file: keep in-memory state empty but do not lose the on-disk data.
            backup_path = self._path.with_suffix(self._path.suffix + ".bak")
            try:
                self._path.replace(backup_path)
            except OSError:
                pass
            self._data = {"items": []}
            self._save()

        # Ensure structure integrity.
        if "items" not in self._data or not isinstance(self._data["items"], list):
            self._data = {"items": []}
            self._save()
            return

        normalized: List[Dict[str, Any]] = []
        for raw_item in self._data.get("items", []):
            if isinstance(raw_item, dict):
                normalized.append(self._normalize_item(raw_item))
        self._data["items"] = normalized
        if self._ensure_settings():
            self._save()

    def _save(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self._path.with_suffix(".tmp")
        with tmp_path.open("w", encoding="utf-8") as handle:
            json.dump(self._data, handle, indent=2, ensure_ascii=True)
        tmp_path.replace(self._path)

    def all_items(self) -> List[Dict[str, Any]]:
        with self._lock:
            items = copy.deepcopy(self._data["items"])
        items.sort(key=lambda item: (item.get("order", 0), item.get("uploaded_at", "")))
        return items

    def add_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            item["order"] = self._next_order_locked()
            normalized = self._normalize_item(item)
            self._data["items"].append(normalized)
            self._save()
            return copy.deepcopy(normalized)

    def find_by_resource(self, resource: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            for item in self._data["items"]:
                if resource == item.get("filename"):
                    return copy.deepcopy(item)
                if resource == item.get("display_filename"):
                    return copy.deepcopy(item)
                for page in item.get("page_filenames", []):
                    if resource == page:
                        return copy.deepcopy(item)
        return None

    def find_by_filename(self, filename: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            for item in self._data["items"]:
                if item.get("filename") == filename:
                    return copy.deepcopy(item)
        return None

    def update_item(self, media_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            idx = self._index_for(media_id)
            self._data["items"][idx].update(updates)
            self._save()
            return copy.deepcopy(self._data["items"][idx])

    def delete_item(self, media_id: str) -> Dict[str, Any]:
        with self._lock:
            idx = self._index_for(media_id)
            removed = self._data["items"].pop(idx)
            self._save()
            return removed

    def set_order(self, new_order: List[str]) -> None:
        with self._lock:
            known_ids = {item["id"] for item in self._data["items"]}
            if set(new_order) != known_ids:
                raise ValueError("Order list must contain every media identifier exactly once.")
            order_map = {media_id: position for position, media_id in enumerate(new_order)}
            for item in self._data["items"]:
                item["order"] = order_map[item["id"]]
            self._save()

    def _index_for(self, media_id: str) -> int:
        for idx, item in enumerate(self._data["items"]):
            if item["id"] == media_id:
                return idx
        raise KeyError(media_id)

    def _next_order_locked(self) -> int:
        if not self._data["items"]:
            return 0
        return max(item.get("order", 0) for item in self._data["items"]) + 1


app = Flask(__name__, static_folder="static", static_url_path="/cardinaltv/static")
app.config["APPLICATION_ROOT"] = "/cardinaltv"
STATIC_ROUTE_PREFIX = (app.static_url_path or "/static").lstrip("/")
store = MediaStore(STATE_FILE)
bp = Blueprint("main", __name__, url_prefix="/cardinaltv")


def _item_with_urls(item: Dict[str, Any]) -> Dict[str, Any]:
    data = copy.deepcopy(item)

    def media_url(path: str) -> str:
        return url_for("main.serve_media", filename=path, _external=False)

    data["mimetype"] = data.get("mimetype") or _guess_mimetype(
        data.get("original_name"), data["filename"]
    ) or "application/octet-stream"

    data["url"] = media_url(item["filename"])
    data["thumbnail_url"] = data["url"]

    display_filename = data.get("display_filename") or data["filename"]
    data["display_filename"] = display_filename
    data["display_url"] = media_url(display_filename)
    data["display_mimetype"] = data.get("display_mimetype") or data["mimetype"]

    page_files = data.get("page_filenames") or []
    data["page_filenames"] = page_files
    data["page_urls"] = [media_url(path) for path in page_files]

    data["text_pages"] = data.get("text_pages") or []
    data["skip_rounds"] = int(data.get("skip_rounds") or 0)
    data["muted"] = bool(data.get("muted", False))
    data["uploaded_at"] = _serialize_datetime(data.get("uploaded_at")) or _now_iso()
    data["start_at"] = _serialize_datetime(data.get("start_at"))
    data["end_at"] = _serialize_datetime(data.get("end_at"))
    return data


def _is_item_active(item: Dict[str, Any], reference: Optional[datetime] = None) -> bool:
    if not item.get("enabled", True):
        return False
    moment = reference or _now()
    start_at = _parse_datetime(item.get("start_at"))
    end_at = _parse_datetime(item.get("end_at"))
    if start_at and moment < start_at:
        return False
    if end_at and moment > end_at:
        return False
    return True


@bp.route("/")
def index() -> Any:
    return render_template("index.html")


@bp.route("/slideshow")
def slideshow() -> Any:
    return render_template("slideshow.html")


@bp.route("/media/<path:filename>")
def serve_media(filename: str) -> Any:
    file_path = MEDIA_DIR / filename
    if not file_path.exists():
        abort(404, description="Media introuvable.")
    stored = store.find_by_resource(filename)
    mimetype = None
    if stored:
        if filename == stored.get("filename"):
            mimetype = stored.get("mimetype")
        elif filename == stored.get("display_filename"):
            mimetype = stored.get("display_mimetype")
        elif filename in stored.get("page_filenames", []):
            mimetype = "image/jpeg"
        mimetype = mimetype or stored.get("mimetype")
    mimetype = (
        mimetype
        or _guess_mimetype(filename)
        or _guess_mimetype(stored.get("original_name") if stored else None, filename)
        or "application/octet-stream"
    )
    return send_from_directory(
        MEDIA_DIR,
        filename,
        as_attachment=False,
        mimetype=mimetype,
    )


@bp.get("/api/settings")
def get_settings() -> Any:
    # Normalize logo_path so the frontend always receives a usable URL for the
    # application's static endpoint. The stored value may be absolute '/static/...'
    # or relative 'static/...'. Convert both into the correct URL produced by
    # Flask's `url_for('static', filename=...)` which respects the app's
    # `static_url_path` (here `/cardinaltv/static`). This avoids 404s when the
    # client tries to load an image from '/static/..' while the app serves
    # static files under '/cardinaltv/static/...'.
    settings = store.get_settings()
    try:
        overlay = settings.get("overlay") or {}
        logo = overlay.get("logo_path")
        if isinstance(logo, str) and logo:
            normalized_logo = _normalize_logo_path_value(logo)
            lower_normalized = normalized_logo.lower()
            if lower_normalized.startswith(("http://", "https://", "data:", "//")):
                overlay["logo_path"] = normalized_logo
            else:
                rel = normalized_logo
                if rel.startswith("static/"):
                    rel = rel[len("static/"):]
                rel = rel.lstrip("/")
                overlay["logo_path"] = url_for("static", filename=rel, _external=False)
    except Exception:
        # In case anything goes wrong, return the original settings unchanged.
        pass
    return jsonify(settings)


@bp.patch("/api/settings")
def update_settings_api() -> Any:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")
    try:
        updated = store.update_settings(payload)
    except ValueError as exc:
        abort(400, description=str(exc))
    return jsonify(updated)


@bp.get("/api/media")
def list_media() -> Any:
    active_only = request.args.get("active") == "1"
    items = []
    reference_time = _now()
    for item in store.all_items():
        if active_only and not _is_item_active(item, reference_time):
            continue
        items.append(_item_with_urls(item))
    return jsonify(items)


@bp.post("/api/log-useragent")
def log_useragent() -> Any:
    """Log user-agent information to a text file for debugging."""
    try:
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            abort(400, description="Requête invalide.")
        
        # Create logs directory if it doesn't exist
        logs_dir = DATA_DIR / "logs"
        logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Log file path
        log_file = logs_dir / "user-agents.txt"
        
        # Prepare log entry
        timestamp = payload.get("timestamp", datetime.now(QUEBEC_TZ).isoformat())
        user_agent = payload.get("userAgent", "Unknown")
        is_silk = payload.get("isAmazonSilk", False)
        is_firetv = payload.get("isFireTV", False)
        url = payload.get("url", "Unknown")
        
        log_entry = f"""
{'='*80}
Timestamp: {timestamp}
URL: {url}
Amazon Silk: {is_silk}
Fire TV: {is_firetv}
User-Agent: {user_agent}
{'='*80}

"""
        
        # Append to log file
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(log_entry)
        
        return jsonify({"success": True, "message": "User-agent logged successfully"})
    
    except Exception as e:
        print(f"Error logging user-agent: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@bp.post("/api/upload")
def upload_media() -> Any:
    files = request.files.getlist("files")
    if not files:
        abort(400, description="Aucun fichier reçu.")

    saved_items = []
    for uploaded in files:
        if not uploaded.filename:
            continue
        original_name = uploaded.filename
        safe_name = secure_filename(original_name) or "media"
        extension = Path(original_name).suffix or os.path.splitext(safe_name)[1]
        media_id = uuid.uuid4().hex
        storage_name = f"{media_id}{extension.lower()}" if extension else media_id
        file_path = MEDIA_DIR / storage_name
        uploaded.save(file_path)

        extension_lower = extension.lower()
        mimetype = _resolve_mimetype(uploaded.mimetype, original_name, storage_name)
        size_bytes = file_path.stat().st_size

        page_filenames: List[str] = []
        display_filename: Optional[str] = None
        display_mimetype: Optional[str] = None
        text_pages: List[str] = []

        if extension_lower in DOCUMENT_EXTENSIONS:
            base_folder = Path(safe_name).stem or media_id
            document_dir = _build_document_directory(base_folder, media_id)
            previews = _prepare_document_previews(
                media_id, file_path, extension_lower, document_dir
            )
            page_filenames = previews.get("page_filenames", []) or []
            display_mimetype = previews.get("display_mimetype")
            display_filename = previews.get("display_filename")
            text_pages = previews.get("text_pages", []) or []

        if page_filenames and not display_filename:
            display_filename = page_filenames[0]
        if not display_mimetype:
            display_mimetype = mimetype or "application/octet-stream"
        if not display_filename:
            display_filename = storage_name

        item = {
            "id": media_id,
            "filename": storage_name,
            "original_name": original_name,
            "uploaded_at": _now_iso(),
            "enabled": True,
            "duration": DEFAULT_DURATION_SECONDS,
            "start_at": None,
            "end_at": None,
            "mimetype": mimetype or "application/octet-stream",
            "size": size_bytes,
            "display_filename": display_filename,
            "display_mimetype": display_mimetype,
            "page_filenames": page_filenames,
            "text_pages": text_pages,
            "skip_rounds": 0,
            "muted": False,
        }
        saved_items.append(_item_with_urls(store.add_item(item)))

    if not saved_items:
        abort(400, description="Impossible d'enregistrer les fichiers fournis.")

    return jsonify({"items": saved_items})


@bp.patch("/api/media/<media_id>")
def update_media(media_id: str) -> Any:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")

    allowed_fields = {"enabled", "duration", "start_at", "end_at", "skip_rounds", "muted"}
    updates: Dict[str, Any] = {}
    for key in allowed_fields:
        if key in payload:
            updates[key] = payload[key]

    if "enabled" in updates:
        updates["enabled"] = bool(updates["enabled"])

    if "duration" in updates:
        try:
            duration = float(updates["duration"])
            if duration <= 0:
                raise ValueError
            updates["duration"] = duration
        except (ValueError, TypeError):
            abort(400, description="La durée doit être un nombre positif.")

    if "skip_rounds" in updates:
        try:
            skip_rounds = int(updates["skip_rounds"])
            if skip_rounds < 0:
                raise ValueError
            updates["skip_rounds"] = skip_rounds
        except (ValueError, TypeError):
            abort(400, description="Le nombre de passages à sauter doit être un entier positif.")

    if "muted" in updates:
        value = updates["muted"]
        if isinstance(value, str):
            updates["muted"] = value.strip().lower() in {"1", "true", "yes", "on"}
        else:
            updates["muted"] = bool(value)

    for key in ("start_at", "end_at"):
        if key in updates:
            value = updates[key]
            if value in ("", None):
                updates[key] = None
            elif not _parse_datetime(value):
                abort(400, description=f"Le champ {key} doit être au format ISO (YYYY-MM-DDTHH:MM).")
            else:
                updates[key] = _serialize_datetime(value)

    try:
        updated = store.update_item(media_id, updates)
    except KeyError:
        abort(404, description="Media introuvable.")

    return jsonify(_item_with_urls(updated))


@bp.delete("/api/media/<media_id>")
def delete_media(media_id: str) -> Any:
    try:
        removed = store.delete_item(media_id)
    except KeyError:
        abort(404, description="Media introuvable.")

    file_path = MEDIA_DIR / removed["filename"]
    if file_path.exists():
        file_path.unlink()

    display_filename = removed.get("display_filename")
    if display_filename and display_filename != removed["filename"]:
        display_path = MEDIA_DIR / display_filename
        if display_path.exists():
            display_path.unlink()

    for relative in removed.get("page_filenames", []):
        page_path = MEDIA_DIR / relative
        if page_path.exists():
            page_path.unlink()
        try:
            parent = page_path.parent
            if parent != MEDIA_DIR and parent.exists() and not any(parent.iterdir()):
                parent.rmdir()
        except OSError:
            pass

    return jsonify({"status": "ok"})



@app.route("/")
def root_redirect() -> Any:
    return redirect(url_for("main.index"))


@bp.post("/api/media/order")
def set_media_order() -> Any:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or "order" not in payload:
        abort(400, description="Requête invalide.")

    order = payload["order"]
    if not isinstance(order, list) or not all(isinstance(item, str) for item in order):
        abort(400, description="L'ordre doit être une liste d'identifiants.")

    try:
        store.set_order(order)
    except ValueError as exc:
        abort(400, description=str(exc))

    return jsonify({"status": "ok"})


app.register_blueprint(bp)


def run() -> None:
    app.run(host="0.0.0.0", port=39010, debug=False, threaded=True)


if __name__ == "__main__":
    run()
