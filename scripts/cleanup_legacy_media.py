"""
Cleanup legacy image-page references for document media.

Usage:
  python scripts/cleanup_legacy_media.py [--dry-run]

This script will load `data/media.json`, remove `page_filenames` and `page_urls`
from items whose original filename or url ends with a document extension
(.pdf, .docx, .doc, .txt), and write the file back (unless --dry-run is used).

It prints a summary of items scanned and modified.
"""
from __future__ import annotations

import json
import argparse
from pathlib import Path
from typing import Iterable

WORKSPACE_ROOT = Path(__file__).resolve().parents[1]
MEDIA_DB = WORKSPACE_ROOT / "data" / "media.json"
DOCUMENT_EXTS = {".pdf", ".docx", ".doc", ".txt"}


def candidate_names(item: dict) -> Iterable[str]:
    # yield possible filenames/urls to inspect for an extension
    for key in ("original_filename", "original_name", "filename", "name", "url", "display_url", "display_filename", "path"):
        val = item.get(key)
        if isinstance(val, str) and val:
            yield Path(val).name


def is_document_item(item: dict) -> bool:
    for name in candidate_names(item):
        if Path(name).suffix.lower() in DOCUMENT_EXTS:
            return True
    # also consider explicit type markers
    typ = item.get("type") or item.get("media_type")
    if isinstance(typ, str) and typ.lower() in ("document", "pdf", "docx", "text"):
        return True
    return False


def sanitize_item(item: dict) -> bool:
    """Remove page_filenames/page_urls from item if present. Returns True if changed."""
    changed = False
    for key in ("page_filenames", "page_urls"):
        if key in item:
            del item[key]
            changed = True
    # Also remove display_url if it references a page image (optional safety):
    # If display_url ends with an image extension and item is a document, clear it to avoid 404s.
    display = item.get("display_url")
    if isinstance(display, str) and Path(display).suffix.lower() in {".jpg", ".jpeg", ".png", ".gif"}:
        if is_document_item(item):
            item.pop("display_url", None)
            changed = True
    return changed


def load_db(path: Path) -> list:
    if not path.exists():
        raise SystemExit(f"Media DB not found at {path}")
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    # Support either a list (legacy) or a dict with an 'items' list
    if isinstance(data, dict) and "items" in data and isinstance(data["items"], list):
        return data
    if isinstance(data, list):
        return {"items": data}
    raise SystemExit(f"Unexpected media.json format: {type(data)}")


def write_db(path: Path, data: list) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def run(dry_run: bool = True) -> None:
    container = load_db(MEDIA_DB)
    items = container.get("items", [])
    total = len(items)
    modified = []
    scanned_docs = 0
    for item in items:
        if is_document_item(item):
            scanned_docs += 1
            if sanitize_item(item):
                modified.append(item.get("id") or item.get("name") or item.get("filename") or "<unknown>")

    print(f"Scanned {total} media items, found {scanned_docs} document-like items.")
    if modified:
        print(f"Items to be modified ({len(modified)}):")
        for m in modified:
            print(" -", m)
    else:
        print("No modifications necessary.")

    if not dry_run and modified:
        write_db(MEDIA_DB, container)
        print(f"Wrote changes to {MEDIA_DB}")
    elif dry_run:
        print("Dry-run mode: no changes written. Rerun without --dry-run to apply.")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true", help="Show what would change without writing")
    args = p.parse_args()
    run(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
