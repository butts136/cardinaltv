<<<<<<< HEAD
from __future__ import annotations

import calendar
import copy
import html
import json
import math
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import uuid
import base64
from datetime import date, datetime, timedelta
from pathlib import Path
from threading import RLock
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:  # pragma: no cover - pillow is optional at runtime
    Image = ImageDraw = ImageFont = None
from flask import Blueprint, Flask, abort, jsonify, redirect, render_template, request, send_from_directory, url_for
from werkzeug.utils import secure_filename

try:
    from waitress import serve as waitress_serve
except ImportError:  # pragma: no cover - waitress is optional in development
    waitress_serve = None

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MEDIA_DIR = DATA_DIR / "images"
STATE_FILE = DATA_DIR / "media.json"
POWERPOINT_DIR = DATA_DIR / "powerpoint"
POWERPOINT_STATE_FILE = DATA_DIR / "powerpoint.json"
EMPLOYEE_DB_PATH = DATA_DIR / "employees" / "employees.db"
EMPLOYEE_JSON_PATH = DATA_DIR / "employees" / "employees.json"
TEMP_SLIDE_STATE_FILE = DATA_DIR / "temporary_slides.json"
TEMP_SLIDE_ASSETS_DIR = DATA_DIR / "temporary_assets"
TEAM_SLIDE_ASSETS_DIR = DATA_DIR / "team_slide_assets"
BIRTHDAY_SLIDE_ASSETS_DIR = DATA_DIR / "birthday" / "background"
BIRTHDAY_SLIDE_CONFIG_DIR = DATA_DIR / "birthday" / "config_slides"
DEFAULT_DURATION_SECONDS = 10
QUEBEC_TZ = ZoneInfo("America/Toronto")
TEXT_IMAGE_WIDTH = 1920
TEXT_IMAGE_HEIGHT = 1080
TEXT_IMAGE_MARGIN = 80
TEXT_IMAGE_BACKGROUND = "#FFFFFF"
TEXT_IMAGE_FOREGROUND = "#111111"
DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".md", ".rtf"}
PPT_EXTENSIONS = {".ppt", ".pptx", ".pps", ".ppsx"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".avif"}
VIDEO_EXTENSIONS = {".mp4", ".m4v", ".mov", ".webm", ".mkv"}

DEFAULT_SETTINGS = {
    "overlay": {
        "enabled": True,
        "mode": "clock",
        "height_vh": 5.0,
        "background_color": "#f0f0f0",
        "text_color": "#111111",
        "logo_path": "static/img/logo-groupe-cardinal.png",
        "ticker_text": "Bienvenue sur Cardinal TV",
    },
    # Settings for the auto-generated "Notre Équipe" slide.
    # For now only a simple on/off toggle and a fixed duration.
    "team_slide": {
        "enabled": False,
        # Zero-based index in the playlist where the auto slide should appear.
        # The value is clamped on the client to the current playlist length.
        "order_index": 0,
        # Duration in seconds when displayed in the slideshow.
        "duration": 10.0,
        # Minimum duration each employee card group should be visible.
        "card_min_duration": 10.0,
        # Relative filename (under TEAM_SLIDE_ASSETS_DIR) for the background media.
        "background_path": None,
        # Mimetype of the background media (image/* ou video/*).
        "background_mimetype": None,
        # Title options
        "title_enabled": False,
        "title_text": "",
        # Named position: 'top-left', 'top-center', 'top-right', 'center', 'bottom-left', etc.
        "title_position": "center",
        # Font size in pixels for rendering.
        "title_font_size": 48.0,
        # CSS color value for the text.
        "title_color": "#111111",
        # CSS color value for the title background.
        "title_background_color": None,
        # Underline decoration flag.
        "title_underline": False,
        # Rotation angle in degrees.
        "title_angle": 0.0,
        # Width of the text box in percent of slide width.
        "title_width_percent": 80.0,
        # Height of the text box in percent of slide height.
        "title_height_percent": 20.0,
        # Fine-grained offset in percent relative to the base position.
        "title_offset_x_percent": 0.0,
        "title_offset_y_percent": 0.0,
    },
    # Settings for the "Anniversaire" slide.
    "birthday_slide": {
        "enabled": False,
        "order_index": 0,
        "duration": 12.0,
        # Dedicated upload stored under BIRTHDAY_SLIDE_ASSETS_DIR.
        "background_path": None,
        "background_mimetype": None,
        # Existing media (image/video) that can be re-used as background.
        "background_media_id": None,
        # Titre affiché sur la diapositive.
        "title_text": "Anniversaire",
        "title_font_size": 64.0,
        "title_color": "#ffffff",
        # Position verticale du bloc titre+description (en % de la hauteur).
        "title_y_percent": 50.0,
    },
}

def _detect_libreoffice_command() -> Optional[str]:
    env_candidates = [
        os.environ.get("LIBREOFFICE_PATH"),
        os.environ.get("LIBREOFFICE_COMMAND"),
        os.environ.get("SOFFICE_PATH"),
    ]
    for raw in env_candidates:
        if not raw:
            continue
        expanded = Path(raw).expanduser()
        if expanded.exists():
            return str(expanded)
        resolved = shutil.which(raw)
        if resolved:
            return resolved

    candidates: List[Path] = []

    if os.name == "nt":
        program_files = [
            Path(os.environ.get("ProgramFiles", "")),
            Path(os.environ.get("ProgramFiles(x86)", "")),
        ]
        for base in program_files:
            if base:
                candidates.append(base / "LibreOffice" / "program" / "soffice.exe")
    elif sys.platform == "darwin":
        candidates.append(Path("/Applications/LibreOffice.app/Contents/MacOS/soffice"))
    else:
        candidates.extend(
            [
                Path("/usr/bin/libreoffice"),
                Path("/usr/bin/soffice"),
                Path("/snap/bin/libreoffice"),
            ]
        )

    candidates.append(Path.home() / "bin" / "libreoffice.AppImage")

    for candidate in candidates:
        if candidate and candidate.exists():
            return str(candidate)

    for name in ("libreoffice", "soffice"):
        resolved = shutil.which(name)
        if resolved:
            return resolved

    return None


LIBREOFFICE_COMMAND = _detect_libreoffice_command()

MEDIA_DIR.mkdir(parents=True, exist_ok=True)
POWERPOINT_DIR.mkdir(parents=True, exist_ok=True)
TEMP_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
BIRTHDAY_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
BIRTHDAY_SLIDE_CONFIG_DIR.mkdir(parents=True, exist_ok=True)

STATIC_ROUTE_PREFIX = "static"

BIRTHDAY_VARIANTS = {"before", "day", "weekend"}
BIRTHDAY_CONFIG_DEFAULT = {
    "title": "Anniversaire à venir",
    "subtitle": "Dans [days] jours, ce sera la fête",
    "body": "Saurez vous deviner qui est-ce ?",
    "background_path": None,
    "background_mimetype": None,
}


def _natural_key(value: str) -> List[Any]:
    parts = re.split(r"(\d+)", value.lower())
    key: List[Any] = []
    for part in parts:
        if not part:
            continue
        if part.isdigit():
            try:
                key.append(int(part))
            except ValueError:
                key.append(part)
        else:
            key.append(part)
    return key


def _ensure_number(
    value: Any,
    default: float,
    *,
    minimum: Optional[float] = None,
    maximum: Optional[float] = None,
    integer: bool = False,
) -> float | int:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = float(default)
    else:
        if math.isnan(number) or math.isinf(number):
            number = float(default)
    if minimum is not None and number < minimum:
        number = minimum
    if maximum is not None and number > maximum:
        number = maximum
    if integer:
        return int(round(number))


def _read_birthday_config(variant: str) -> Dict[str, Any]:
    if variant not in BIRTHDAY_VARIANTS:
        raise ValueError("Type de diapositive anniversaire invalide.")
    config_path = BIRTHDAY_SLIDE_CONFIG_DIR / f"{variant}.json"
    if not config_path.exists():
        return copy.deepcopy(BIRTHDAY_CONFIG_DEFAULT)
    try:
        with config_path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, dict):
            return copy.deepcopy(BIRTHDAY_CONFIG_DEFAULT)
        merged = copy.deepcopy(BIRTHDAY_CONFIG_DEFAULT)
        if isinstance(data.get("title"), str):
            merged["title"] = data["title"]
        if isinstance(data.get("subtitle"), str):
            merged["subtitle"] = data["subtitle"]
        if isinstance(data.get("body"), str):
            merged["body"] = data["body"]
        if isinstance(data.get("background_path"), str):
            merged["background_path"] = data["background_path"] or None
        if isinstance(data.get("background_mimetype"), str):
            merged["background_mimetype"] = data["background_mimetype"] or None
        return merged
    except (json.JSONDecodeError, OSError):
        return copy.deepcopy(BIRTHDAY_CONFIG_DEFAULT)


def _write_birthday_config(variant: str, config: Dict[str, Any]) -> Dict[str, Any]:
    if variant not in BIRTHDAY_VARIANTS:
        raise ValueError("Type de diapositive anniversaire invalide.")
    normalized = copy.deepcopy(BIRTHDAY_CONFIG_DEFAULT)
    if isinstance(config.get("title"), str):
        normalized["title"] = config["title"]
    if isinstance(config.get("subtitle"), str):
        normalized["subtitle"] = config["subtitle"]
    if isinstance(config.get("body"), str):
        normalized["body"] = config["body"]
    if "background_path" in config:
        if config["background_path"] is None:
            normalized["background_path"] = None
        elif isinstance(config["background_path"], str):
            normalized["background_path"] = config["background_path"] or None
    if "background_mimetype" in config:
        if config["background_mimetype"] is None:
            normalized["background_mimetype"] = None
        elif isinstance(config["background_mimetype"], str):
            normalized["background_mimetype"] = config["background_mimetype"] or None
    config_path = BIRTHDAY_SLIDE_CONFIG_DIR / f"{variant}.json"
    config_path.parent.mkdir(parents=True, exist_ok=True)
    with config_path.open("w", encoding="utf-8") as handle:
        json.dump(normalized, handle, ensure_ascii=True, indent=2)
    return normalized
    return number


def _sanitize_asset_name(value: Any) -> Optional[str]:
    if not value:
        return None
    try:
        text = str(value).strip()
    except Exception:
        return None
    if not text:
        return None
    return Path(text).name


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


def _render_pdf_to_images(source: Path, target_dir: Path, base_dir: Path = MEDIA_DIR) -> List[str]:
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
            try:
                relative_path = output_path.relative_to(base_dir)
                rendered_files.append(str(relative_path).replace("\\", "/"))
            except ValueError:
                rendered_files.append(str(output_path).replace("\\", "/"))
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


def _text_pages_to_images(target_dir: Path, pages: List[str], base_dir: Path = MEDIA_DIR) -> List[str]:
    if not pages:
        return []
    if Image is None or ImageDraw is None or ImageFont is None:
        # Pillow absent: skip generation but avoid crashing the app.
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
        try:
            relative_path = output_path.relative_to(base_dir)
            generated.append(str(relative_path).replace("\\", "/"))
        except ValueError:
            generated.append(str(output_path).replace("\\", "/"))

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


def _service_duration_components(start_raw: Optional[str]) -> tuple[int, int]:
    """Return (years, months) of service based on a start date string.

    The start date is expected to be an ISO datetime or date string.
    The result is clamped to (0, 0) for invalid or future dates.
    """
    if not start_raw:
        return 0, 0
    start_dt = _parse_datetime(start_raw)
    if not start_dt:
        try:
            # Accept several lightweight formats:
            # - full ISO datetime/date
            # - "YYYY-MM"
            # - "YYYY"
            if re.fullmatch(r"\d{4}-\d{2}-\d{2}", start_raw or ""):
                start_dt = datetime.fromisoformat(start_raw)  # type: ignore[arg-type]
            elif re.fullmatch(r"\d{4}-\d{2}", start_raw or ""):
                year_str, month_str = (start_raw or "").split("-")
                start_dt = datetime(int(year_str), int(month_str), 1, tzinfo=QUEBEC_TZ)
            elif re.fullmatch(r"\d{4}", start_raw or ""):
                start_dt = datetime(int(start_raw), 1, 1, tzinfo=QUEBEC_TZ)  # type: ignore[arg-type]
            else:
                start_dt = datetime.fromisoformat(start_raw)  # type: ignore[arg-type]
            if start_dt.tzinfo is None:
                start_dt = start_dt.replace(tzinfo=QUEBEC_TZ)
            else:
                start_dt = start_dt.astimezone(QUEBEC_TZ)
        except Exception:
            return 0, 0
    now = _now()
    if start_dt > now:
        return 0, 0
    year_diff = now.year - start_dt.year
    month_diff = now.month - start_dt.month
    day_diff = now.day - start_dt.day
    total_months = year_diff * 12 + month_diff
    if day_diff < 0:
        total_months -= 1
    if total_months < 0:
        total_months = 0
    years = total_months // 12
    months = total_months % 12
    return int(years), int(months)


def _years_of_service(created_at: Optional[str]) -> int:
    years, _ = _service_duration_components(created_at)
    return years


class MediaStore:
    def __init__(self, state_path: Path) -> None:
        self._path = state_path
        self._lock = RLock()
        self._data: Dict[str, Any] = {"items": []}
        # Backward/forward compatibility: prefer _load_state when available, otherwise _load.
        if hasattr(self, "_load_state"):
            self._load_state()
        else:  # pragma: no cover - legacy fallback
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

    def _normalize_team_slide(
        self, team_slide: Dict[str, Any], base: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        result = copy.deepcopy(base or DEFAULT_SETTINGS["team_slide"])
        for key, value in team_slide.items():
            if key == "enabled":
                result["enabled"] = bool(value)
            elif key == "order_index":
                try:
                    index = int(value)
                except (TypeError, ValueError):
                    continue
                if index < 0:
                    index = 0
                result["order_index"] = index
            elif key == "duration":
                try:
                    duration = float(value)
                except (TypeError, ValueError):
                    continue
                if duration < 1.0:
                    duration = 1.0
                if duration > 600.0:
                    duration = 600.0
                result["duration"] = duration
            elif key == "background_path":
                if value is None:
                    result["background_path"] = None
                else:
                    try:
                        text = str(value).strip()
                    except Exception:
                        continue
                    result["background_path"] = text or None
            elif key == "background_mimetype":
                if value is None:
                    result["background_mimetype"] = None
                else:
                    try:
                        text = str(value).strip()
                    except Exception:
                        continue
                    result["background_mimetype"] = text or None
            elif key == "card_min_duration":
                try:
                    card_duration = float(value)
                except (TypeError, ValueError):
                    continue
                if card_duration < 3.0:
                    card_duration = 3.0
                if card_duration > 600.0:
                    card_duration = 600.0
                result["card_min_duration"] = card_duration
            elif key == "title_enabled":
                result["title_enabled"] = bool(value)
            elif key == "title_text":
                try:
                    text = str(value)
                except Exception:
                    continue
                result["title_text"] = text
            elif key == "title_position":
                try:
                    text = str(value).strip().lower()
                except Exception:
                    continue
                # basic validation; fall back to 'center'
                if text in {
                    "top-left",
                    "top-center",
                    "top-right",
                    "center",
                    "bottom-left",
                    "bottom-center",
                    "bottom-right",
                }:
                    result["title_position"] = text
            elif key == "title_font_size":
                try:
                    size = float(value)
                except (TypeError, ValueError):
                    continue
                if size < 8.0:
                    size = 8.0
                if size > 200.0:
                    size = 200.0
                result["title_font_size"] = size
            elif key == "title_color":
                if isinstance(value, str) and value.strip():
                    result["title_color"] = value.strip()
            elif key == "title_background_color":
                if value is None:
                    result["title_background_color"] = None
                elif isinstance(value, str) and value.strip():
                    result["title_background_color"] = value.strip()
            elif key == "title_underline":
                result["title_underline"] = bool(value)
            elif key == "title_angle":
                try:
                    angle = float(value)
                except (TypeError, ValueError):
                    continue
                # clamp to a reasonable range
                if angle < -360.0:
                    angle = -360.0
                if angle > 360.0:
                    angle = 360.0
                result["title_angle"] = angle
            elif key == "title_width_percent":
                try:
                    width = float(value)
                except (TypeError, ValueError):
                    continue
                if width < 10.0:
                    width = 10.0
                if width > 100.0:
                    width = 100.0
                result["title_width_percent"] = width
            elif key == "title_height_percent":
                try:
                    height = float(value)
                except (TypeError, ValueError):
                    continue
                if height < 5.0:
                    height = 5.0
                if height > 100.0:
                    height = 100.0
                result["title_height_percent"] = height
            elif key == "title_offset_x_percent":
                try:
                    offset_x = float(value)
                except (TypeError, ValueError):
                    continue
                if offset_x < -50.0:
                    offset_x = -50.0
                if offset_x > 50.0:
                    offset_x = 50.0
                result["title_offset_x_percent"] = offset_x
            elif key == "title_offset_y_percent":
                try:
                    offset_y = float(value)
                except (TypeError, ValueError):
                    continue
                if offset_y < -50.0:
                    offset_y = -50.0
                if offset_y > 50.0:
                    offset_y = 50.0
                result["title_offset_y_percent"] = offset_y
        return result

    def _normalize_birthday_slide(
        self, birthday_slide: Dict[str, Any], base: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        result = copy.deepcopy(base or DEFAULT_SETTINGS["birthday_slide"])
        for key, value in birthday_slide.items():
            if key == "enabled":
                result["enabled"] = bool(value)
            elif key == "order_index":
                try:
                    index = int(value)
                except (TypeError, ValueError):
                    continue
                if index < 0:
                    index = 0
                result["order_index"] = index
            elif key == "duration":
                try:
                    duration = float(value)
                except (TypeError, ValueError):
                    continue
                if duration < 1.0:
                    duration = 1.0
                if duration > 600.0:
                    duration = 600.0
                result["duration"] = duration
            elif key == "background_path":
                if value is None:
                    result["background_path"] = None
                else:
                    try:
                        text = str(value).strip()
                    except Exception:
                        continue
                    result["background_path"] = text or None
            elif key == "background_mimetype":
                if value is None:
                    result["background_mimetype"] = None
                elif isinstance(value, str) and value.strip():
                    result["background_mimetype"] = value.strip()
            elif key == "background_media_id":
                if value is None:
                    result["background_media_id"] = None
                elif isinstance(value, str):
                    result["background_media_id"] = value.strip() or None
            elif key == "title_text":
                if isinstance(value, str):
                    result["title_text"] = value
            elif key == "title_font_size":
                try:
                    size = float(value)
                except (TypeError, ValueError):
                    continue
                if size < 8.0:
                    size = 8.0
                if size > 200.0:
                    size = 200.0
                result["title_font_size"] = size
            elif key == "title_color":
                if isinstance(value, str) and value.strip():
                    result["title_color"] = value.strip()
            elif key == "title_y_percent":
                try:
                    pos = float(value)
                except (TypeError, ValueError):
                    continue
                if pos < 0.0:
                    pos = 0.0
                if pos > 100.0:
                    pos = 100.0
                result["title_y_percent"] = pos
        return result

    def _ensure_settings(self) -> bool:
        settings = self._data.get("settings")
        if not isinstance(settings, dict):
            settings = {}
        overlay = settings.get("overlay")
        if not isinstance(overlay, dict):
            overlay = {}
        team_slide = settings.get("team_slide")
        if not isinstance(team_slide, dict):
            team_slide = {}
        birthday_slide = settings.get("birthday_slide")
        if not isinstance(birthday_slide, dict):
            birthday_slide = {}
        normalized_overlay = self._normalize_overlay(overlay, DEFAULT_SETTINGS["overlay"])
        normalized_team = self._normalize_team_slide(team_slide, DEFAULT_SETTINGS["team_slide"])
        normalized_birthday = self._normalize_birthday_slide(
            birthday_slide, DEFAULT_SETTINGS["birthday_slide"]
        )
        normalized_settings = {
            "overlay": normalized_overlay,
            "team_slide": normalized_team,
            "birthday_slide": normalized_birthday,
        }
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
            handled = False
            if "overlay" in updates:
                overlay_updates = updates["overlay"]
                if not isinstance(overlay_updates, dict):
                    raise ValueError("Le bloc overlay doit être un objet.")
                current_overlay = self._data["settings"]["overlay"]
                normalized = self._normalize_overlay(overlay_updates, current_overlay)
                self._data["settings"]["overlay"] = normalized
                handled = True
            if "team_slide" in updates:
                team_updates = updates["team_slide"]
                if not isinstance(team_updates, dict):
                    raise ValueError("Le bloc team_slide doit être un objet.")
                current_team = self._data["settings"].get("team_slide") or DEFAULT_SETTINGS["team_slide"]
                normalized_team = self._normalize_team_slide(team_updates, current_team)
                self._data["settings"]["team_slide"] = normalized_team
                handled = True
            if "birthday_slide" in updates:
                birthday_updates = updates["birthday_slide"]
                if not isinstance(birthday_updates, dict):
                    raise ValueError("Le bloc birthday_slide doit être un objet.")
                current_birthday = (
                    self._data["settings"].get("birthday_slide") or DEFAULT_SETTINGS["birthday_slide"]
                )
                normalized_birthday = self._normalize_birthday_slide(birthday_updates, current_birthday)
                self._data["settings"]["birthday_slide"] = normalized_birthday
                handled = True
            if not handled:
                raise ValueError("Aucun paramètre à mettre à jour.")
            self._save()
            return copy.deepcopy(self._data["settings"])

    def _load_state(self) -> None:
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

    # Legacy alias to keep compatibility with previous calls.
    def _load(self) -> None:
        self._load_state()

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


class PowerpointStore:
    def __init__(self, state_path: Path) -> None:
        self._path = state_path
        self._lock = RLock()
        self._data: Dict[str, Any] = {"items": []}
        self._load()

    def _normalize_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        normalized = dict(item)
        normalized.setdefault("display_filename", normalized.get("filename"))
        normalized.setdefault("display_mimetype", normalized.get("mimetype"))
        normalized.setdefault("page_filenames", [])
        normalized.setdefault("text_pages", [])
        normalized.setdefault("pdf_filename", "")
        normalized.setdefault("slide_filenames", [])
        normalized.setdefault("html_filename", "")
        normalized.setdefault("thumbnail_filename", "")
        normalized.setdefault("duration", DEFAULT_DURATION_SECONDS)
        normalized.setdefault("size", 0)
        normalized.setdefault("mimetype", "application/octet-stream")
        normalized.setdefault("skip_rounds", 0)
        normalized.setdefault("muted", False)

        page_files = normalized.get("page_filenames")
        if not isinstance(page_files, list):
            normalized["page_filenames"] = []

        text_pages = normalized.get("text_pages")
        if not isinstance(text_pages, list):
            normalized["text_pages"] = []

        slide_files = normalized.get("slide_filenames")
        if not isinstance(slide_files, list):
            normalized["slide_filenames"] = []
        else:
            normalized["slide_filenames"] = [
                str(value)
                for value in slide_files
                if isinstance(value, (str, os.PathLike)) and str(value)
            ]

        thumb_rel = normalized.get("thumbnail_filename")
        if not isinstance(thumb_rel, (str, os.PathLike)):
            thumb_rel_str = ""
        else:
            thumb_rel_str = str(thumb_rel)
        if not thumb_rel_str and normalized["slide_filenames"]:
            thumb_rel_str = normalized["slide_filenames"][0]
        normalized["thumbnail_filename"] = thumb_rel_str

        uploaded_at = normalized.get("uploaded_at")
        if uploaded_at:
            normalized["uploaded_at"] = _serialize_datetime(uploaded_at) or _now_iso()
        else:
            normalized["uploaded_at"] = _now_iso()

        if not isinstance(normalized.get("html_filename"), str):
            normalized["html_filename"] = ""

        return normalized

    def _load(self) -> None:
        if not self._path.exists():
            self._save()
            return
        try:
            with self._path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
        except (json.JSONDecodeError, OSError):
            backup_path = self._path.with_suffix(self._path.suffix + ".bak")
            try:
                self._path.replace(backup_path)
            except OSError:
                pass
            self._data = {"items": []}
            self._save()
            return

        items = []
        for entry in data.get("items", []):
            if isinstance(entry, dict):
                items.append(self._normalize_item(entry))
        self._data = {"items": items}

    def _save(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self._path.with_suffix(".tmp")
        with tmp_path.open("w", encoding="utf-8") as handle:
            json.dump(self._data, handle, indent=2, ensure_ascii=True)
        tmp_path.replace(self._path)

    def all_items(self) -> List[Dict[str, Any]]:
        with self._lock:
            items = copy.deepcopy(self._data["items"])
        items.sort(key=lambda item: item.get("uploaded_at", ""), reverse=True)
        return items

    def add_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        normalized = self._normalize_item(item)
        with self._lock:
            existing_ids = {entry.get("id") for entry in self._data["items"]}
            if normalized.get("id") in existing_ids:
                self._data["items"] = [
                    normalized if entry.get("id") == normalized["id"] else entry
                    for entry in self._data["items"]
                ]
            else:
                self._data["items"].append(normalized)
            self._save()
            return copy.deepcopy(normalized)

    def find_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            for entry in self._data["items"]:
                if entry.get("id") == item_id:
                    return copy.deepcopy(entry)
        return None

    def find_by_resource(self, resource: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            for entry in self._data["items"]:
                candidates = [
                    entry.get("filename"),
                    entry.get("display_filename"),
                    *(entry.get("page_filenames") or []),
                    *(entry.get("slide_filenames") or []),
                    entry.get("html_filename"),
                ]
                for candidate in candidates:
                    if candidate == resource:
                        return copy.deepcopy(entry)
        return None

    def delete_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            for index, entry in enumerate(self._data["items"]):
                if entry.get("id") == item_id:
                    removed = self._data["items"].pop(index)
                    self._save()
                    return copy.deepcopy(removed)
        return None


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


class EmployeeStore:
    def __init__(self, db_path: Path) -> None:
        self._json_path = EMPLOYEE_JSON_PATH
        self._lock = RLock()
        self._employees: List[Dict[str, Any]] = []
        self._load()

    def _load(self) -> None:
        self._json_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            with self._json_path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
        except Exception:
            data = []
        if not isinstance(data, list):
            data = []
        dirty = False
        normalized: List[Dict[str, Any]] = []
        for idx, entry in enumerate(data):
            norm = self._normalize_entry(entry, idx)
            if norm != entry:
                dirty = True
            normalized.append(norm)
        self._employees = normalized
        if dirty:
            self._save()

    def _save(self) -> None:
        try:
            with self._json_path.open("w", encoding="utf-8") as handle:
                json.dump(self._employees, handle, ensure_ascii=False, indent=2)
        except Exception as exc:  # pragma: no cover
            print(f"[employees] Impossible d'écrire {self._json_path}: {exc}", file=sys.stderr)

    def _maybe_reload_from_disk(self) -> None:
        # Recharge systématiquement pour refléter le JSON actuel.
        self._load()

    def _normalize_entry(self, entry: Dict[str, Any], fallback_order: int = 0) -> Dict[str, Any]:
        now_iso = _now_iso()
        hire_date = str(entry.get("hire_date") or "").strip()
        years, months = _service_duration_components(hire_date) if hire_date else (None, None)
        return {
            "id": str(entry.get("id") or uuid.uuid4().hex),
            "name": str(entry.get("name") or "").strip(),
            "birthday": str(entry.get("birthday") or "").strip(),
            "hire_date": hire_date,
            "role": str(entry.get("role") or "").strip(),
            "description": str(entry.get("description") or "").strip(),
            "avatar_base64": entry.get("avatar_base64") or "",
            "sort_order": _safe_int(entry.get("sort_order"), fallback_order + 1),
            "created_at": str(entry.get("created_at") or now_iso),
            "updated_at": str(entry.get("updated_at") or now_iso),
            "years_of_service_years": years,
            "years_of_service_months": months,
        }

    def list_employees(self) -> List[Dict[str, Any]]:
        with self._lock:
            self._maybe_reload_from_disk()
            ordered = sorted(
                self._employees,
                key=lambda e: (e.get("sort_order", 0), (e.get("name") or "").lower()),
            )
            return copy.deepcopy(ordered)

    def add_employee(self, name: str, birthday: str, role: str, description: str, hire_date: str | None = None) -> Dict[str, Any]:
        name = (name or "").strip()
        if not name:
            raise ValueError("Le nom est requis.")
        now_iso = _now_iso()
        employee_id = uuid.uuid4().hex
        with self._lock:
            next_order = max([_safe_int(e.get("sort_order"), 0) for e in self._employees] or [0]) + 1
            entry = self._normalize_entry(
                {
                    "id": employee_id,
                    "name": name,
                    "birthday": (birthday or "").strip(),
                    "hire_date": (hire_date or "").strip(),
                    "role": (role or "").strip(),
                    "description": (description or "").strip(),
                    "avatar_base64": "",
                    "sort_order": next_order,
                    "created_at": now_iso,
                    "updated_at": now_iso,
                }
            )
            self._employees.append(entry)
            self._save()
            return copy.deepcopy(entry)

    def update_employee(self, employee_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(updates, dict):
            raise ValueError("Paramètres invalides.")
        with self._lock:
            for idx, emp in enumerate(self._employees):
                if emp["id"] == employee_id:
                    updated = {**emp}
                    if "name" in updates:
                        new_name = str(updates["name"]).strip()
                        if not new_name:
                            raise ValueError("Le nom est requis.")
                        updated["name"] = new_name
                    if "birthday" in updates:
                        updated["birthday"] = str(updates["birthday"] or "").strip()
                    if "hire_date" in updates:
                        updated["hire_date"] = str(updates["hire_date"] or "").strip()
                    if "role" in updates:
                        updated["role"] = str(updates["role"] or "").strip()
                    if "description" in updates:
                        updated["description"] = str(updates["description"] or "").strip()
                    updated["updated_at"] = _now_iso()
                    updated = self._normalize_entry(updated, _safe_int(updated.get("sort_order"), idx + 1))
                    self._employees[idx] = updated
                    self._save()
                    return copy.deepcopy(updated)
        raise KeyError(employee_id)

    def delete_employee(self, employee_id: str) -> None:
        with self._lock:
            before = len(self._employees)
            self._employees = [e for e in self._employees if e["id"] != employee_id]
            if len(self._employees) == before:
                raise KeyError(employee_id)
            self._save()

    def set_avatar(self, employee_id: str, uploaded: Any) -> Dict[str, Any]:
        if not uploaded or not getattr(uploaded, "filename", None):
            raise ValueError("Aucun fichier reçu.")
        ext = Path(uploaded.filename).suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"}:
            raise ValueError("Format d'image non supporté.")
        data = uploaded.read()
        if not isinstance(data, (bytes, bytearray)):
            raise ValueError("Fichier invalide.")
        avatar_b64 = base64.b64encode(data).decode("ascii")
        now_iso = _now_iso()
        with self._lock:
            for idx, emp in enumerate(self._employees):
                if emp["id"] == employee_id:
                    updated = {**emp, "avatar_base64": avatar_b64, "updated_at": now_iso}
                    updated = self._normalize_entry(updated, _safe_int(updated.get("sort_order"), idx + 1))
                    self._employees[idx] = updated
                    self._save()
                    return copy.deepcopy(updated)
        raise KeyError(employee_id)

    def clear_avatar(self, employee_id: str) -> Dict[str, Any]:
        now_iso = _now_iso()
        with self._lock:
            for idx, emp in enumerate(self._employees):
                if emp["id"] == employee_id:
                    updated = {**emp, "avatar_base64": "", "updated_at": now_iso}
                    updated = self._normalize_entry(updated, _safe_int(updated.get("sort_order"), idx + 1))
                    self._employees[idx] = updated
                    self._save()
                    return copy.deepcopy(updated)
        raise KeyError(employee_id)

    def update_order(self, ordered_ids: List[str]) -> List[Dict[str, Any]]:
        if not isinstance(ordered_ids, list):
            raise ValueError("Ordre invalide.")
        with self._lock:
            existing_ids = {e["id"] for e in self._employees}
            for emp_id in ordered_ids:
                if emp_id not in existing_ids:
                    raise KeyError(emp_id)
            order_map = {emp_id: idx + 1 for idx, emp_id in enumerate(ordered_ids)}
            updated_list = []
            for emp in self._employees:
                new_order = order_map.get(emp["id"], emp.get("sort_order", 0))
                updated = {**emp, "sort_order": new_order, "updated_at": _now_iso()}
                updated_list.append(self._normalize_entry(updated, new_order))
            self._employees = updated_list
            self._save()
            return self.list_employees()


class TemporarySlideStore:
    def __init__(self, state_path: Path, assets_dir: Path) -> None:
        self._path = state_path
        self._assets_dir = assets_dir
        self._lock = RLock()
        self._data: Dict[str, Any] = {"slides": []}
        self._load()

    def _normalize_elements(self, elements: Any) -> List[Dict[str, Any]]:
        if not isinstance(elements, list):
            return []
        normalized: List[Dict[str, Any]] = []
        for entry in elements:
            if not isinstance(entry, dict):
                continue
            element_type_raw = entry.get("type") or "text"
            element_type = str(element_type_raw).lower()
            if element_type not in {"text", "image", "video"}:
                element_type = "text"
            try:
                text_value = str(entry.get("text") or "")
            except Exception:
                text_value = ""
            asset_name = _sanitize_asset_name(entry.get("asset"))
            mimetype_raw = entry.get("mimetype") or entry.get("asset_mimetype")
            mimetype_value = (
                str(mimetype_raw).strip()
                if isinstance(mimetype_raw, str) and mimetype_raw
                else None
            )
            if element_type == "text":
                asset_name = None
            style_source = entry.get("style")
            style_map = style_source if isinstance(style_source, dict) else {}
            width_default = 60.0 if element_type == "text" else 30.0
            height_default = 22.0 if element_type == "text" else 30.0
            font_default = 48.0 if element_type == "text" else 32.0
            align_raw = str(style_map.get("align") or "center").lower()
            if align_raw not in {"left", "center", "right"}:
                align_raw = "center"
            style = {
                "x": _ensure_number(style_map.get("x"), 50.0, minimum=0.0, maximum=100.0),
                "y": _ensure_number(style_map.get("y"), 50.0, minimum=0.0, maximum=100.0),
                "width": _ensure_number(
                    style_map.get("width"),
                    width_default,
                    minimum=5.0,
                    maximum=100.0,
                ),
                "height": _ensure_number(
                    style_map.get("height"),
                    height_default,
                    minimum=5.0,
                    maximum=100.0,
                ),
                "fontSize": _ensure_number(
                    style_map.get("fontSize"),
                    font_default,
                    minimum=8.0,
                    maximum=200.0,
                ),
                "color": str(style_map.get("color") or "#ffffff"),
                "align": align_raw,
                "rotation": _ensure_number(
                    style_map.get("rotation"),
                    0.0,
                    minimum=-360.0,
                    maximum=360.0,
                ),
                "opacity": _ensure_number(
                    style_map.get("opacity"),
                    1.0,
                    minimum=0.0,
                    maximum=1.0,
                ),
                "z": _ensure_number(
                    style_map.get("z"),
                    10,
                    minimum=0,
                    maximum=9999,
                    integer=True,
                ),
            }
            normalized.append(
                {
                    "id": entry.get("id") or uuid.uuid4().hex,
                    "type": element_type,
                    "text": text_value,
                    "asset": asset_name,
                    "mimetype": mimetype_value,
                    "style": style,
                    "muted": bool(entry.get("muted", True)),
                }
            )
        return normalized

    def _normalize_background(self, background: Any) -> Dict[str, Any]:
        if not isinstance(background, dict):
            background = {}
        background_type = str(background.get("type") or "color").lower()
        if background_type not in {"color", "image", "video"}:
            background_type = "color"
        raw_value = background.get("value")
        if background_type == "color":
            try:
                value = str(raw_value or "#1c1f2b").strip() or "#1c1f2b"
            except Exception:
                value = "#1c1f2b"
        else:
            value = _sanitize_asset_name(raw_value) or ""
        overlay_raw = background.get("overlay")
        if overlay_raw in (None, "", False):
            overlay_value: Optional[float] = None
        else:
            overlay_value = float(
                _ensure_number(overlay_raw, 0.35, minimum=0.0, maximum=0.95)
            )
        mimetype = background.get("mimetype")
        mimetype_text = (
            str(mimetype).strip() if isinstance(mimetype, str) and mimetype else None
        )
        return {
            "type": background_type,
            "value": value,
            "overlay": overlay_value,
            "mimetype": mimetype_text,
        }

    def _normalize_slide(self, slide: Dict[str, Any]) -> Dict[str, Any]:
        now_iso = _now_iso()
        raw_label = slide.get("label")
        try:
            label = str(raw_label or "Diapositive temporaire").strip()
        except Exception:
            label = "Diapositive temporaire"
        if not label:
            label = "Diapositive temporaire"
        label = label[:240]
        duration_value = _ensure_number(
            slide.get("duration"),
            DEFAULT_DURATION_SECONDS,
            minimum=3.0,
            maximum=3600.0,
        )
        created_at = _serialize_datetime(slide.get("created_at")) or now_iso
        updated_at = _serialize_datetime(slide.get("updated_at")) or now_iso

        normalized = {
            "id": slide.get("id") or uuid.uuid4().hex,
            "label": label,
            "duration": float(duration_value),
            "starts_at": _serialize_datetime(slide.get("starts_at")),
            "expires_at": _serialize_datetime(slide.get("expires_at")),
            "background": self._normalize_background(slide.get("background")),
            "elements": self._normalize_elements(slide.get("elements")),
            "muted": bool(slide.get("muted", True)),
            "created_at": created_at,
            "updated_at": updated_at,
        }
        return normalized

    def _load(self) -> None:
        if not self._path.exists():
            self._save()
            return
        try:
            with self._path.open("r", encoding="utf-8") as handle:
                raw = json.load(handle)
        except (json.JSONDecodeError, OSError):
            backup_path = self._path.with_suffix(self._path.suffix + ".bak")
            try:
                self._path.replace(backup_path)
            except OSError:
                pass
            self._data = {"slides": []}
            self._save()
            return
        slides = []
        for entry in raw.get("slides", []):
            if isinstance(entry, dict):
                slides.append(self._normalize_slide(entry))
        self._data = {"slides": slides}

    def _save(self) -> None:
        state = {"slides": [self._normalize_slide(slide) for slide in self._data.get("slides", [])]}
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = self._path.with_suffix(".tmp")
        with tmp_path.open("w", encoding="utf-8") as handle:
            json.dump(state, handle, indent=2, ensure_ascii=True)
        tmp_path.replace(self._path)
        self._data = state

    def list_slides(self) -> List[Dict[str, Any]]:
        with self._lock:
            return copy.deepcopy(self._data["slides"])

    def add_slide(self, slide: Dict[str, Any]) -> Dict[str, Any]:
        normalized = self._normalize_slide(slide)
        with self._lock:
            normalized["created_at"] = _now_iso()
            normalized["updated_at"] = normalized["created_at"]
            self._data["slides"].append(normalized)
            self._save()
            return copy.deepcopy(normalized)

    def update_slide(self, slide_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(updates, dict):
            raise ValueError("Paramètres invalides.")
        with self._lock:
            for slide in self._data["slides"]:
                if slide.get("id") != slide_id:
                    continue
                if "label" in updates:
                    slide["label"] = str(updates["label"] or slide["label"])
                if "duration" in updates:
                    try:
                        duration = float(updates["duration"])
                    except (TypeError, ValueError):
                        raise ValueError("Durée invalide.")
                    if not math.isfinite(duration) or duration <= 0:
                        raise ValueError("Durée invalide.")
                    slide["duration"] = max(3.0, min(duration, 3600.0))
                if "starts_at" in updates:
                    slide["starts_at"] = _serialize_datetime(updates["starts_at"])
                if "expires_at" in updates:
                    slide["expires_at"] = _serialize_datetime(updates["expires_at"])
                if "muted" in updates:
                    slide["muted"] = bool(updates["muted"])
                if "background" in updates and isinstance(updates["background"], dict):
                    slide["background"] = self._normalize_background(updates["background"])
                if "elements" in updates:
                    slide["elements"] = self._normalize_elements(updates["elements"])
                slide["updated_at"] = _now_iso()
                self._save()
                return copy.deepcopy(slide)
        raise KeyError(slide_id)

    def delete_slide(self, slide_id: str) -> None:
        with self._lock:
            for index, slide in enumerate(self._data["slides"]):
                if slide.get("id") == slide_id:
                    self._data["slides"].pop(index)
                    self._save()
                    return
        raise KeyError(slide_id)

    def save_asset(self, uploaded: Any) -> Dict[str, Any]:
        if not uploaded or not getattr(uploaded, "filename", None):
            raise ValueError("Aucun fichier reçu.")
        extension = Path(uploaded.filename).suffix.lower()
        if extension not in IMAGE_EXTENSIONS | VIDEO_EXTENSIONS:
            raise ValueError("Format non supporté.")
        filename = f"{uuid.uuid4().hex}{extension}"
        target = self._assets_dir / filename
        uploaded.save(target)
        mimetype = _resolve_mimetype(getattr(uploaded, "content_type", None), uploaded.filename, filename)
        return {"filename": filename, "mimetype": mimetype}

    def generate_active_slides(self, reference: datetime) -> List[Dict[str, Any]]:
        with self._lock:
            slides = copy.deepcopy(self._data["slides"])

        active: List[Dict[str, Any]] = []
        for index, slide in enumerate(slides):
            start_at = _parse_datetime(slide.get("starts_at"))
            end_at = _parse_datetime(slide.get("expires_at"))
            if start_at and reference < start_at:
                continue
            if end_at and reference > end_at:
                continue

            active.append(
                {
                    "id": slide["id"],
                    "kind": "temporary",
                    "order": 1_200_000 + index,
                    "duration": slide.get("duration") or DEFAULT_DURATION_SECONDS,
                    "enabled": True,
                    "muted": bool(slide.get("muted", True)),
                    "uploaded_at": slide.get("created_at") or _now_iso(),
                    "start_at": slide.get("starts_at"),
                    "end_at": slide.get("expires_at"),
                    "display_mimetype": "application/vnd.cardinaltv.temporary+json",
                    "metadata": {
                        "label": slide.get("label"),
                        "background": slide.get("background"),
                        "elements": slide.get("elements"),
                    },
                }
            )

        return active


app = Flask(__name__, static_folder="static", static_url_path="/cardinaltv/static")
app.config["APPLICATION_ROOT"] = "/cardinaltv"
STATIC_ROUTE_PREFIX = (app.static_url_path or "/static").lstrip("/")
store = MediaStore(STATE_FILE)
powerpoint_store = PowerpointStore(POWERPOINT_STATE_FILE)
employee_store = EmployeeStore(EMPLOYEE_DB_PATH)
temporary_slides = TemporarySlideStore(TEMP_SLIDE_STATE_FILE, TEMP_SLIDE_ASSETS_DIR)
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


def _powerpoint_item_with_urls(item: Dict[str, Any]) -> Dict[str, Any]:
    data = copy.deepcopy(item)

    def ppt_url(path: str) -> str:
        return url_for("main.serve_powerpoint", filename=path, _external=False)

    data["mimetype"] = data.get("mimetype") or _guess_mimetype(
        data.get("original_name"), data.get("filename")
    ) or "application/octet-stream"

    filename = data.get("filename") or ""
    data["url"] = ppt_url(filename)

    pdf_filename = data.get("pdf_filename") or ""
    if pdf_filename:
        data["pdf_url"] = ppt_url(pdf_filename)

    html_filename = data.get("html_filename") or ""
    if html_filename:
        data["html_url"] = ppt_url(html_filename)

    slide_filenames = data.get("slide_filenames") or []
    slide_urls = [ppt_url(path) for path in slide_filenames]
    data["slide_urls"] = slide_urls
    data["slide_count"] = len(slide_urls)
    thumb_rel = data.get("thumbnail_filename")
    if not isinstance(thumb_rel, str) or not thumb_rel:
        thumb_rel = slide_filenames[0] if slide_filenames else ""
    if thumb_rel:
        data["thumbnail_filename"] = thumb_rel
        data["thumbnail_url"] = ppt_url(thumb_rel)
    else:
        data.pop("thumbnail_url", None)
        data["thumbnail_filename"] = ""

    data["uploaded_at"] = _serialize_datetime(data.get("uploaded_at")) or _now_iso()
    data["duration"] = float(data.get("duration") or DEFAULT_DURATION_SECONDS)
    data.pop("slide_filenames", None)
    data.pop("page_filenames", None)
    data.pop("text_pages", None)
    data.pop("display_filename", None)
    data.pop("display_mimetype", None)
    data.pop("html_filename", None)
    return data


def _temporary_slide_with_urls(slide: Dict[str, Any]) -> Dict[str, Any]:
    data = copy.deepcopy(slide)
    metadata_source = data.get("metadata")
    metadata = copy.deepcopy(metadata_source) if isinstance(metadata_source, dict) else {}

    background_source: Any = metadata.get("background")
    if not isinstance(background_source, dict):
        background_source = data.get("background")
    background = copy.deepcopy(background_source) if isinstance(background_source, dict) else {}
    background_type = background.get("type")
    background_value = background.get("value")
    background_url = None
    if (
        isinstance(background_type, str)
        and background_type in {"image", "video"}
        and isinstance(background_value, str)
        and background_value
    ):
        background_url = url_for(
            "main.serve_temporary_asset", filename=background_value, _external=False
        )
    background["asset_url"] = background_url
    metadata["background"] = background
    data["background"] = background

    elements_source = metadata.get("elements")
    if not isinstance(elements_source, list):
        elements_source = data.get("elements")
    elements: List[Dict[str, Any]] = []
    for entry in elements_source or []:
        if not isinstance(entry, dict):
            continue
        element = copy.deepcopy(entry)
        asset_value = element.get("asset")
        asset_url = None
        if isinstance(asset_value, str) and asset_value:
            asset_url = url_for(
                "main.serve_temporary_asset", filename=asset_value, _external=False
            )
        element["asset_url"] = asset_url
        if "style" not in element or not isinstance(element["style"], dict):
            element["style"] = {}
        elements.append(element)
    metadata["elements"] = elements
    data["elements"] = elements

    if "label" not in metadata:
        metadata["label"] = data.get("label")
    data["metadata"] = metadata
    data["page_filenames"] = []
    data["page_urls"] = []
    data["url"] = None
    data["display_url"] = None
    data["thumbnail_url"] = None
    display_mimetype = data.get("display_mimetype") or "application/vnd.cardinaltv.temporary+json"
    data["display_mimetype"] = display_mimetype
    data["mimetype"] = display_mimetype
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


@bp.route("/slideshow-editor")
def slideshow_editor() -> Any:
    return render_template("slideshow_editor.html")


@bp.route('/sw.js')
def serve_sw():
    # Serve the service worker script from the static directory under the blueprint
    sw_path = Path(__file__).resolve().parent / 'static' / 'js' / 'sw.js'
    if not sw_path.exists():
        abort(404)
    # send_from_directory expects directory and filename
    return send_from_directory(str(sw_path.parent), sw_path.name, mimetype='application/javascript')


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
        elif filename in stored.get("slide_filenames", []):
            mimetype = _guess_mimetype(filename) or "image/png"
        elif filename == stored.get("html_filename"):
            mimetype = "text/html"
        mimetype = mimetype or stored.get("mimetype")
    mimetype = (
        mimetype
        or _guess_mimetype(filename)
        or _guess_mimetype(stored.get("original_name") if stored else None, filename)
        or "application/octet-stream"
    )
    # Use send_from_directory to build the response, then set helpful caching
    # headers to encourage the browser to reuse cached media between slideshow
    # runs. Accept-Ranges is important for video playback (Range requests).
    resp = send_from_directory(
        MEDIA_DIR,
        filename,
        as_attachment=False,
        mimetype=mimetype,
    )
    try:
        # Cache media for 7 days and mark immutable when possible. This helps
        # subsequent slideshow runs to read from browser cache instead of
        # re-downloading. Server-side can adjust max-age as desired.
        resp.headers['Cache-Control'] = 'public, max-age=604800, immutable'
        # Indicate we support Range requests so browsers and players may
        # request partial content.
        resp.headers['Accept-Ranges'] = 'bytes'
    except Exception:
        # If headers cannot be modified for any reason, fall back to original
        # response.
        pass
    return resp



@bp.route("/powerpoint/<path:filename>")
def serve_powerpoint(filename: str) -> Any:
    file_path = POWERPOINT_DIR / filename
    if not file_path.exists():
        abort(404, description="Présentation introuvable.")
    stored = powerpoint_store.find_by_resource(filename)
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
    resp = send_from_directory(
        POWERPOINT_DIR,
        filename,
        as_attachment=False,
        mimetype=mimetype,
    )
    try:
        resp.headers["Cache-Control"] = "public, max-age=604800, immutable"
        resp.headers["Accept-Ranges"] = "bytes"
    except Exception:
        pass
    return resp



@bp.route("/powerpoint/<powerpoint_id>/pdf")
def get_powerpoint_pdf(powerpoint_id: str) -> Any:
    item = powerpoint_store.find_by_id(powerpoint_id)
    if not item:
        abort(404, description="Présentation introuvable.")

    if not LIBREOFFICE_COMMAND:
        abort(503, description="La conversion PDF est indisponible : LibreOffice introuvable sur le serveur.")
    
    pdf_filename = item.get("pdf_filename")
    if pdf_filename:
        pdf_path = POWERPOINT_DIR / pdf_filename
        if pdf_path.exists():
            return send_from_directory(
                POWERPOINT_DIR,
                pdf_filename,
                as_attachment=False,
                mimetype="application/pdf",
            )
    
    # PDF doesn't exist, try to convert
    ppt_filename = item.get("filename")
    if not ppt_filename:
        abort(404, description="Fichier PowerPoint introuvable.")
    
    ppt_path = POWERPOINT_DIR / ppt_filename
    if not ppt_path.exists():
        abort(404, description="Fichier PowerPoint introuvable.")
    
    # Convert to PDF
    pdf_filename = f"{powerpoint_id}.pdf"
    pdf_path = POWERPOINT_DIR / pdf_filename
    try:
        subprocess.run(
            [
                str(LIBREOFFICE_COMMAND),
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                str(POWERPOINT_DIR),
                str(ppt_path),
            ],
            check=True,
            timeout=300,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as exc:
        stderr_output = ""
        if isinstance(exc, subprocess.CalledProcessError):
            try:
                stderr_output = (exc.stderr or b"").decode("utf-8", errors="ignore").strip()
            except Exception:
                stderr_output = ""
        print(f"Failed to convert {ppt_filename} to PDF: {exc}\n{stderr_output}")
        abort(500, description="Échec de la conversion en PDF.")
    
    # Update the item with pdf_filename
    item["pdf_filename"] = pdf_filename
    powerpoint_store.add_item(item)
    
    return send_from_directory(
        POWERPOINT_DIR,
        pdf_filename,
        as_attachment=False,
        mimetype="application/pdf",
    )


@bp.route("/temporary-assets/<path:filename>")
def serve_temporary_asset(filename: str) -> Any:
    target = TEMP_SLIDE_ASSETS_DIR / filename
    if not target.exists():
        abort(404, description="Fichier introuvable.")
    return send_from_directory(
        TEMP_SLIDE_ASSETS_DIR,
        filename,
        as_attachment=False,
    )


@bp.route("/team-slide-assets/<path:filename>")
def serve_team_slide_asset(filename: str) -> Any:
    target = TEAM_SLIDE_ASSETS_DIR / filename
    if not target.exists():
        abort(404, description="Fichier introuvable.")
    return send_from_directory(
        TEAM_SLIDE_ASSETS_DIR,
        filename,
        as_attachment=False,
    )


@bp.route("/birthday-slide-assets/<path:filename>")
def serve_birthday_slide_asset(filename: str) -> Any:
    target = BIRTHDAY_SLIDE_ASSETS_DIR / filename
    if not target.exists():
        abort(404, description="Fichier introuvable.")
    return send_from_directory(
        BIRTHDAY_SLIDE_ASSETS_DIR,
        filename,
        as_attachment=False,
    )


@bp.route("/service-worker.js")
def service_worker() -> Any:
    # Servez le service worker depuis la racine pour couvrir tout le scope.
    sw_path = BASE_DIR / "static" / "service-worker.js"
    if not sw_path.exists():
        abort(404)
    return send_from_directory(
        BASE_DIR / "static",
        "service-worker.js",
        as_attachment=False,
        mimetype="application/javascript",
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
        # Normalize overlay logo URL
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

        # Build a usable URL for the team slide background, if any.
        team_slide = settings.get("team_slide") or {}
        bg_path = team_slide.get("background_path")
        if isinstance(bg_path, str) and bg_path:
            team_slide["background_url"] = url_for(
                "main.serve_team_slide_asset", filename=bg_path, _external=False
            )
        else:
            team_slide["background_url"] = None
        settings["team_slide"] = team_slide

        birthday_slide = settings.get("birthday_slide") or {}
        bg_upload_path = birthday_slide.get("background_path")
        birthday_background_url = None
        birthday_background_source = None
        if isinstance(bg_upload_path, str) and bg_upload_path:
            birthday_background_url = url_for(
                "main.serve_birthday_slide_asset", filename=bg_upload_path, _external=False
            )
            birthday_background_source = "upload"
        else:
            birthday_slide["background_media_id"] = None
            birthday_slide["background_path"] = None
        birthday_slide["background_url"] = birthday_background_url
        birthday_slide["background_source"] = birthday_background_source
        birthday_slide["background_label"] = None
        settings["birthday_slide"] = birthday_slide
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


@bp.post("/api/log-key-event")
def log_key_event() -> Any:
    """Log keyboard events for debugging Fire TV remote."""
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")
    
    log_file = DATA_DIR / "logs" / "key-events.json"
    log_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Read existing logs
    logs = []
    if log_file.exists():
        try:
            with log_file.open("r", encoding="utf-8") as f:
                logs = json.load(f)
                if not isinstance(logs, list):
                    logs = []
        except (json.JSONDecodeError, OSError):
            logs = []
    
    # Append new log
    logs.append(payload)
    
    # Keep only last 1000 events
    if len(logs) > 1000:
        logs = logs[-1000:]
    
    # Save logs
    try:
        with log_file.open("w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2, ensure_ascii=False)
    except OSError as exc:
        print(f"Failed to write key event log: {exc}")
    
    return jsonify({"status": "logged"})


@bp.get("/api/employees")
def api_list_employees() -> Any:
    employees = employee_store.list_employees()
    return jsonify({"employees": employees})


@bp.post("/api/employees")
def api_create_employee() -> Any:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")
    name = payload.get("name")
    birthday = payload.get("birthday") or ""
    role = payload.get("role") or ""
    description = payload.get("description") or ""
    hire_date = payload.get("hire_date") or ""
    try:
        employee = employee_store.add_employee(name, birthday, role, description, hire_date)
    except ValueError as exc:
        abort(400, description=str(exc))
    return jsonify({"employee": employee}), 201


@bp.patch("/api/employees/<employee_id>")
def api_update_employee(employee_id: str) -> Any:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")
    try:
        employee = employee_store.update_employee(employee_id, payload)
    except ValueError as exc:
        abort(400, description=str(exc))
    except KeyError:
        abort(404, description="Employé introuvable.")
    return jsonify({"employee": employee})


@bp.delete("/api/employees/<employee_id>")
def api_delete_employee(employee_id: str) -> Any:
    try:
        employee_store.delete_employee(employee_id)
    except KeyError:
        abort(404, description="Employé introuvable.")
    return jsonify({"status": "ok"})


@bp.post("/api/employees/<employee_id>/avatar")
def api_set_employee_avatar(employee_id: str) -> Any:
    file_storage = request.files.get("file")
    if not file_storage:
        abort(400, description="Aucun fichier reçu.")
    try:
        employee = employee_store.set_avatar(employee_id, file_storage)
    except ValueError as exc:
        abort(400, description=str(exc))
    except KeyError:
        abort(404, description="Employé introuvable.")
    return jsonify({"employee": employee})


@bp.delete("/api/employees/<employee_id>/avatar")
def api_delete_employee_avatar(employee_id: str) -> Any:
    try:
        employee = employee_store.clear_avatar(employee_id)
    except KeyError:
        abort(404, description="Employé introuvable.")
    return jsonify({"employee": employee})


@bp.post("/api/employees/order")
def api_update_employee_order() -> Any:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")
    order = payload.get("order")
    if not isinstance(order, list) or not order:
        abort(400, description="Ordre invalide.")
    try:
        employees = employee_store.update_order([str(e) for e in order])
    except ValueError as exc:
        abort(400, description=str(exc))
    except KeyError:
        abort(400, description="Un ou plusieurs employés sont introuvables.")
    return jsonify({"employees": employees})


@bp.get("/api/temporary-slides")
def api_list_temporary_slides() -> Any:
    slides = [
        _temporary_slide_with_urls(slide) for slide in temporary_slides.list_slides()
    ]
    return jsonify({"slides": slides})


@bp.post("/api/temporary-slides")
def api_create_temporary_slide() -> Any:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")
    try:
        slide = temporary_slides.add_slide(payload)
    except ValueError as exc:
        abort(400, description=str(exc))
    enriched = _temporary_slide_with_urls(slide)
    return jsonify({"slide": enriched}), 201


@bp.patch("/api/temporary-slides/<slide_id>")
def api_update_temporary_slide(slide_id: str) -> Any:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")
    try:
        slide = temporary_slides.update_slide(slide_id, payload)
    except ValueError as exc:
        abort(400, description=str(exc))
    except KeyError:
        abort(404, description="Diapositive introuvable.")
    enriched = _temporary_slide_with_urls(slide)
    return jsonify({"slide": enriched})


@bp.delete("/api/temporary-slides/<slide_id>")
def api_delete_temporary_slide(slide_id: str) -> Any:
    try:
        temporary_slides.delete_slide(slide_id)
    except KeyError:
        abort(404, description="Diapositive introuvable.")
    return jsonify({"status": "ok"})


@bp.post("/api/temporary-slides/assets")
def api_upload_temporary_asset() -> Any:
    file_storage = request.files.get("file")
    if not file_storage:
        abort(400, description="Aucun fichier reçu.")
    try:
        saved = temporary_slides.save_asset(file_storage)
    except ValueError as exc:
        abort(400, description=str(exc))
    url = url_for(
        "main.serve_temporary_asset", filename=saved["filename"], _external=False
    )
    return jsonify(
        {
            "filename": saved["filename"],
            "url": url,
            "mimetype": saved.get("mimetype"),
        }
    )


@bp.get("/api/media")
def list_media() -> Any:
    active_only = request.args.get("active") == "1"
    items = []
    reference_time = _now()
    for item in store.all_items():
        if active_only and not _is_item_active(item, reference_time):
            continue
        items.append(_item_with_urls(item))
    if active_only:
        for slide in temporary_slides.generate_active_slides(reference_time):
            enriched = _temporary_slide_with_urls(slide)
            if _is_item_active(enriched, reference_time):
                items.append(enriched)
    return jsonify(items)


@bp.get("/api/powerpoint")
def list_powerpoint() -> Any:
    items = [_powerpoint_item_with_urls(item) for item in powerpoint_store.all_items()]
    return jsonify(items)


@bp.get("/api/powerpoint/<powerpoint_id>")
def get_powerpoint(powerpoint_id: str) -> Any:
    item = powerpoint_store.find_by_id(powerpoint_id)
    if not item:
        abort(404, description="Présentation introuvable.")
    data = _powerpoint_item_with_urls(item)
    data["original_name"] = item.get("original_name") or item.get("filename")
    return jsonify(data)


@bp.delete("/api/powerpoint/<powerpoint_id>")
def delete_powerpoint(powerpoint_id: str) -> Any:
    removed = powerpoint_store.delete_item(powerpoint_id)
    if not removed:
        abort(404, description="Présentation introuvable.")

    bundle_dir = POWERPOINT_DIR / powerpoint_id
    if bundle_dir.exists():
        shutil.rmtree(bundle_dir, ignore_errors=True)

    def _safe_remove(rel_path: Any) -> None:
        if not rel_path:
            return
        try:
            candidate = (POWERPOINT_DIR / str(rel_path)).resolve()
            candidate.relative_to(POWERPOINT_DIR)
        except (ValueError, TypeError):
            return
        if candidate.exists():
            try:
                if candidate.is_dir():
                    shutil.rmtree(candidate, ignore_errors=True)
                else:
                    candidate.unlink()
            except OSError:
                pass

    _safe_remove(removed.get("filename"))
    _safe_remove(removed.get("html_filename"))
    _safe_remove(removed.get("pdf_filename"))
    _safe_remove(removed.get("display_filename"))
    for slide_path in removed.get("slide_filenames") or []:
        _safe_remove(slide_path)
    for page_path in removed.get("page_filenames") or []:
        _safe_remove(page_path)

    return jsonify({"status": "ok"})


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
        if extension.lower() in PPT_EXTENSIONS:
            abort(
                400,
                description="Les fichiers PowerPoint doivent être téléversés depuis la section dédiée.",
            )
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


@bp.post("/api/team-slide/background")
def upload_team_slide_background() -> Any:
    """Téléverse un média d'arrière-plan (image ou vidéo) pour la diapositive 'Notre Équipe'."""
    uploaded = request.files.get("file") or request.files.get("background")
    if not uploaded or not uploaded.filename:
        abort(400, description="Aucun fichier reçu.")

    original_name = uploaded.filename
    safe_name = secure_filename(original_name) or "background"
    ext = Path(original_name).suffix or Path(safe_name).suffix
    ext_lower = (ext or "").lower()

    # Autoriser uniquement les images et vidéos
    mimetype = uploaded.mimetype or _guess_mimetype(original_name, safe_name) or ""
    mimetype_lower = mimetype.lower()
    if not (
        mimetype_lower.startswith("image/")
        or mimetype_lower.startswith("video/")
        or ext_lower in IMAGE_EXTENSIONS
        or ext_lower in VIDEO_EXTENSIONS
    ):
        abort(400, description="Seuls les fichiers image ou vid\u00e9o sont accept\u00e9s pour l'arri\u00e8re-plan.")

    TEAM_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    # Générer un nom unique pour éviter les collisions
    media_id = uuid.uuid4().hex
    storage_name = f"{media_id}{ext_lower}" if ext_lower else media_id
    target = TEAM_SLIDE_ASSETS_DIR / storage_name
    uploaded.save(target)

    # Mettre à jour les paramètres team_slide avec le nouveau chemin et le mimetype.
    # On conserve la position et la durée actuelles.
    try:
        current_settings = store.get_settings().get("team_slide") or {}
    except Exception:
        current_settings = {}

    updates: Dict[str, Any] = {
        "background_path": storage_name,
    }
    if mimetype:
        updates["background_mimetype"] = mimetype

    try:
        settings = store.update_settings({"team_slide": updates})
    except ValueError as exc:
        abort(400, description=str(exc))

    team_slide = settings.get("team_slide") or {}
    bg_path = team_slide.get("background_path")
    background_url = None
    if isinstance(bg_path, str) and bg_path:
        background_url = url_for("main.serve_team_slide_asset", filename=bg_path, _external=False)

    return jsonify(
        {
            "background_url": background_url,
            "background_mimetype": team_slide.get("background_mimetype"),
            "settings": settings,
        }
    )


@bp.delete("/api/team-slide/background/<path:filename>")
def delete_team_slide_background(filename: str) -> Any:
    """Supprime un arrière-plan de la diapositive 'Notre Équipe'."""
    safe_name = secure_filename(filename)
    if not safe_name or safe_name != filename:
        abort(400, description="Nom de fichier invalide.")

    TEAM_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    target = (TEAM_SLIDE_ASSETS_DIR / safe_name).resolve()
    base_dir = TEAM_SLIDE_ASSETS_DIR.resolve()
    if target == base_dir or base_dir not in target.parents:
        abort(400, description="Chemin de fichier non autorisé.")
    if not target.exists() or not target.is_file():
        abort(404, description="Fichier introuvable.")

    try:
        target.unlink()
    except OSError as exc:
        abort(500, description=f"Impossible de supprimer le fichier : {exc}")

    try:
        settings = store.get_settings()
    except Exception:
        settings = {"team_slide": DEFAULT_SETTINGS["team_slide"]}

    team_slide = settings.get("team_slide") or {}
    updates: Dict[str, Any] = {}
    if isinstance(team_slide.get("background_path"), str) and team_slide["background_path"] == filename:
        updates = {"background_path": None, "background_mimetype": None}

    new_settings = settings
    if updates:
        try:
            new_settings = store.update_settings({"team_slide": updates})
        except ValueError as exc:
            abort(400, description=str(exc))

    current = (new_settings.get("team_slide") or {}).get("background_path")
    return jsonify({"removed": filename, "current": current, "settings": new_settings})


@bp.get("/api/team-slide/backgrounds")
def list_team_slide_backgrounds() -> Any:
    """Retourne la liste des fichiers d'arrière-plan disponibles pour la diapositive 'Notre Équipe'."""
    TEAM_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    items: List[Dict[str, Any]] = []
    for entry in sorted(TEAM_SLIDE_ASSETS_DIR.iterdir()):
        if not entry.is_file():
            continue
        filename = entry.name
        mimetype = _guess_mimetype(filename) or "application/octet-stream"
        url = url_for("main.serve_team_slide_asset", filename=filename, _external=False)
        items.append(
            {
                "filename": filename,
                "url": url,
                "mimetype": mimetype,
            }
        )

    settings = store.get_settings()
    team_slide = settings.get("team_slide") or {}
    current = team_slide.get("background_path")
    return jsonify({"items": items, "current": current})


@bp.get("/api/birthday-slide/config/<variant>")
def get_birthday_slide_config(variant: str) -> Any:
    try:
        config = _read_birthday_config(variant)
        bg_path = config.get("background_path")
        if bg_path:
            config["background_url"] = url_for(
                "main.serve_birthday_slide_asset", filename=bg_path, _external=False
            )
        else:
            config["background_url"] = None
    except ValueError as exc:
        abort(400, description=str(exc))
    return jsonify({"variant": variant, "config": config})


@bp.patch("/api/birthday-slide/config/<variant>")
def update_birthday_slide_config(variant: str) -> Any:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")
    try:
        config = _write_birthday_config(variant, payload)
    except ValueError as exc:
        abort(400, description=str(exc))
    return jsonify({"variant": variant, "config": config})


@bp.post("/api/birthday-slide/background")
def upload_birthday_slide_background() -> Any:
    """Téléverse un média d'arrière-plan (image ou vidéo) pour la diapositive 'Anniversaire'."""
    uploaded = request.files.get("file") or request.files.get("background")
    if not uploaded or not uploaded.filename:
        abort(400, description="Aucun fichier reçu.")

    original_name = uploaded.filename
    safe_name = secure_filename(original_name) or "birthday-background"
    ext = Path(original_name).suffix or Path(safe_name).suffix
    ext_lower = (ext or "").lower()

    mimetype = uploaded.mimetype or _guess_mimetype(original_name, safe_name) or ""
    mimetype_lower = mimetype.lower()
    if not (
        mimetype_lower.startswith("image/")
        or mimetype_lower.startswith("video/")
        or ext_lower in IMAGE_EXTENSIONS
        or ext_lower in VIDEO_EXTENSIONS
    ):
        abort(400, description="Veuillez fournir une image ou une vidéo pour l'arrière-plan.")

    BIRTHDAY_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    media_id = uuid.uuid4().hex
    storage_name = f"{media_id}{ext_lower}" if ext_lower else media_id
    target = BIRTHDAY_SLIDE_ASSETS_DIR / storage_name
    uploaded.save(target)

    updates: Dict[str, Any] = {
        "background_path": storage_name,
        "background_mimetype": mimetype or None,
        # Désélectionner tout média déjà présent si on enregistre un nouvel upload.
        "background_media_id": None,
    }

    try:
        settings = store.update_settings({"birthday_slide": updates})
    except ValueError as exc:
        abort(400, description=str(exc))

    birthday_slide = settings.get("birthday_slide") or {}
    bg_path = birthday_slide.get("background_path")
    background_url = None
    if isinstance(bg_path, str) and bg_path:
        background_url = url_for("main.serve_birthday_slide_asset", filename=bg_path, _external=False)

    return jsonify(
        {
            "background_url": background_url,
            "background_mimetype": birthday_slide.get("background_mimetype"),
            "settings": settings,
        }
    )


@bp.get("/api/birthday-slide/backgrounds")
def list_birthday_slide_backgrounds() -> Any:
    """Liste les fonds (images/vidéos) téléversés pour la diapositive Anniversaire."""
    BIRTHDAY_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    items: List[Dict[str, Any]] = []
    for entry in sorted(BIRTHDAY_SLIDE_ASSETS_DIR.iterdir()):
        if not entry.is_file():
            continue
        filename = entry.name
        mimetype = _guess_mimetype(filename) or "application/octet-stream"
        url = url_for("main.serve_birthday_slide_asset", filename=filename, _external=False)
        items.append(
            {
                "type": "upload",
                "filename": filename,
                "url": url,
                "mimetype": mimetype,
            }
        )

    settings = store.get_settings()
    birthday_slide = settings.get("birthday_slide") or {}
    current: Dict[str, Any] = {}
    bg_path = birthday_slide.get("background_path")
    if isinstance(bg_path, str) and bg_path:
        current = {"type": "upload", "filename": bg_path}

    return jsonify({"items": items, "current": current})


@bp.post('/api/powerpoint/upload')
def upload_powerpoint() -> Any:
    """Store uploaded PowerPoint files under DATA_DIR / 'powerpoint'."""
    files = request.files.getlist('files')
    if not files:
        abort(400, description="Aucun fichier reçu.")

    if not LIBREOFFICE_COMMAND:
        return (
            jsonify(
                {
                    "error": "La conversion PowerPoint est indisponible : LibreOffice introuvable sur le serveur.",
                    "details": [
                        "Installez LibreOffice ou définissez la variable d'environnement LIBREOFFICE_PATH/COMMAND pour pointer vers l'exécutable 'soffice'."
                    ],
                }
            ),
            503,
        )

    saved: List[Dict[str, Any]] = []
    errors: List[str] = []
    for uploaded in files:
        if not uploaded or not uploaded.filename:
            continue

        original_filename = uploaded.filename
        safe_name = secure_filename(original_filename) or "presentation"
        ext = Path(original_filename).suffix or Path(safe_name).suffix
        ext_lower = (ext or "").lower()
        if ext_lower not in PPT_EXTENSIONS:
            abort(400, description="Seuls les fichiers PowerPoint sont acceptés.")

        media_id = uuid.uuid4().hex
        bundle_dir = POWERPOINT_DIR / media_id
        try:
            if bundle_dir.exists():
                shutil.rmtree(bundle_dir, ignore_errors=True)
            bundle_dir.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            print(f"Failed to prepare bundle directory for {original_filename}: {exc}")
            errors.append(f"Impossible de préparer le dossier de conversion pour «{original_filename}» : {exc}.")
            continue

        safe_base = Path(safe_name).stem or media_id
        source_filename = f"{safe_base}{ext_lower}" if ext_lower else safe_base
        source_path = bundle_dir / source_filename

        try:
            uploaded.save(source_path)
        except Exception as exc:
            print(f"Failed to save uploaded powerpoint {uploaded.filename}: {exc}")
            shutil.rmtree(bundle_dir, ignore_errors=True)
            errors.append(f"Impossible d'enregistrer le fichier «{original_filename}» : {exc}.")
            continue

        html_filename = ""
        slide_relpaths: List[str] = []

        slides_dir = bundle_dir / "slides"
        try:
            if slides_dir.exists():
                shutil.rmtree(slides_dir, ignore_errors=True)
            slides_dir.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            print(f"Failed to prepare slides directory for {uploaded.filename}: {exc}")
            errors.append(f"Impossible de créer le dossier des diapositives pour «{original_filename}» : {exc}.")
            shutil.rmtree(bundle_dir, ignore_errors=True)
            continue

        conversion_errors: List[str] = []

        def run_png_conversion(filter_arg: str) -> bool:
            command = [
                str(LIBREOFFICE_COMMAND),
                "--headless",
                "--convert-to",
                filter_arg,
                "--outdir",
                str(slides_dir),
                str(source_path),
            ]
            try:
                subprocess.run(
                    command,
                    check=True,
                    timeout=300,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                return True
            except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as exc:
                stderr_output = ""
                if isinstance(exc, subprocess.CalledProcessError):
                    try:
                        stderr_output = (exc.stderr or b"").decode("utf-8", errors="ignore").strip()
                    except Exception:
                        stderr_output = ""
                detail = stderr_output or str(exc)
                conversion_errors.append(detail)
                print(f"Failed to convert {uploaded.filename} using {filter_arg}: {exc}\n{stderr_output}")
                return False

        if not run_png_conversion("png:impress_png_Export"):
            if not run_png_conversion("png"):
                detail = conversion_errors[-1] if conversion_errors else "Erreur inconnue."
                errors.append(
                    f"La conversion en images pour «{original_filename}» a échoué : {detail[:400].strip()}"
                )
                shutil.rmtree(bundle_dir, ignore_errors=True)
                continue

        converted: List[str] = []
        png_files = sorted(
            (candidate for candidate in slides_dir.rglob("*") if candidate.is_file()),
            key=lambda p: (_natural_key(p.name), p.as_posix()),
        )
        for candidate in png_files:
            if candidate.suffix.lower() != ".png":
                continue
            try:
                with Image.open(candidate) as img:
                    rgb = img.convert("RGB")
                    jpg_path = candidate.with_suffix(".jpg")
                    rgb.save(jpg_path, "JPEG", quality=95, optimize=True)
                    try:
                        rel_path = jpg_path.relative_to(POWERPOINT_DIR)
                    except ValueError:
                        continue
                    converted.append(rel_path.as_posix())
            except Exception as exc:
                print(f"Failed to transcode PNG {candidate} to JPEG: {exc}")
                errors.append(
                    f"Impossible de convertir une diapositive en JPEG pour «{original_filename}» : {exc}"
                )
            finally:
                try:
                    candidate.unlink()
                except OSError:
                    pass

        converted.sort(key=lambda rel: (_natural_key(Path(rel).name), rel))
        slide_relpaths = converted

        if not slide_relpaths:
            print(f"No slide assets extracted for {uploaded.filename}. Skipping upload.")
            shutil.rmtree(bundle_dir, ignore_errors=True)
            errors.append(
                f"La conversion JPEG de «{original_filename}» n'a produit aucune diapositive. Vérifiez le fichier et réessayez."
            )
            continue

        mimetype = _resolve_mimetype(uploaded.mimetype, original_filename, source_filename)
        try:
            size = source_path.stat().st_size
        except OSError:
            size = 0

        display_filename = slide_relpaths[0] if slide_relpaths else Path(media_id, source_filename).as_posix()
        display_mimetype = _guess_mimetype(display_filename, source_filename) or "image/jpeg"

        item = {
            "id": media_id,
            "filename": Path(media_id, source_filename).as_posix(),
            "original_name": original_filename,
            "uploaded_at": _now_iso(),
            "mimetype": mimetype or "application/octet-stream",
            "size": size,
            "display_filename": display_filename,
            "display_mimetype": display_mimetype,
            "page_filenames": [],
            "text_pages": [],
            "pdf_filename": "",
            "html_filename": html_filename,
            "slide_filenames": slide_relpaths,
            "thumbnail_filename": slide_relpaths[0] if slide_relpaths else "",
            "duration": DEFAULT_DURATION_SECONDS,
        }

        stored = powerpoint_store.add_item(item)
        saved.append(_powerpoint_item_with_urls(stored))

    if saved:
        return jsonify({"items": saved})

    message = errors[0] if errors else "Aucun fichier n'a pu être enregistré."
    return jsonify({"error": message, "details": errors}), 500


@bp.patch("/api/media/<media_id>")
def update_media(media_id: str) -> Any:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")

    allowed_fields = {"enabled", "duration", "start_at", "end_at", "skip_rounds", "muted", "original_name"}
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

    if "original_name" in updates:
        name_val = updates["original_name"]
        if name_val is None:
            updates["original_name"] = ""
        else:
            try:
                name_str = str(name_val).strip()
            except Exception:
                abort(400, description="Le nom du fichier doit être une chaîne de caractères.")
            if not name_str:
                abort(400, description="Le nom du fichier ne peut pas être vide.")
            if len(name_str) > 1024:
                abort(400, description="Le nom du fichier est trop long.")
            updates["original_name"] = name_str

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
    # Allow enabling debug/reloader via environment variable for development
    debug_env = os.environ.get("CARDINALTV_DEBUG")
    debug_mode = True if (debug_env and debug_env.lower() in ("1", "true", "yes")) else False
    # In production we prefer running with waitress to avoid the unbounded-thread dev server.
    if not debug_mode and waitress_serve is not None:
        cpu_count = os.cpu_count() or 1
        default_threads = max(min(cpu_count * 2, 64), 12)
        threads = int(
            _ensure_number(
                os.environ.get("CARDINALTV_WAITRESS_THREADS"),
                default_threads,
                minimum=1,
                maximum=128,
                integer=True,
            )
        )
        default_connection_limit = max(threads * 8, 128)
        connection_limit = int(
            _ensure_number(
                os.environ.get("CARDINALTV_WAITRESS_CONNECTION_LIMIT"),
                default_connection_limit,
                minimum=threads,
                maximum=4096,
                integer=True,
            )
        )
        channel_timeout = int(
            _ensure_number(
                os.environ.get("CARDINALTV_WAITRESS_CHANNEL_TIMEOUT"),
                90,
                minimum=15,
                maximum=1800,
                integer=True,
            )
        )
        backlog = int(
            _ensure_number(
                os.environ.get("CARDINALTV_WAITRESS_BACKLOG"),
                512,
                minimum=32,
                maximum=8192,
                integer=True,
            )
        )
        print(
            "Starting CardinalTV with Waitress on 0.0.0.0:39010 "
            f"(threads={threads}, connection_limit={connection_limit}, channel_timeout={channel_timeout}, backlog={backlog})"
        )
        waitress_serve(
            app,
            host="0.0.0.0",
            port=39010,
            threads=threads,
            connection_limit=connection_limit,
            channel_timeout=channel_timeout,
            backlog=backlog,
        )
        return

    if not debug_mode:
        print(
            "Warning: Waitress is not installed. Falling back to the single-threaded Flask server; "
            "install the 'waitress' package for improved stability."
        )

    # When debug_mode is True, enable the reloader so file changes are picked up immediately.
    app.run(
        host="0.0.0.0",
        port=39010,
        debug=debug_mode,
        use_reloader=debug_mode,
        threaded=debug_mode,
    )


if __name__ == "__main__":
    run()
=======
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
>>>>>>> 32ed2256021277d832bf4e4fa3f026e9f03f644f
