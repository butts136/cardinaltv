from __future__ import annotations

import base64
import calendar
import copy
import html
import json
import logging
import math
import mimetypes
import os
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
import uuid
from datetime import date, datetime, timedelta
from logging.handlers import TimedRotatingFileHandler
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
FRONTEND_DIR = BASE_DIR / "frontend"
FRONTEND_STATIC_DIR = FRONTEND_DIR / "static"
FRONTEND_TEMPLATES_DIR = FRONTEND_DIR / "templates"
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
BIRTHDAY_FONT_DIR = DATA_DIR / "birthday" / "fonts"
TIME_CHANGE_SLIDE_ASSETS_DIR = DATA_DIR / "time_change" / "background"
TIME_CHANGE_CONFIG_FILE = DATA_DIR / "time_change" / "config.json"
CHRISTMAS_SLIDE_ASSETS_DIR = DATA_DIR / "christmas" / "background"
CHRISTMAS_CONFIG_FILE = DATA_DIR / "christmas" / "config.json"
NEWS_SLIDE_DIR = DATA_DIR / "news"
NEWS_CONFIG_FILE = NEWS_SLIDE_DIR / "news.json"
LEGACY_NEWS_CONFIG_FILE = NEWS_SLIDE_DIR / "config.json"
WEATHER_SLIDE_DIR = DATA_DIR / "weather"
WEATHER_BACKGROUNDS_DIR = WEATHER_SLIDE_DIR / "backgrounds"
WEATHER_ICONS_DIR = WEATHER_SLIDE_DIR / "icons"
WEATHER_CONFIG_FILE = WEATHER_SLIDE_DIR / "weather.json"
LEGACY_WEATHER_CONFIG_FILE = WEATHER_SLIDE_DIR / "config.json"
WEATHER_SECRETS_FILE = WEATHER_SLIDE_DIR / "weather_secrets.json"
LEGACY_SECRETS_FILE = DATA_DIR / "secrets.json"
INFO_BANDS_DIR = DATA_DIR / "info_bands"
INFO_BANDS_CONFIG_FILE = INFO_BANDS_DIR / "config.json"
INFO_BANDS_DIR.mkdir(parents=True, exist_ok=True)
CUSTOM_SLIDES_DIR = DATA_DIR / "custom_slides"
CUSTOM_SLIDES_INDEX_FILE = CUSTOM_SLIDES_DIR / "slides.json"
CUSTOM_SLIDE_DEFAULT_SETTINGS = {
    "enabled": False,
    "order_index": 0,
    "duration": 12.0,
}
TEST_BACKGROUND_DIR = DATA_DIR / "test" / "background"
TEST_BACKGROUND_DIR.mkdir(parents=True, exist_ok=True)
TEST_CONFIG_FILE = DATA_DIR / "test" / "config.json"
DEFAULT_TEST_TEXT_POSITION = {"x": 50.0, "y": 80.0}
DEFAULT_TEST_TEXT_SIZE = {"width": 30.0, "height": 12.0}
DEFAULT_TEST_TEXT_COLOR = "#e10505"
DEFAULT_TEST_TEXT_BACKGROUND = {"color": "#000000", "opacity": 0.0}
DEFAULT_TEST_SLIDE_SETTINGS = {
    "enabled": False,
    "order_index": 0,
    "duration": 12.0,
}
DEFAULT_TEST_FONT_FAMILY = "Poppins"
AVAILABLE_TEST_FONT_FAMILIES = [
    "Poppins",
    "Roboto",
    "Montserrat",
    "Playfair Display",
    "Space Mono",
    "Open Sans",
    "Lato",
    "Raleway",
    "Merriweather",
    "Source Sans Pro",
    "Oswald",
    "Nunito",
    "Ubuntu",
    "Fira Sans",
    "IBM Plex Sans",
    "Pacifico",
    "Bebas Neue",
    "Caveat",
    "Inconsolata",
    "PT Serif",
]
DEFAULT_TEST_TEXT_STYLE = {
    "font_family": DEFAULT_TEST_FONT_FAMILY,
    "font_size_auto": True,
    "font_size": 48.0,
    "scale_x": 1.0,
    "scale_y": 1.0,
    "bold": False,
    "italic": False,
    "underline": False,
}
DEFAULT_TEST_SLIDE_META = {
    "name": "Diapo personnalisée",
    "event_date": "",
}
LOGS_DIR = DATA_DIR / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
FRENCH_WEEKDAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
FRENCH_MONTHS = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
]
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
TEST_BACKGROUND_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS

DEFAULT_SETTINGS = {
    "overlay": {
        "enabled": False,
        "mode": "clock",
        "height_vh": 5.0,
        "background_color": "#f0f0f0",
        "text_color": "#111111",
        "logo_path": "",
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
        # Avatar size in pixels (base before slide scaling).
        "avatar_size": 96.0,
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
    "test_slide": {
        "enabled": False,
        "order_index": 0,
        "duration": 12.0,
    },
    # Settings for the "Anniversaire" slide.
    "birthday_slide": {
        "enabled": False,
        "order_index": 0,
        "duration": 12.0,
        # Nombre de jours d'avance pour afficher la variante \"Avant anniversaire\".
        "days_before": 3,
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
        # Jours d'ouverture de la compagnie (pour déplacer les anniversaires tombant un jour fermé).
        "open_days": {
            "monday": True,
            "tuesday": True,
            "wednesday": True,
            "thursday": True,
            "friday": True,
            "saturday": False,
            "sunday": False,
        },
    },
    "time_change_slide": {
        "enabled": False,
        "order_index": 0,
        "duration": 12.0,
        "background_path": None,
        "background_mimetype": None,
        # Nombre de jours d'anticipation avant l'affichage de la diapositive.
        "days_before": 7,
        "offset_hours": 1.0,
        "title_text": "Annonce Changement d'heure (Été / Hiver)",
        "message_template": (
            "Le [change_weekday] [change_date] à [change_time], on va [direction_verb] "
            "l'heure de [offset_hours]h (de [offset_from] à [offset_to]). Il reste "
            "[days_until] [days_label] avant l'heure [season_label]."
        ),
        "title_font_size": 42.0,
        "message_font_size": 24.0,
        "meta_font_size": 18.0,
        "text_color": "#f8fafc",
        "text1": "Annonce Changement d'heure (Été / Hiver)",
        "text2": (
            "Le [change_weekday] [change_date] à [change_time], on va [direction_verb] "
            "l'heure de [offset_hours]h (de [offset_from] à [offset_to])."
        ),
        "text3": "Il reste [days_until] [days_label] avant l'heure [season_label].",
        "text1_options": None,
        "text2_options": None,
        "text3_options": None,
        "lines": [
            {
                "text": "Annonce Changement d'heure (Été / Hiver)",
                "options": None,
            },
            {
                "text": (
                    "Le [change_weekday] [change_date] à [change_time], on va [direction_verb] "
                    "l'heure de [offset_hours]h (de [offset_from] à [offset_to])."
                ),
                "options": None,
            },
            {
                "text": "Il reste [days_until] [days_label] avant l'heure [season_label].",
                "options": None,
            },
        ],
    },
    "christmas_slide": {
        "enabled": False,
        "order_index": 0,
        "duration": 12.0,
        "background_path": None,
        "background_mimetype": None,
        # Nombre de jours d'anticipation avant l'affichage de la diapositive.
        "days_before": 25,
        "title_text": "🎄 Joyeux Noël ! 🎄",
        "title_font_size": 64.0,
        "text_color": "#f8fafc",
        "text1": "🎄 Joyeux Noël ! 🎄",
        "text2": "Plus que [days_until] [days_label] avant Noël !",
        "text3": "Toute l'équipe vous souhaite de joyeuses fêtes !",
        "text1_options": None,
        "text2_options": None,
        "text3_options": None,
        "lines": [
            {
                "text": "🎄 Joyeux Noël ! 🎄",
                "options": None,
            },
            {
                "text": "Plus que [days_until] [days_label] avant Noël !",
                "options": None,
            },
            {
                "text": "Toute l'équipe vous souhaite de joyeuses fêtes !",
                "options": None,
            },
        ],
    },
    "news_slide": {
        "enabled": False,
        "order_index": 0,
        "rss_feeds": [
            {
                "id": "default",
                "name": "Radio-Canada",
                "url": "https://ici.radio-canada.ca/rss/4159",
                "enabled": True,
            }
        ],
        "scroll_delay": 3.0,
        "scroll_speed": 50,
        "max_items": 10,
        "card_style": {
            "background_color": "#1a1a2e",
            "background_opacity": 0.9,
            "title_color": "#ffffff",
            "time_color": "#a3a3a3",
            "title_size": 28,
            "time_size": 18,
            "source_size": 16,
            "description_size": 16,
            "border_radius": 12,
            "padding": 20,
        },
        "layout": {
            "card_width_percent": 90,
            "card_height_percent": 25,
            "card_gap": 20,
            "cards_per_row": 1,
            "show_image": True,
            "show_time": True,
            "image_width": 0,
            "image_height": 0,
        },
        "background_path": None,
        "background_mimetype": None,
    },
    "weather_slide": {
        "enabled": False,
        "order_index": 0,
        "duration": 15.0,
        "api_provider": "open-meteo",
        "api_key": "",
        "location": {
            "name": "Québec",
            "latitude": 46.8139,
            "longitude": -71.2080,
        },
        "units": {
            "temperature": "celsius",
            "wind_speed": "km/h",
            "precipitation": "mm",
        },
        "display": {
            "show_current": True,
            "show_feels_like": True,
            "show_humidity": True,
            "show_wind": True,
            "show_forecast": True,
            "forecast_days": 5,
            "card_opacity": 1.0,
            "icon_size": 210,
            "temp_size": 150,
            "condition_size": 58,
            "detail_label_size": 30,
            "detail_value_size": 44,
            "forecast_weekday_size": 34,
            "forecast_icon_size": 70,
            "forecast_temp_size": 34,
            "forecast_min_width": 200,
        },
        "backgrounds": {
            "sunny": None,
            "cloudy": None,
            "rainy": None,
            "snowy": None,
            "stormy": None,
            "foggy": None,
            "windy": None,
            "default": None,
        },
        "seasonal_backgrounds": {
            "spring": None,
            "summer": None,
            "autumn": None,
            "winter": None,
        },
        "use_seasonal_backgrounds": False,
        "widgets": [],
        "background_path": None,
        "background_mimetype": None,
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
BIRTHDAY_FONT_DIR.mkdir(parents=True, exist_ok=True)
TIME_CHANGE_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
TIME_CHANGE_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
CHRISTMAS_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
CHRISTMAS_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
NEWS_SLIDE_DIR.mkdir(parents=True, exist_ok=True)
WEATHER_SLIDE_DIR.mkdir(parents=True, exist_ok=True)
WEATHER_BACKGROUNDS_DIR.mkdir(parents=True, exist_ok=True)
WEATHER_ICONS_DIR.mkdir(parents=True, exist_ok=True)
CUSTOM_SLIDES_DIR.mkdir(parents=True, exist_ok=True)

if not CUSTOM_SLIDES_INDEX_FILE.exists():
    CUSTOM_SLIDES_INDEX_FILE.write_text(json.dumps({"slides": []}, indent=2), encoding="utf-8")

app_logger = logging.getLogger("cardinaltv")
app_logger.setLevel(logging.INFO)
if not app_logger.handlers:
    log_handler = TimedRotatingFileHandler(
        LOGS_DIR / "app.log",
        when="midnight",
        interval=1,
        backupCount=7,
        encoding="utf-8",
    )
    log_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s")
    )
    app_logger.addHandler(log_handler)
    app_logger.propagate = False

STATIC_ROUTE_PREFIX = "static"

BIRTHDAY_VARIANTS = {"before", "day", "weekend"}
BIRTHDAY_TEXT_OPTIONS_DEFAULT = {
    "font_size_auto": True,
    "font_size": 48.0,
    "scale_x": 1.0,
    "scale_y": 1.0,
    "font_family": "",
    "width_percent": 100.0,
    "height_percent": 0.0,
    "color": "#ffffff",
    "underline": False,
    "bold": False,
    "italic": False,
    "background_color": None,
    "background_opacity": 0.0,
    "offset_x_percent": 0.0,
    "offset_y_percent": 0.0,
    "curve": 0.0,
    "angle": 0.0,
}
BIRTHDAY_MAX_LINES = 50
BIRTHDAY_CONFIG_DEFAULT = {
    "title": "Anniversaire à venir",
    "subtitle": "Dans [days] jours, ce sera la fête",
    "body": "Saurez vous deviner qui est-ce ?",
    "text1": "(Texte 1)",
    "text2": "(Texte 2)",
    "text3": "(Texte 3)",
    "text1_options": copy.deepcopy(BIRTHDAY_TEXT_OPTIONS_DEFAULT),
    "text2_options": copy.deepcopy(BIRTHDAY_TEXT_OPTIONS_DEFAULT),
    "text3_options": copy.deepcopy(BIRTHDAY_TEXT_OPTIONS_DEFAULT),
    "lines": [
        {"text": "(Texte 1)", "options": copy.deepcopy(BIRTHDAY_TEXT_OPTIONS_DEFAULT)},
        {"text": "(Texte 2)", "options": copy.deepcopy(BIRTHDAY_TEXT_OPTIONS_DEFAULT)},
        {"text": "(Texte 3)", "options": copy.deepcopy(BIRTHDAY_TEXT_OPTIONS_DEFAULT)},
    ],
    "background_path": None,
    "background_mimetype": None,
}

TIME_CHANGE_WEEKDAYS_FR = [
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
]

TIME_CHANGE_MONTHS_FR = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
]

TIME_CHANGE_CACHE_TTL = timedelta(hours=6)
TIME_CHANGE_CACHE: Dict[str, Any] = {"year": None, "data": None, "fetched_at": None}
TIME_CHANGE_CACHE_LOCK = RLock()
TIME_CHANGE_SOURCE_URL = "https://www.timeanddate.com/time/change/canada/montreal?year={year}"
TIME_CHANGE_TEXT_OPTIONS_DEFAULT = {
    "font_size_auto": True,
    "font_size": 48.0,
    "scale_x": 1.0,
    "scale_y": 1.0,
    "font_family": "",
    "width_percent": 100.0,
    "height_percent": 0.0,
    "color": "#f8fafc",
    "underline": False,
    "bold": False,
    "italic": False,
    "background_color": None,
    "background_opacity": 0.0,
    "offset_x_percent": 0.0,
    "offset_y_percent": 0.0,
    "curve": 0.0,
    "angle": 0.0,
}
TIME_CHANGE_MAX_LINES = BIRTHDAY_MAX_LINES


def _strip_html(raw: Any) -> str:
    text = ""
    try:
        text = str(raw or "")
    except Exception:
        text = ""
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    return text.replace("\xa0", " ").strip()


def _parse_timeanddate_datetime(raw: Any, year: int) -> Optional[datetime]:
    cleaned = _strip_html(raw)
    if not cleaned:
        return None
    cleaned = cleaned.split("—")[0].split("-")[0].strip()
    for fmt in ("%A, %B %d, %I:%M %p", "%A, %B %d, %Y", "%A, %B %d"):
        try:
            base = datetime.strptime(cleaned, fmt)
            if fmt == "%A, %B %d":
                base = base.replace(year=year)
            if base.year == 1900:
                base = base.replace(year=year)
            if base.tzinfo is None:
                base = base.replace(tzinfo=QUEBEC_TZ)
            return base.astimezone(QUEBEC_TZ)
        except ValueError:
            continue
    return None


def _parse_time_change_schedule(html_text: str, year: int) -> Optional[Dict[str, Any]]:
    row_re = re.compile(
        rf"<tr[^>]*>\s*<th[^>]*>{year}</th>\s*<td[^>]*>(?P<start>.*?)</td>\s*<td[^>]*>(?P<end>.*?)</td>",
        re.IGNORECASE | re.DOTALL,
    )
    match = row_re.search(html_text)
    if not match:
        return None
    start_raw = match.group("start")
    end_raw = match.group("end")
    start_dt = _parse_timeanddate_datetime(start_raw, year)
    end_dt = _parse_timeanddate_datetime(end_raw, year)
    if start_dt and end_dt:
        return {"start": start_dt, "end": end_dt, "source": "timeanddate"}
    return None


def _fetch_time_change_schedule_from_web(year: int) -> Optional[Dict[str, Any]]:
    url = TIME_CHANGE_SOURCE_URL.format(year=year)
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            html_text = response.read().decode("utf-8", errors="ignore")
    except OSError:
        return None
    return _parse_time_change_schedule(html_text, year)


def _refine_transition_window(
    start_dt: datetime, end_dt: datetime, base_offset: timedelta
) -> Dict[str, Any]:
    tz = QUEBEC_TZ
    low = start_dt
    high = end_dt
    for _ in range(28):
        mid = low + (high - low) / 2
        offset = tz.utcoffset(mid) or timedelta()
        if offset == base_offset:
            low = mid
        else:
            high = mid
    final_offset = tz.utcoffset(high) or timedelta()
    return {
        "datetime": high,
        "from_offset": base_offset,
        "to_offset": final_offset,
    }


def _compute_time_change_from_zoneinfo(year: int) -> Optional[Dict[str, Any]]:
    tz = QUEBEC_TZ
    start = datetime(year, 1, 1, tzinfo=tz)
    end = datetime(year + 1, 1, 1, tzinfo=tz)
    cursor = start
    last_offset = tz.utcoffset(start) or timedelta()
    transitions: List[Dict[str, Any]] = []
    step = timedelta(hours=12)
    while cursor < end:
        next_cursor = min(end, cursor + step)
        offset = tz.utcoffset(next_cursor) or timedelta()
        if offset != last_offset:
            transitions.append(_refine_transition_window(cursor, next_cursor, last_offset))
            last_offset = transitions[-1]["to_offset"]
        cursor = next_cursor
    if not transitions:
        return None
    transitions.sort(key=lambda entry: entry["datetime"])
    if len(transitions) == 1:
        target = transitions[0]
        return {
            "start": target["datetime"],
            "end": target["datetime"],
            "source": "tzdata",
        }
    start_transition = transitions[0]
    end_transition = transitions[1]
    return {
        "start": start_transition["datetime"],
        "end": end_transition["datetime"],
        "source": "tzdata",
    }


def _get_time_change_schedule(year: int) -> Optional[Dict[str, Any]]:
    now = _now()
    with TIME_CHANGE_CACHE_LOCK:
        cache_year = TIME_CHANGE_CACHE.get("year")
        fetched_at = TIME_CHANGE_CACHE.get("fetched_at")
        cached = TIME_CHANGE_CACHE.get("data")
        if (
            cache_year == year
            and isinstance(fetched_at, datetime)
            and cached
            and (now - fetched_at) < TIME_CHANGE_CACHE_TTL
        ):
            return copy.deepcopy(cached)
        schedule = _fetch_time_change_schedule_from_web(year)
        if not schedule:
            schedule = _compute_time_change_from_zoneinfo(year)
        if schedule:
            TIME_CHANGE_CACHE["year"] = year
            TIME_CHANGE_CACHE["data"] = schedule
            TIME_CHANGE_CACHE["fetched_at"] = now
        return copy.deepcopy(schedule) if schedule else None


def _format_offset(delta: Optional[timedelta]) -> str:
    if delta is None:
        return ""
    seconds = int(delta.total_seconds())
    sign = "+" if seconds >= 0 else "-"
    seconds = abs(seconds)
    hours, remainder = divmod(seconds, 3600)
    minutes = remainder // 60
    return f"{sign}{hours:02d}:{minutes:02d}"


def _next_time_change_info() -> Optional[Dict[str, Any]]:
    now = _now().astimezone(QUEBEC_TZ)
    schedule = _get_time_change_schedule(now.year)
    candidates: List[tuple[datetime, str, str]] = []
    for kind in ("start", "end"):
        dt = schedule.get(kind) if schedule else None
        if isinstance(dt, datetime):
            local_dt = dt.astimezone(QUEBEC_TZ)
            if local_dt > now:
                candidates.append((local_dt, kind, schedule.get("source") or "unknown"))
    if not candidates:
        schedule = _get_time_change_schedule(now.year + 1)
        for kind in ("start", "end"):
            dt = schedule.get(kind) if schedule else None
            if isinstance(dt, datetime):
                local_dt = dt.astimezone(QUEBEC_TZ)
                if local_dt > now:
                    candidates.append((local_dt, kind, schedule.get("source") or "unknown"))

    if not candidates:
        return None

    candidates.sort(key=lambda entry: entry[0])
    change_dt, kind, source = candidates[0]
    before_offset = QUEBEC_TZ.utcoffset(change_dt - timedelta(hours=2)) or timedelta()
    after_offset = QUEBEC_TZ.utcoffset(change_dt + timedelta(hours=2)) or before_offset
    direction = "forward" if after_offset > before_offset else "backward"
    direction_label = "avancer" if direction == "forward" else "reculer"
    season = "summer" if direction == "forward" else "winter"
    season_label = "d'été" if direction == "forward" else "d'hiver"
    date_label = f"{change_dt.day} {TIME_CHANGE_MONTHS_FR[change_dt.month - 1]} {change_dt.year}"
    weekday_label = TIME_CHANGE_WEEKDAYS_FR[change_dt.weekday()]
    offset_hours = abs(after_offset - before_offset).total_seconds() / 3600.0
    days_until = (change_dt.date() - now.date()).days

    return {
        "change_at": change_dt.isoformat(),
        "change_at_local": change_dt.isoformat(),
        "kind": "dst_start" if kind == "start" else "dst_end",
        "direction": direction,
        "direction_label": direction_label,
        "season": season,
        "season_label": season_label,
        "weekday_label": weekday_label,
        "date_label": date_label,
        "time_label": change_dt.strftime("%H:%M"),
        "offset_from": _format_offset(before_offset),
        "offset_to": _format_offset(after_offset),
        "offset_hours": round(offset_hours, 2),
        "days_until": days_until,
        "source": source,
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
    return number


def _read_birthday_config(variant: str) -> Dict[str, Any]:
    if variant not in BIRTHDAY_VARIANTS:
        raise ValueError("Type de diapositive anniversaire invalide.")
    config_path = BIRTHDAY_SLIDE_CONFIG_DIR / f"{variant}.json"
    if not config_path.exists():
        return copy.deepcopy(BIRTHDAY_CONFIG_DEFAULT)

    def normalize_text_options(raw: Any) -> Dict[str, Any]:
        options = copy.deepcopy(BIRTHDAY_TEXT_OPTIONS_DEFAULT)
        if isinstance(raw, dict):
            if isinstance(raw.get("font_size_auto"), bool):
                options["font_size_auto"] = raw["font_size_auto"]
            if isinstance(raw.get("font_size"), (int, float)):
                options["font_size"] = max(6.0, min(220.0, float(raw["font_size"])))
            if isinstance(raw.get("scale_x"), (int, float)):
                scale_x = float(raw["scale_x"])
                if scale_x > 0:
                    options["scale_x"] = max(0.1, min(4.0, scale_x))
            if isinstance(raw.get("scale_y"), (int, float)):
                scale_y = float(raw["scale_y"])
                if scale_y > 0:
                    options["scale_y"] = max(0.1, min(4.0, scale_y))
            if isinstance(raw.get("font_family"), str):
                options["font_family"] = raw["font_family"]
            if isinstance(raw.get("width_percent"), (int, float)):
                options["width_percent"] = float(raw["width_percent"])
            if isinstance(raw.get("height_percent"), (int, float)):
                options["height_percent"] = float(raw["height_percent"])
            if isinstance(raw.get("color"), str):
                options["color"] = raw["color"]
            if isinstance(raw.get("underline"), bool):
                options["underline"] = raw["underline"]
            if isinstance(raw.get("bold"), bool):
                options["bold"] = raw["bold"]
            if isinstance(raw.get("italic"), bool):
                options["italic"] = raw["italic"]
            if isinstance(raw.get("background_color"), str):
                options["background_color"] = raw["background_color"] or None
            if isinstance(raw.get("background_opacity"), (int, float)):
                try:
                    opacity = float(raw["background_opacity"])
                except (TypeError, ValueError):
                    opacity = options["background_opacity"]
                if opacity < 0.0:
                    opacity = 0.0
                if opacity > 1.0:
                    opacity = 1.0
                options["background_opacity"] = opacity
            if isinstance(raw.get("offset_x_percent"), (int, float)):
                options["offset_x_percent"] = float(raw["offset_x_percent"])
            if isinstance(raw.get("offset_y_percent"), (int, float)):
                options["offset_y_percent"] = float(raw["offset_y_percent"])
            if isinstance(raw.get("curve"), (int, float)):
                options["curve"] = float(raw["curve"])
            if isinstance(raw.get("angle"), (int, float)):
                options["angle"] = float(raw["angle"])
        return options

    def normalize_lines(raw_lines: Any, fallback: Dict[str, Any]) -> List[Dict[str, Any]]:
        lines: List[Dict[str, Any]] = []
        if isinstance(raw_lines, list):
            for entry in raw_lines:
                if not isinstance(entry, dict):
                    continue
                text_val = entry.get("text")
                try:
                    text = str(text_val or "")
                except Exception:
                    text = ""
                options = normalize_text_options(entry.get("options"))
                lines.append({"text": text, "options": options})
                if len(lines) >= BIRTHDAY_MAX_LINES:
                    break

        if lines:
            return lines

        return [
            {"text": fallback.get("text1", ""), "options": fallback.get("text1_options", {})},
            {"text": fallback.get("text2", ""), "options": fallback.get("text2_options", {})},
            {"text": fallback.get("text3", ""), "options": fallback.get("text3_options", {})},
        ]
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
        if isinstance(data.get("text1"), str):
            merged["text1"] = data["text1"]
        if isinstance(data.get("text2"), str):
            merged["text2"] = data["text2"]
        if isinstance(data.get("text3"), str):
            merged["text3"] = data["text3"]
        merged["text1_options"] = normalize_text_options(data.get("text1_options"))
        merged["text2_options"] = normalize_text_options(data.get("text2_options"))
        merged["text3_options"] = normalize_text_options(data.get("text3_options"))
        if isinstance(data.get("background_path"), str):
            merged["background_path"] = data["background_path"] or None
        if isinstance(data.get("background_mimetype"), str):
            merged["background_mimetype"] = data["background_mimetype"] or None
        if isinstance(data.get("background_video_path"), str):
            merged["background_video_path"] = data["background_video_path"] or None
        if isinstance(data.get("background_video_mimetype"), str):
            merged["background_video_mimetype"] = data["background_video_mimetype"] or None
        merged["lines"] = normalize_lines(data.get("lines"), merged)
        # Aligner les anciens champs text1/2/3 avec la première série de lignes pour compatibilité.
        if merged["lines"]:
            merged["text1"] = merged["lines"][0]["text"]
            merged["text1_options"] = merged["lines"][0]["options"]
        if len(merged["lines"]) > 1:
            merged["text2"] = merged["lines"][1]["text"]
            merged["text2_options"] = merged["lines"][1]["options"]
        if len(merged["lines"]) > 2:
            merged["text3"] = merged["lines"][2]["text"]
            merged["text3_options"] = merged["lines"][2]["options"]
        # Retro-compatibilité : si les nouveaux champs ne sont pas présents,
        # réutiliser les anciens titres/sous-titres.
        if merged.get("text1") == BIRTHDAY_CONFIG_DEFAULT["text1"] and isinstance(data.get("title"), str):
            merged["text1"] = data["title"]
        if merged.get("text2") == BIRTHDAY_CONFIG_DEFAULT["text2"] and isinstance(data.get("subtitle"), str):
            merged["text2"] = data["subtitle"]
        if merged.get("text3") == BIRTHDAY_CONFIG_DEFAULT["text3"] and isinstance(data.get("body"), str):
            merged["text3"] = data["body"]
        return merged
    except (json.JSONDecodeError, OSError):
        return copy.deepcopy(BIRTHDAY_CONFIG_DEFAULT)


def _write_birthday_config(variant: str, config: Dict[str, Any]) -> Dict[str, Any]:
    if variant not in BIRTHDAY_VARIANTS:
        raise ValueError("Type de diapositive anniversaire invalide.")

    def normalize_text_options(raw: Any) -> Dict[str, Any]:
        options = copy.deepcopy(BIRTHDAY_TEXT_OPTIONS_DEFAULT)
        if isinstance(raw, dict):
            if isinstance(raw.get("font_size_auto"), bool):
                options["font_size_auto"] = raw["font_size_auto"]
            if isinstance(raw.get("font_size"), (int, float)):
                options["font_size"] = max(6.0, min(220.0, float(raw["font_size"])))
            if isinstance(raw.get("scale_x"), (int, float)):
                scale_x = float(raw["scale_x"])
                if scale_x > 0:
                    options["scale_x"] = max(0.1, min(4.0, scale_x))
            if isinstance(raw.get("scale_y"), (int, float)):
                scale_y = float(raw["scale_y"])
                if scale_y > 0:
                    options["scale_y"] = max(0.1, min(4.0, scale_y))
            if isinstance(raw.get("font_family"), str):
                options["font_family"] = raw["font_family"]
            if isinstance(raw.get("width_percent"), (int, float)):
                options["width_percent"] = float(raw["width_percent"])
            if isinstance(raw.get("height_percent"), (int, float)):
                options["height_percent"] = float(raw["height_percent"])
            if isinstance(raw.get("color"), str):
                options["color"] = raw["color"]
            if isinstance(raw.get("underline"), bool):
                options["underline"] = raw["underline"]
            if isinstance(raw.get("bold"), bool):
                options["bold"] = raw["bold"]
            if isinstance(raw.get("italic"), bool):
                options["italic"] = raw["italic"]
            if "background_color" in raw:
                if raw.get("background_color") is None:
                    options["background_color"] = None
                elif isinstance(raw.get("background_color"), str):
                    options["background_color"] = raw["background_color"]
            if isinstance(raw.get("background_opacity"), (int, float)):
                try:
                    opacity = float(raw["background_opacity"])
                except (TypeError, ValueError):
                    opacity = options["background_opacity"]
                if opacity < 0.0:
                    opacity = 0.0
                if opacity > 1.0:
                    opacity = 1.0
                options["background_opacity"] = opacity
            if isinstance(raw.get("offset_x_percent"), (int, float)):
                options["offset_x_percent"] = float(raw["offset_x_percent"])
            if isinstance(raw.get("offset_y_percent"), (int, float)):
                options["offset_y_percent"] = float(raw["offset_y_percent"])
            if isinstance(raw.get("curve"), (int, float)):
                options["curve"] = float(raw["curve"])
            if isinstance(raw.get("angle"), (int, float)):
                options["angle"] = float(raw["angle"])
        return options

    def normalize_lines(raw_lines: Any, legacy_target: Dict[str, Any]) -> List[Dict[str, Any]]:
        lines: List[Dict[str, Any]] = []
        if isinstance(raw_lines, list):
            for entry in raw_lines:
                if not isinstance(entry, dict):
                    continue
                text_val = entry.get("text")
                try:
                    text = str(text_val or "")
                except Exception:
                    text = ""
                options = normalize_text_options(entry.get("options"))
                lines.append({"text": text, "options": options})
                if len(lines) >= BIRTHDAY_MAX_LINES:
                    break
        if lines:
            return lines

        # Si aucune nouvelle structure, reconstituer avec les anciens champs.
        candidates = [
            (legacy_target.get("text1"), legacy_target.get("text1_options")),
            (legacy_target.get("text2"), legacy_target.get("text2_options")),
            (legacy_target.get("text3"), legacy_target.get("text3_options")),
        ]
        for text_val, options_val in candidates:
            try:
                text = str(text_val or "")
            except Exception:
                text = ""
            options = normalize_text_options(options_val)
            lines.append({"text": text, "options": options})
        return lines

    normalized = copy.deepcopy(BIRTHDAY_CONFIG_DEFAULT)
    if isinstance(config.get("title"), str):
        normalized["title"] = config["title"]
    if isinstance(config.get("subtitle"), str):
        normalized["subtitle"] = config["subtitle"]
    if isinstance(config.get("body"), str):
        normalized["body"] = config["body"]
    if isinstance(config.get("text1"), str):
        normalized["text1"] = config["text1"]
        normalized["title"] = config["text1"]
    if isinstance(config.get("text2"), str):
        normalized["text2"] = config["text2"]
        normalized["subtitle"] = config.get("subtitle", config["text2"])
    if isinstance(config.get("text3"), str):
        normalized["text3"] = config["text3"]
        normalized["body"] = config.get("body", config["text3"])

    normalized["text1_options"] = normalize_text_options(config.get("text1_options"))
    normalized["text2_options"] = normalize_text_options(config.get("text2_options"))
    normalized["text3_options"] = normalize_text_options(config.get("text3_options"))
    normalized["lines"] = normalize_lines(config.get("lines"), normalized)

    # Aligner les anciens champs avec les nouvelles lignes (les trois premières seulement).
    if normalized["lines"]:
        normalized["text1"] = normalized["lines"][0]["text"]
        normalized["text1_options"] = normalized["lines"][0]["options"]
    if len(normalized["lines"]) > 1:
        normalized["text2"] = normalized["lines"][1]["text"]
        normalized["text2_options"] = normalized["lines"][1]["options"]
    if len(normalized["lines"]) > 2:
        normalized["text3"] = normalized["lines"][2]["text"]
        normalized["text3_options"] = normalized["lines"][2]["options"]

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
    if "background_video_path" in config:
        if config["background_video_path"] is None:
            normalized["background_video_path"] = None
        elif isinstance(config["background_video_path"], str):
            normalized["background_video_path"] = config["background_video_path"] or None
    if "background_video_mimetype" in config:
        if config["background_video_mimetype"] is None:
            normalized["background_video_mimetype"] = None
        elif isinstance(config["background_video_mimetype"], str):
            normalized["background_video_mimetype"] = config["background_video_mimetype"] or None
    config_path = BIRTHDAY_SLIDE_CONFIG_DIR / f"{variant}.json"
    config_path.parent.mkdir(parents=True, exist_ok=True)
    stored_config: Dict[str, Any] = {"lines": normalized.get("lines", [])}
    if normalized.get("background_path") is not None:
        stored_config["background_path"] = normalized.get("background_path")
    if normalized.get("background_mimetype") is not None:
        stored_config["background_mimetype"] = normalized.get("background_mimetype")
    if normalized.get("background_video_path") is not None:
        stored_config["background_video_path"] = normalized.get("background_video_path")
    if normalized.get("background_video_mimetype") is not None:
        stored_config["background_video_mimetype"] = normalized.get("background_video_mimetype")
    with config_path.open("w", encoding="utf-8") as handle:
        json.dump(stored_config, handle, ensure_ascii=True, indent=2)
    return normalized


def _normalize_time_change_text_options(raw: Any) -> Dict[str, Any]:
    options = copy.deepcopy(TIME_CHANGE_TEXT_OPTIONS_DEFAULT)
    if isinstance(raw, dict):
        if isinstance(raw.get("font_size_auto"), bool):
            options["font_size_auto"] = raw["font_size_auto"]
        if isinstance(raw.get("font_size"), (int, float)):
            options["font_size"] = max(6.0, min(220.0, float(raw["font_size"])))
        if isinstance(raw.get("scale_x"), (int, float)):
            scale_x = float(raw["scale_x"])
            if scale_x > 0:
                options["scale_x"] = max(0.1, min(4.0, scale_x))
        if isinstance(raw.get("scale_y"), (int, float)):
            scale_y = float(raw["scale_y"])
            if scale_y > 0:
                options["scale_y"] = max(0.1, min(4.0, scale_y))
        if isinstance(raw.get("font_family"), str):
            options["font_family"] = raw["font_family"]
        if isinstance(raw.get("width_percent"), (int, float)):
            options["width_percent"] = float(raw["width_percent"])
        if isinstance(raw.get("height_percent"), (int, float)):
            options["height_percent"] = float(raw["height_percent"])
        if isinstance(raw.get("color"), str):
            options["color"] = raw["color"]
        if isinstance(raw.get("underline"), bool):
            options["underline"] = raw["underline"]
        if isinstance(raw.get("bold"), bool):
            options["bold"] = raw["bold"]
        if isinstance(raw.get("italic"), bool):
            options["italic"] = raw["italic"]
        if isinstance(raw.get("background_color"), str):
            options["background_color"] = raw["background_color"] or None
        if isinstance(raw.get("background_opacity"), (int, float)):
            try:
                opacity = float(raw["background_opacity"])
            except (TypeError, ValueError):
                opacity = options["background_opacity"]
            if opacity < 0.0:
                opacity = 0.0
            if opacity > 1.0:
                opacity = 1.0
            options["background_opacity"] = opacity
        if isinstance(raw.get("offset_x_percent"), (int, float)):
            options["offset_x_percent"] = float(raw["offset_x_percent"])
        if isinstance(raw.get("offset_y_percent"), (int, float)):
            options["offset_y_percent"] = float(raw["offset_y_percent"])
        if isinstance(raw.get("curve"), (int, float)):
            options["curve"] = float(raw["curve"])
        if isinstance(raw.get("angle"), (int, float)):
            options["angle"] = float(raw["angle"])
    return options


def _normalize_time_change_lines(raw_lines: Any, fallback: Dict[str, Any]) -> List[Dict[str, Any]]:
    lines: List[Dict[str, Any]] = []
    if isinstance(raw_lines, list):
        for entry in raw_lines:
            if not isinstance(entry, dict):
                continue
            text_val = entry.get("text")
            try:
                text = str(text_val or "")
            except Exception:
                text = ""
            options = _normalize_time_change_text_options(entry.get("options"))
            lines.append({"text": text, "options": options})
            if len(lines) >= TIME_CHANGE_MAX_LINES:
                break
    if lines:
        return lines

    fallback_candidates = [
        (fallback.get("text1"), fallback.get("text1_options")),
        (fallback.get("text2"), fallback.get("text2_options")),
        (fallback.get("text3"), fallback.get("text3_options")),
    ]
    for text_val, options_val in fallback_candidates:
        try:
            text = str(text_val or "")
        except Exception:
            text = ""
        options = _normalize_time_change_text_options(options_val)
        lines.append({"text": text, "options": options})
    return lines


def _normalize_time_change_config(
    raw: Any, base: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    result = copy.deepcopy(base or DEFAULT_SETTINGS["time_change_slide"])
    source = raw if isinstance(raw, dict) else {}

    for key, value in source.items():
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
        elif key == "days_before":
            try:
                days = int(value)
            except (TypeError, ValueError):
                continue
            if days < 0:
                days = 0
            if days > 365:
                days = 365
            result["days_before"] = days
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
        elif key == "title_text":
            try:
                text = str(value)
            except Exception:
                continue
            result["title_text"] = text
        elif key == "message_template":
            try:
                text = str(value)
            except Exception:
                continue
            result["message_template"] = text
        elif key == "offset_hours":
            try:
                hours = float(value)
            except (TypeError, ValueError):
                continue
            if hours < 0.0:
                hours = 0.0
            if hours > 5.0:
                hours = 5.0
            result["offset_hours"] = hours
        elif key == "title_font_size":
            try:
                size = float(value)
            except (TypeError, ValueError):
                continue
            if size < 8.0:
                size = 8.0
            if size > 120.0:
                size = 120.0
            result["title_font_size"] = size
        elif key == "message_font_size":
            try:
                size = float(value)
            except (TypeError, ValueError):
                continue
            if size < 8.0:
                size = 8.0
            if size > 120.0:
                size = 120.0
            result["message_font_size"] = size
        elif key == "meta_font_size":
            try:
                size = float(value)
            except (TypeError, ValueError):
                continue
            if size < 8.0:
                size = 8.0
            if size > 120.0:
                size = 120.0
            result["meta_font_size"] = size
        elif key == "text_color":
            if isinstance(value, str) and value.strip():
                result["text_color"] = value.strip()
        elif key == "text1":
            if isinstance(value, str) and value.strip():
                result["text1"] = value
        elif key == "text2":
            if isinstance(value, str) and value.strip():
                result["text2"] = value
        elif key == "text3":
            if isinstance(value, str) and value.strip():
                result["text3"] = value
        elif key == "text1_options":
            result["text1_options"] = _normalize_time_change_text_options(value)
        elif key == "text2_options":
            result["text2_options"] = _normalize_time_change_text_options(value)
        elif key == "text3_options":
            result["text3_options"] = _normalize_time_change_text_options(value)

    result["lines"] = _normalize_time_change_lines(source.get("lines"), result)

    if result["lines"]:
        result["text1"] = result["lines"][0]["text"]
        result["text1_options"] = result["lines"][0]["options"]
    if len(result["lines"]) > 1:
        result["text2"] = result["lines"][1]["text"]
        result["text2_options"] = result["lines"][1]["options"]
    if len(result["lines"]) > 2:
        result["text3"] = result["lines"][2]["text"]
        result["text3_options"] = result["lines"][2]["options"]
    return result


def _read_time_change_config_file() -> Optional[Dict[str, Any]]:
    if not TIME_CHANGE_CONFIG_FILE.exists():
        return None
    try:
        with TIME_CHANGE_CONFIG_FILE.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict):
        return None
    return _normalize_time_change_config(data, DEFAULT_SETTINGS["time_change_slide"])


def _write_time_change_config_file(config: Dict[str, Any]) -> Dict[str, Any]:
    base = _read_time_change_config_file() or DEFAULT_SETTINGS["time_change_slide"]
    normalized = _normalize_time_change_config(config, base)
    try:
        TIME_CHANGE_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with TIME_CHANGE_CONFIG_FILE.open("w", encoding="utf-8") as handle:
            json.dump(normalized, handle, ensure_ascii=True, indent=2)
    except OSError:
        pass
    return normalized


# ───────────────────────────────────────────────────────────────────────────────
# Christmas slide configuration
# ───────────────────────────────────────────────────────────────────────────────

CHRISTMAS_TEXT_OPTIONS_DEFAULT = {
    "font_size_auto": True,
    "font_size": 48.0,
    "scale_x": 1.0,
    "scale_y": 1.0,
    "font_family": "",
    "width_percent": 100.0,
    "height_percent": 0.0,
    "color": "#f8fafc",
    "underline": False,
    "bold": False,
    "italic": False,
    "background_color": None,
    "background_opacity": 0.0,
    "offset_x_percent": 0.0,
    "offset_y_percent": 0.0,
    "curve": 0.0,
    "angle": 0.0,
}
CHRISTMAS_MAX_LINES = 50


def _normalize_christmas_text_options(raw: Any) -> Dict[str, Any]:
    options = copy.deepcopy(CHRISTMAS_TEXT_OPTIONS_DEFAULT)
    if isinstance(raw, dict):
        if isinstance(raw.get("font_size_auto"), bool):
            options["font_size_auto"] = raw["font_size_auto"]
        if isinstance(raw.get("font_size"), (int, float)):
            options["font_size"] = max(6.0, min(220.0, float(raw["font_size"])))
        if isinstance(raw.get("scale_x"), (int, float)):
            scale_x = float(raw["scale_x"])
            if scale_x > 0:
                options["scale_x"] = max(0.1, min(4.0, scale_x))
        if isinstance(raw.get("scale_y"), (int, float)):
            scale_y = float(raw["scale_y"])
            if scale_y > 0:
                options["scale_y"] = max(0.1, min(4.0, scale_y))
        if isinstance(raw.get("font_family"), str):
            options["font_family"] = raw["font_family"]
        if isinstance(raw.get("width_percent"), (int, float)):
            options["width_percent"] = float(raw["width_percent"])
        if isinstance(raw.get("height_percent"), (int, float)):
            options["height_percent"] = float(raw["height_percent"])
        if isinstance(raw.get("color"), str):
            options["color"] = raw["color"]
        if isinstance(raw.get("underline"), bool):
            options["underline"] = raw["underline"]
        if isinstance(raw.get("bold"), bool):
            options["bold"] = raw["bold"]
        if isinstance(raw.get("italic"), bool):
            options["italic"] = raw["italic"]
        if isinstance(raw.get("background_color"), str):
            options["background_color"] = raw["background_color"] or None
        if isinstance(raw.get("background_opacity"), (int, float)):
            try:
                opacity = float(raw["background_opacity"])
            except (TypeError, ValueError):
                opacity = options["background_opacity"]
            if opacity < 0.0:
                opacity = 0.0
            if opacity > 1.0:
                opacity = 1.0
            options["background_opacity"] = opacity
        if isinstance(raw.get("offset_x_percent"), (int, float)):
            options["offset_x_percent"] = float(raw["offset_x_percent"])
        if isinstance(raw.get("offset_y_percent"), (int, float)):
            options["offset_y_percent"] = float(raw["offset_y_percent"])
        if isinstance(raw.get("curve"), (int, float)):
            options["curve"] = float(raw["curve"])
        if isinstance(raw.get("angle"), (int, float)):
            options["angle"] = float(raw["angle"])
    return options


def _normalize_christmas_lines(raw_lines: Any, fallback: Dict[str, Any]) -> List[Dict[str, Any]]:
    lines: List[Dict[str, Any]] = []
    if isinstance(raw_lines, list):
        for entry in raw_lines:
            if not isinstance(entry, dict):
                continue
            text_val = entry.get("text")
            try:
                text = str(text_val or "")
            except Exception:
                text = ""
            options = _normalize_christmas_text_options(entry.get("options"))
            lines.append({"text": text, "options": options})
            if len(lines) >= CHRISTMAS_MAX_LINES:
                break
    if lines:
        return lines

    fallback_candidates = [
        (fallback.get("text1"), fallback.get("text1_options")),
        (fallback.get("text2"), fallback.get("text2_options")),
        (fallback.get("text3"), fallback.get("text3_options")),
    ]
    for text_val, options_val in fallback_candidates:
        try:
            text = str(text_val or "")
        except Exception:
            text = ""
        options = _normalize_christmas_text_options(options_val)
        lines.append({"text": text, "options": options})
    return lines


def _normalize_christmas_config(
    raw: Any, base: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    result = copy.deepcopy(base or DEFAULT_SETTINGS["christmas_slide"])
    source = raw if isinstance(raw, dict) else {}

    for key, value in source.items():
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
        elif key == "days_before":
            try:
                days = int(value)
            except (TypeError, ValueError):
                continue
            if days < 0:
                days = 0
            if days > 365:
                days = 365
            result["days_before"] = days
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
        elif key == "title_text":
            try:
                text = str(value)
            except Exception:
                continue
            result["title_text"] = text
        elif key == "title_font_size":
            try:
                size = float(value)
            except (TypeError, ValueError):
                continue
            if size < 8.0:
                size = 8.0
            if size > 120.0:
                size = 120.0
            result["title_font_size"] = size
        elif key == "text_color":
            if isinstance(value, str) and value.strip():
                result["text_color"] = value.strip()
        elif key == "text1":
            if isinstance(value, str):
                result["text1"] = value
        elif key == "text2":
            if isinstance(value, str):
                result["text2"] = value
        elif key == "text3":
            if isinstance(value, str):
                result["text3"] = value
        elif key == "text1_options":
            result["text1_options"] = _normalize_christmas_text_options(value)
        elif key == "text2_options":
            result["text2_options"] = _normalize_christmas_text_options(value)
        elif key == "text3_options":
            result["text3_options"] = _normalize_christmas_text_options(value)

    result["lines"] = _normalize_christmas_lines(source.get("lines"), result)

    if result["lines"]:
        result["text1"] = result["lines"][0]["text"]
        result["text1_options"] = result["lines"][0]["options"]
    if len(result["lines"]) > 1:
        result["text2"] = result["lines"][1]["text"]
        result["text2_options"] = result["lines"][1]["options"]
    if len(result["lines"]) > 2:
        result["text3"] = result["lines"][2]["text"]
        result["text3_options"] = result["lines"][2]["options"]
    return result


def _read_christmas_config_file() -> Optional[Dict[str, Any]]:
    if not CHRISTMAS_CONFIG_FILE.exists():
        return None
    try:
        with CHRISTMAS_CONFIG_FILE.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict):
        return None
    return _normalize_christmas_config(data, DEFAULT_SETTINGS["christmas_slide"])


def _write_christmas_config_file(config: Dict[str, Any]) -> Dict[str, Any]:
    base = _read_christmas_config_file() or DEFAULT_SETTINGS["christmas_slide"]
    normalized = _normalize_christmas_config(config, base)
    try:
        CHRISTMAS_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with CHRISTMAS_CONFIG_FILE.open("w", encoding="utf-8") as handle:
            json.dump(normalized, handle, ensure_ascii=True, indent=2)
    except OSError:
        pass
    return normalized


def _next_christmas_info() -> Optional[Dict[str, Any]]:
    """Calcule les informations sur le prochain Noël."""
    now = _now().astimezone(QUEBEC_TZ)
    year = now.year
    christmas = datetime(year, 12, 25, 0, 0, 0, tzinfo=QUEBEC_TZ)
    
    # Si Noël est passé cette année, on prend l'année suivante
    if now.date() > christmas.date():
        year += 1
        christmas = datetime(year, 12, 25, 0, 0, 0, tzinfo=QUEBEC_TZ)
    
    days_until = (christmas.date() - now.date()).days
    weekday_label = TIME_CHANGE_WEEKDAYS_FR[christmas.weekday()]
    date_label = f"25 décembre {year}"
    
    return {
        "christmas_date": christmas.isoformat(),
        "year": year,
        "weekday_label": weekday_label,
        "date_label": date_label,
        "days_until": days_until,
        "days_label": "jour" if days_until == 1 else "jours",
    }


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


def _ensure_test_config_file() -> None:
    TEST_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)


def _read_test_config() -> Dict[str, Any]:
    if not TEST_CONFIG_FILE.exists():
        return {}
    try:
        with TEST_CONFIG_FILE.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
            if isinstance(data, dict):
                return data
    except (json.JSONDecodeError, OSError):
        pass
    return {}


def _write_test_config(config: Dict[str, Any]) -> None:
    _ensure_test_config_file()
    with TEST_CONFIG_FILE.open("w", encoding="utf-8") as handle:
        json.dump(config, handle, ensure_ascii=False, indent=2)


def _clamp_percent(value: float, fallback: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    if math.isnan(number) or math.isinf(number):
        return fallback
    return max(0.0, min(100.0, number))


def _clamp_dimension(value: float, fallback: float) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    if math.isnan(number) or math.isinf(number):
        return fallback
    return max(1.0, min(200.0, number))


def _normalize_text_position(position: Any) -> Dict[str, float]:
    if not isinstance(position, dict):
        return dict(DEFAULT_TEST_TEXT_POSITION)
    x = _clamp_percent(position.get("x"), DEFAULT_TEST_TEXT_POSITION["x"])
    y = _clamp_percent(position.get("y"), DEFAULT_TEST_TEXT_POSITION["y"])
    return {"x": x, "y": y}


def _normalize_test_meta(raw: Any) -> Dict[str, str]:
    meta = dict(DEFAULT_TEST_SLIDE_META)
    if not isinstance(raw, dict):
        return meta
    name = raw.get("name")
    event_date = raw.get("event_date")
    if isinstance(name, str):
        stripped = name.strip()
        if stripped:
            meta["name"] = stripped
    if isinstance(event_date, str):
        meta["event_date"] = event_date.strip()
    return meta


def _read_test_meta(config: Dict[str, Any]) -> Dict[str, str]:
    raw = {
        "name": config.get("slide_name"),
        "event_date": config.get("event_date"),
    }
    return _normalize_test_meta(raw)


def _write_test_meta(config: Dict[str, Any], meta: Dict[str, str]) -> None:
    config["slide_name"] = meta.get("name", DEFAULT_TEST_SLIDE_META["name"])
    config["event_date"] = meta.get("event_date", DEFAULT_TEST_SLIDE_META["event_date"])


def _parse_event_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        year, month, day = map(int, value.split("-"))
        return date(year, month, day)
    except Exception:
        return None


def _days_until(base_date: date, target_date: Optional[date]) -> int:
    if not target_date:
        return 0
    delta = target_date - base_date
    return max(0, delta.days)


def _format_weekday(dt: date, capitalize: bool = False) -> str:
    label = FRENCH_WEEKDAYS[dt.weekday()]
    return label.capitalize() if capitalize else label


def _format_month(dt: date, capitalize: bool = False) -> str:
    label = FRENCH_MONTHS[dt.month - 1]
    if capitalize:
        if label == "août":
            return "Août"
        return label.capitalize()
    return label


def _season_for_date(dt: date, capitalize: bool = False) -> str:
    month = dt.month
    day = dt.day
    label = "hiver"
    if (month == 3 and day >= 20) or month in {4, 5} or (month == 6 and day < 21):
        label = "printemps"
    elif (month == 6 and day >= 21) or month in {7, 8} or (month == 9 and day < 22):
        label = "été"
    elif (month == 9 and day >= 22) or month in {10, 11} or (month == 12 and day < 21):
        label = "automne"
    if capitalize:
        if label == "été":
            return "Été"
        return label.capitalize()
    return label


def _pluralize_day(days: int, capitalize: bool = False) -> str:
    base = "jour" if days == 1 else "jours"
    if capitalize:
        return base.capitalize()
    return base


def _build_test_token_map(meta: Dict[str, str]) -> Dict[str, str]:
    now = datetime.now(QUEBEC_TZ)
    today = now.date()
    event_date = _parse_event_date(meta.get("event_date"))
    days_left = _days_until(today, event_date)
    countdown = f"{days_left} {_pluralize_day(days_left)}"
    date_label = f"{today.day} {_format_month(today, capitalize=True)} {today.year}"
    event_date_label = (
        f"{event_date.day} {_format_month(event_date, capitalize=True)} {event_date.year}"
        if event_date
        else ""
    )
    return {
        "[slide_name]": meta.get("name") or DEFAULT_TEST_SLIDE_META["name"],
        "[date]": date_label,
        "[time]": now.strftime("%H:%M"),
        "[weekday]": _format_weekday(today),
        "[Weekday]": _format_weekday(today, capitalize=True),
        "[month]": _format_month(today),
        "[Month]": _format_month(today, capitalize=True),
        "[year]": str(today.year),
        "[season]": _season_for_date(today),
        "[seasons]": _season_for_date(today, capitalize=True),
        "[Season]": _season_for_date(today, capitalize=True),
        "[days_left]": str(days_left),
        "[event_countdown]": countdown,
        "[day_days]": _pluralize_day(days_left),
        "[Day_Days]": _pluralize_day(days_left, capitalize=True),
        "[event_date]": event_date_label,
        "[event_weekday]": _format_weekday(event_date, capitalize=True) if event_date else "",
        "[event_month]": _format_month(event_date, capitalize=True) if event_date else "",
        "[event_year]": str(event_date.year) if event_date else "",
    }


def _resolve_test_tokens(value: str, token_map: Dict[str, str]) -> str:
    if not value:
        return ""
    resolved = value
    for token, replacement in token_map.items():
        resolved = resolved.replace(token, replacement or "")
    return resolved


def _normalize_text_entry(raw: Any) -> Dict[str, Any]:
    if isinstance(raw, dict):
        value = raw.get("value") or ""
        position_data = raw.get("position")
        size_data = raw.get("size")
        color_value = raw.get("color")
        style_data = raw.get("style")
    else:
        value = raw or ""
        position_data = None
        size_data = None
        color_value = None
        style_data = None
    return {
        "value": str(value),
        "position": _normalize_text_position(position_data),
        "size": _normalize_text_size(size_data),
        "color": _normalize_text_color(color_value),
        "background": _normalize_text_background(raw.get("background") if isinstance(raw, dict) else None),
        "style": _normalize_text_style(style_data),
    }


def _normalize_text_size(raw: Any) -> Dict[str, float]:
    if not isinstance(raw, dict):
        return dict(DEFAULT_TEST_TEXT_SIZE)
    width = _clamp_dimension(raw.get("width"), DEFAULT_TEST_TEXT_SIZE["width"])
    height = _clamp_dimension(raw.get("height"), DEFAULT_TEST_TEXT_SIZE["height"])
    return {"width": width, "height": height}


def _normalize_text_color(raw: Any) -> str:
    if isinstance(raw, str):
        value = raw.strip()
        if value and re.fullmatch(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})", value):
            if len(value) == 4:
                # Normalize #RGB values into #RRGGBB for consistency.
                return f"#{value[1]*2}{value[2]*2}{value[3]*2}".lower()
            return value.lower()
    return DEFAULT_TEST_TEXT_COLOR


def _normalize_text_background(raw: Any) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raw = {}
    color_value = raw.get("color")
    color = _normalize_text_color(color_value) if isinstance(color_value, str) else DEFAULT_TEST_TEXT_BACKGROUND["color"]
    try:
        opacity = float(raw.get("opacity"))
    except (TypeError, ValueError):
        opacity = DEFAULT_TEST_TEXT_BACKGROUND["opacity"]
    if math.isnan(opacity) or math.isinf(opacity):
        opacity = DEFAULT_TEST_TEXT_BACKGROUND["opacity"]
    opacity = max(0.0, min(1.0, opacity))
    return {"color": color, "opacity": opacity}


def _coerce_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        lower = value.strip().lower()
        if lower in {"1", "true", "yes", "on"}:
            return True
        if lower in {"0", "false", "no", "off"}:
            return False
    return default


def _normalize_text_style(raw: Any) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raw = {}
    font_family = raw.get("font_family")
    if isinstance(font_family, str):
        font_family = font_family.strip()
    if not font_family or font_family not in AVAILABLE_TEST_FONT_FAMILIES:
        font_family = DEFAULT_TEST_TEXT_STYLE["font_family"]
    font_size_auto = _coerce_bool(raw.get("font_size_auto"), DEFAULT_TEST_TEXT_STYLE["font_size_auto"])
    try:
        font_size = float(raw.get("font_size", DEFAULT_TEST_TEXT_STYLE["font_size"]))
    except (TypeError, ValueError):
        font_size = float(DEFAULT_TEST_TEXT_STYLE["font_size"])
    if math.isnan(font_size) or math.isinf(font_size):
        font_size = float(DEFAULT_TEST_TEXT_STYLE["font_size"])
    font_size = max(6.0, min(220.0, font_size))
    try:
        scale_x = float(raw.get("scale_x", DEFAULT_TEST_TEXT_STYLE["scale_x"]))
    except (TypeError, ValueError):
        scale_x = float(DEFAULT_TEST_TEXT_STYLE["scale_x"])
    if math.isnan(scale_x) or math.isinf(scale_x) or scale_x <= 0:
        scale_x = float(DEFAULT_TEST_TEXT_STYLE["scale_x"])
    scale_x = max(0.1, min(4.0, scale_x))
    try:
        scale_y = float(raw.get("scale_y", DEFAULT_TEST_TEXT_STYLE["scale_y"]))
    except (TypeError, ValueError):
        scale_y = float(DEFAULT_TEST_TEXT_STYLE["scale_y"])
    if math.isnan(scale_y) or math.isinf(scale_y) or scale_y <= 0:
        scale_y = float(DEFAULT_TEST_TEXT_STYLE["scale_y"])
    scale_y = max(0.1, min(4.0, scale_y))
    return {
        "font_family": font_family,
        "font_size_auto": font_size_auto,
        "font_size": font_size,
        "scale_x": scale_x,
        "scale_y": scale_y,
        "bold": _coerce_bool(raw.get("bold"), DEFAULT_TEST_TEXT_STYLE["bold"]),
        "italic": _coerce_bool(raw.get("italic"), DEFAULT_TEST_TEXT_STYLE["italic"]),
        "underline": _coerce_bool(raw.get("underline"), DEFAULT_TEST_TEXT_STYLE["underline"]),
    }


def _collect_text_entries(config: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    raw_texts = config.get("texts")
    normalized: Dict[str, Dict[str, Any]] = {}
    if isinstance(raw_texts, dict):
        for name, raw in raw_texts.items():
            entry = _normalize_text_entry(raw)
            if entry.get("value") and entry["value"].strip():
                normalized[name] = entry
    return normalized


def _text_name_is_valid(name: str) -> bool:
    return bool(re.fullmatch(r"text\d+", name))


def _build_test_slide_payload() -> Dict[str, Any]:
    config = _read_test_config()
    texts = []
    entries = _collect_text_entries(config)
    meta = _read_test_meta(config)
    token_map = _build_test_token_map(meta)
    for name in sorted(
        entries.keys(),
        key=lambda n: int(n.replace("text", "")) if n.startswith("text") and n[4:].isdigit() else n,
    ):
        entry = entries[name]
        resolved_value = _resolve_test_tokens(entry.get("value") or "", token_map)
        texts.append(
            {
                "name": name,
                "value": entry.get("value") or "",
                "resolved_value": resolved_value,
                "position": entry.get("position") or dict(DEFAULT_TEST_TEXT_POSITION),
                "size": entry.get("size") or dict(DEFAULT_TEST_TEXT_SIZE),
                "color": entry.get("color") or DEFAULT_TEST_TEXT_COLOR,
                "style": entry.get("style") or dict(DEFAULT_TEST_TEXT_STYLE),
                "background": entry.get("background") or dict(DEFAULT_TEST_TEXT_BACKGROUND),
            }
        )

    background_name = config.get("background")
    background_data: Optional[Dict[str, Any]] = None
    has_background = False
    if isinstance(background_name, str) and background_name:
        target = TEST_BACKGROUND_DIR / background_name
        if target.exists() and target.is_file():
            has_background = True
            mimetype = _guess_mimetype(background_name) or "application/octet-stream"
            background_data = {
                "name": background_name,
                "url": url_for("main.serve_test_background", filename=background_name, _external=False),
                "mimetype": mimetype,
                "is_video": mimetype.startswith("video/"),
            }

    try:
        signature_source = TEST_CONFIG_FILE.stat().st_mtime
    except OSError:
        signature_source = None
    signature_parts = [
        background_name or "",
        str(signature_source or ""),
        str(len(texts)),
        meta.get("name") or "",
        meta.get("event_date") or "",
    ]
    return {
        "background": background_data,
        "texts": texts,
        "has_background": has_background,
        "has_texts": any((entry["value"] or "").strip() for entry in texts),
        "meta": meta,
        "signature": "|".join(signature_parts),
    }


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
            elif key == "days_before":
                try:
                    days = float(value)
                except (TypeError, ValueError):
                    continue
                # Accept both int and float inputs, clamp to a sensible range.
                if days < 0.0:
                    days = 0.0
                if days > 365.0:
                    days = 365.0
                result["days_before"] = days
            elif key == "days_before":
                try:
                    days = int(value)
                except (TypeError, ValueError):
                    continue
                if days < 0:
                    days = 0
                if days > 365:
                    days = 365
                result["days_before"] = days
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
            elif key == "avatar_size":
                try:
                    size = float(value)
                except (TypeError, ValueError):
                    continue
                if size < 48.0:
                    size = 48.0
                if size > 200.0:
                    size = 200.0
                result["avatar_size"] = size
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

    def _normalize_test_slide(
        self, test_slide: Dict[str, Any], base: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        result = copy.deepcopy(base or DEFAULT_SETTINGS["test_slide"])
        if not isinstance(test_slide, dict):
            return result
        for key, value in test_slide.items():
            if key == "enabled":
                result["enabled"] = bool(value)
            elif key == "order_index":
                try:
                    index = int(value)
                except (TypeError, ValueError):
                    continue
                result["order_index"] = max(0, index)
            elif key == "duration":
                try:
                    duration = float(value)
                except (TypeError, ValueError):
                    continue
                duration = max(1.0, min(600.0, duration))
                result["duration"] = duration
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
            elif key == "open_days":
                if isinstance(value, dict):
                    normalized_open = dict(result.get("open_days") or {})
                    for day in (
                        "monday",
                        "tuesday",
                        "wednesday",
                        "thursday",
                        "friday",
                        "saturday",
                        "sunday",
                    ):
                        normalized_open[day] = bool(value.get(day, normalized_open.get(day, False)))
                    result["open_days"] = normalized_open
        return result

    def _normalize_time_change_slide(
        self, time_change_slide: Dict[str, Any], base: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        persisted_config = _read_time_change_config_file()
        merged: Dict[str, Any] = {}
        if isinstance(persisted_config, dict):
            merged.update(persisted_config)
        if isinstance(time_change_slide, dict):
            merged.update(time_change_slide)
        base_config = base or persisted_config or DEFAULT_SETTINGS["time_change_slide"]
        return _normalize_time_change_config(merged, base_config)

    def _normalize_christmas_slide(
        self, christmas_slide: Dict[str, Any], base: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        persisted_config = _read_christmas_config_file()
        merged: Dict[str, Any] = {}
        if isinstance(persisted_config, dict):
            merged.update(persisted_config)
        if isinstance(christmas_slide, dict):
            merged.update(christmas_slide)
        base_config = base or persisted_config or DEFAULT_SETTINGS["christmas_slide"]
        return _normalize_christmas_config(merged, base_config)

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
        test_slide = settings.get("test_slide")
        if not isinstance(test_slide, dict):
            test_slide = {}
        birthday_slide = settings.get("birthday_slide")
        if not isinstance(birthday_slide, dict):
            birthday_slide = {}
        time_change_slide = settings.get("time_change_slide")
        if not isinstance(time_change_slide, dict):
            time_change_slide = {}
        christmas_slide = settings.get("christmas_slide")
        if not isinstance(christmas_slide, dict):
            christmas_slide = {}
        normalized_overlay = self._normalize_overlay(overlay, DEFAULT_SETTINGS["overlay"])
        normalized_team = self._normalize_team_slide(team_slide, DEFAULT_SETTINGS["team_slide"])
        normalized_test = self._normalize_test_slide(test_slide, DEFAULT_SETTINGS["test_slide"])
        normalized_birthday = self._normalize_birthday_slide(
            birthday_slide, DEFAULT_SETTINGS["birthday_slide"]
        )
        normalized_time_change = self._normalize_time_change_slide(
            time_change_slide, DEFAULT_SETTINGS["time_change_slide"]
        )
        normalized_christmas = self._normalize_christmas_slide(
            christmas_slide, DEFAULT_SETTINGS["christmas_slide"]
        )
        normalized_settings = {
            "overlay": normalized_overlay,
            "team_slide": normalized_team,
            "test_slide": normalized_test,
            "birthday_slide": normalized_birthday,
            "time_change_slide": normalized_time_change,
            "christmas_slide": normalized_christmas,
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
            if "test_slide" in updates:
                test_updates = updates["test_slide"]
                if not isinstance(test_updates, dict):
                    raise ValueError("Le bloc test_slide doit être un objet.")
                current_test = self._data["settings"].get("test_slide") or DEFAULT_SETTINGS["test_slide"]
                normalized_test = self._normalize_test_slide(test_updates, current_test)
                self._data["settings"]["test_slide"] = normalized_test
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
            if "time_change_slide" in updates:
                time_change_updates = updates["time_change_slide"]
                if not isinstance(time_change_updates, dict):
                    raise ValueError("Le bloc time_change_slide doit être un objet.")
                current_time_change = (
                    self._data["settings"].get("time_change_slide") or DEFAULT_SETTINGS["time_change_slide"]
                )
                normalized_time_change = self._normalize_time_change_slide(
                    time_change_updates, current_time_change
                )
                normalized_time_change = _write_time_change_config_file(normalized_time_change)
                self._data["settings"]["time_change_slide"] = normalized_time_change
                handled = True
            if "christmas_slide" in updates:
                christmas_updates = updates["christmas_slide"]
                if not isinstance(christmas_updates, dict):
                    raise ValueError("Le bloc christmas_slide doit être un objet.")
                current_christmas = (
                    self._data["settings"].get("christmas_slide") or DEFAULT_SETTINGS["christmas_slide"]
                )
                normalized_christmas = self._normalize_christmas_slide(
                    christmas_updates, current_christmas
                )
                normalized_christmas = _write_christmas_config_file(normalized_christmas)
                self._data["settings"]["christmas_slide"] = normalized_christmas
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
            app_logger.error("[employees] Impossible d'écrire %s: %s", self._json_path, exc)

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


app = Flask(
    __name__,
    static_folder=str(FRONTEND_STATIC_DIR),
    template_folder=str(FRONTEND_TEMPLATES_DIR),
    static_url_path="/cardinaltv/static",
)
app.logger.handlers = app_logger.handlers[:]
app.logger.setLevel(app_logger.level)
app.logger.propagate = False
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


@bp.route("/diaporama", endpoint="slideshow_overview")
@bp.route("/slideshow-editor")
def slideshow_overview() -> Any:
    return render_template("slideshow_editor.html")


@bp.route("/diaporama/upload")
def upload() -> Any:
    return render_template("upload.html")


@bp.route("/diaporama/playlist")
def playlist() -> Any:
    return render_template("playlist.html")


@bp.route("/diaporama/employes")
def employees() -> Any:
    return render_template("employees.html")


@bp.route("/diaporama/team")
def team() -> Any:
    return render_template("team.html")


@bp.route("/diaporama/test", endpoint="test")
def test_page() -> Any:
    return render_template("test.html")


@bp.route("/diaporama/anniversaire")
def birthday() -> Any:
    return render_template("birthday.html")


@bp.route("/diaporama/changement-heure")
def time_change() -> Any:
    return render_template("time_change.html")


@bp.route("/diaporama/noel")
def christmas() -> Any:
    return render_template("christmas.html")


@bp.route("/diaporama/nouvelles", endpoint="news")
def news_page() -> Any:
    return render_template("news.html")


@bp.route("/diaporama/meteo", endpoint="weather")
def weather_page() -> Any:
    return render_template("weather.html")


@bp.route("/diaporama/bandes-informatives", endpoint="info_bands")
def info_bands_page() -> Any:
    return render_template("info_bands.html")


# ─────────────────────────────────────────────────────────────────────────────
# Info Bands API
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_INFO_BANDS_CONFIG: Dict[str, Any] = {
    "enabled": False,
    "frame": {"size": 100, "position": "bottom-right"},
    "bands": {
        "primary": "horizontal",
        "horizontal": {"background": "#ffffff"},
        "vertical": {"background": "#a3a3a3"},
    },
    "widgets": [],
}


def _load_info_bands_config() -> Dict[str, Any]:
    """Load info bands configuration from JSON file."""
    try:
        if INFO_BANDS_CONFIG_FILE.exists():
            raw = json.loads(INFO_BANDS_CONFIG_FILE.read_text(encoding="utf-8"))
            if isinstance(raw, dict):
                # Merge with defaults to ensure all keys exist
                config = copy.deepcopy(DEFAULT_INFO_BANDS_CONFIG)
                config["enabled"] = bool(raw.get("enabled", False))
                frame = raw.get("frame", {})
                if isinstance(frame, dict):
                    config["frame"]["size"] = _ensure_number(frame.get("size"), 100, minimum=50, maximum=100)
                    pos = frame.get("position", "bottom-right")
                    if pos in ("top-left", "top-right", "bottom-left", "bottom-right", "center"):
                        config["frame"]["position"] = pos
                bands = raw.get("bands", {})
                if isinstance(bands, dict):
                    primary = bands.get("primary")
                    if primary in ("horizontal", "vertical"):
                        config["bands"]["primary"] = primary
                    for band_key in ("horizontal", "vertical"):
                        band = bands.get(band_key, {})
                        if isinstance(band, dict):
                            bg = band.get("background")
                            if isinstance(bg, str) and bg:
                                config["bands"][band_key]["background"] = bg
                widgets = raw.get("widgets", [])
                if isinstance(widgets, list):
                    normalized_widgets = []
                    for widget in widgets:
                        if not isinstance(widget, dict):
                            continue
                        widget_id = str(widget.get("id") or "").strip()
                        widget_type = str(widget.get("type") or "").strip()
                        if not widget_type:
                            continue
                        x = _ensure_number(widget.get("x"), 50, minimum=0, maximum=100)
                        y = _ensure_number(widget.get("y"), 50, minimum=0, maximum=100)
                        scale = _ensure_number(widget.get("scale"), 1.0, minimum=0.1)
                        width = _ensure_number(widget.get("width"), 0.0, minimum=0.0)
                        height = _ensure_number(widget.get("height"), 0.0, minimum=0.0)
                        padding = _ensure_number(widget.get("padding"), 0.0, minimum=0.0)
                        radius = _ensure_number(widget.get("radius"), 0.0, minimum=0.0)
                        background_opacity = _ensure_number(
                            widget.get("background_opacity"), 0.0, minimum=0.0, maximum=1.0
                        )
                        border_width = _ensure_number(widget.get("border_width"), 0.0, minimum=0.0)
                        font_size = _ensure_number(widget.get("font_size"), 0.0, minimum=0.0)
                        background_color = widget.get("background_color")
                        if not isinstance(background_color, str) or not background_color:
                            background_color = "#000000"
                        border_color = widget.get("border_color")
                        if not isinstance(border_color, str) or not border_color:
                            border_color = "#ffffff"
                        text_color = widget.get("text_color")
                        if not isinstance(text_color, str) or not text_color:
                            text_color = "#111111"
                        image_src = widget.get("image_src")
                        if not isinstance(image_src, str):
                            image_src = ""
                        text = widget.get("text")
                        if not isinstance(text, str):
                            text = ""
                        show_seconds = bool(widget.get("show_seconds"))
                        enabled = widget.get("enabled")
                        if enabled is None:
                            enabled = True
                        else:
                            enabled = bool(enabled)
                        weather_city = widget.get("weather_city")
                        if not isinstance(weather_city, str):
                            weather_city = ""
                        weather_lat = widget.get("weather_lat")
                        weather_lon = widget.get("weather_lon")
                        try:
                            weather_lat = float(weather_lat) if weather_lat is not None else None
                        except Exception:
                            weather_lat = None
                        try:
                            weather_lon = float(weather_lon) if weather_lon is not None else None
                        except Exception:
                            weather_lon = None
                        progress_style = widget.get("progress_style")
                        if progress_style not in ("numeric", "dots", "bars", "steps", "bar"):
                            progress_style = "numeric"
                        progress_direction = widget.get("progress_direction")
                        if progress_direction not in ("horizontal", "vertical"):
                            progress_direction = "horizontal"
                        normalized_widgets.append(
                            {
                                "id": widget_id or uuid.uuid4().hex,
                                "type": widget_type,
                                "x": x,
                                "y": y,
                                "scale": scale,
                                "width": width,
                                "height": height,
                                "padding": padding,
                                "radius": radius,
                                "background_color": background_color,
                                "background_opacity": background_opacity,
                                "border_color": border_color,
                                "border_width": border_width,
                                "text_color": text_color,
                                "font_size": font_size,
                                "image_src": image_src,
                                "text": text,
                                "show_seconds": show_seconds,
                                "enabled": enabled,
                                "weather_city": weather_city,
                                "weather_lat": weather_lat,
                                "weather_lon": weather_lon,
                                "progress_style": progress_style,
                                "progress_direction": progress_direction,
                            }
                        )
                    config["widgets"] = normalized_widgets
                return config
    except Exception:
        pass
    return copy.deepcopy(DEFAULT_INFO_BANDS_CONFIG)


def _save_info_bands_config(config: Dict[str, Any]) -> None:
    """Save info bands configuration to JSON file."""
    INFO_BANDS_CONFIG_FILE.write_text(json.dumps(config, indent=2), encoding="utf-8")


@bp.route("/api/info-bands", methods=["GET"])
def api_info_bands_get() -> Any:
    """Get current info bands configuration."""
    return jsonify(_load_info_bands_config())


@bp.route("/api/info-bands", methods=["POST"])
def api_info_bands_update() -> Any:
    """Update info bands configuration."""
    payload = request.get_json(force=True, silent=True) or {}
    config = _load_info_bands_config()

    # Update enabled
    if "enabled" in payload:
        config["enabled"] = bool(payload["enabled"])

    # Update frame settings
    if "frame" in payload and isinstance(payload["frame"], dict):
        frame = payload["frame"]
        if "size" in frame:
            config["frame"]["size"] = _ensure_number(frame["size"], config["frame"]["size"], minimum=50, maximum=100)
        if "position" in frame:
            pos = frame["position"]
            if pos in ("top-left", "top-right", "bottom-left", "bottom-right", "center"):
                config["frame"]["position"] = pos

    # Update band backgrounds
    if "bands" in payload and isinstance(payload["bands"], dict):
        bands_payload = payload["bands"]
        primary = bands_payload.get("primary")
        if primary in ("horizontal", "vertical"):
            config["bands"]["primary"] = primary
        for band_key in ("horizontal", "vertical"):
            band = bands_payload.get(band_key, {})
            if isinstance(band, dict) and "background" in band:
                bg = band["background"]
                if isinstance(bg, str) and bg:
                    config["bands"][band_key]["background"] = bg

    if "widgets" in payload and isinstance(payload["widgets"], list):
        normalized_widgets = []
        for widget in payload["widgets"]:
            if not isinstance(widget, dict):
                continue
            widget_id = str(widget.get("id") or "").strip()
            widget_type = str(widget.get("type") or "").strip()
            if not widget_type:
                continue
            x = _ensure_number(widget.get("x"), 50, minimum=0, maximum=100)
            y = _ensure_number(widget.get("y"), 50, minimum=0, maximum=100)
            scale = _ensure_number(widget.get("scale"), 1.0, minimum=0.1)
            width = _ensure_number(widget.get("width"), 0.0, minimum=0.0)
            height = _ensure_number(widget.get("height"), 0.0, minimum=0.0)
            padding = _ensure_number(widget.get("padding"), 0.0, minimum=0.0)
            radius = _ensure_number(widget.get("radius"), 0.0, minimum=0.0)
            background_opacity = _ensure_number(widget.get("background_opacity"), 0.0, minimum=0.0, maximum=1.0)
            border_width = _ensure_number(widget.get("border_width"), 0.0, minimum=0.0)
            font_size = _ensure_number(widget.get("font_size"), 0.0, minimum=0.0)
            background_color = widget.get("background_color")
            if not isinstance(background_color, str) or not background_color:
                background_color = "#000000"
            border_color = widget.get("border_color")
            if not isinstance(border_color, str) or not border_color:
                border_color = "#ffffff"
            text_color = widget.get("text_color")
            if not isinstance(text_color, str) or not text_color:
                text_color = "#111111"
            image_src = widget.get("image_src")
            if not isinstance(image_src, str):
                image_src = ""
            text = widget.get("text")
            if not isinstance(text, str):
                text = ""
            show_seconds = bool(widget.get("show_seconds"))
            enabled = widget.get("enabled")
            if enabled is None:
                enabled = True
            else:
                enabled = bool(enabled)
            weather_city = widget.get("weather_city")
            if not isinstance(weather_city, str):
                weather_city = ""
            weather_lat = widget.get("weather_lat")
            weather_lon = widget.get("weather_lon")
            try:
                weather_lat = float(weather_lat) if weather_lat is not None else None
            except Exception:
                weather_lat = None
            try:
                weather_lon = float(weather_lon) if weather_lon is not None else None
            except Exception:
                weather_lon = None
            progress_style = widget.get("progress_style")
            if progress_style not in ("numeric", "dots", "bars", "steps", "bar"):
                progress_style = "numeric"
            progress_direction = widget.get("progress_direction")
            if progress_direction not in ("horizontal", "vertical"):
                progress_direction = "horizontal"
            normalized_widgets.append(
                {
                    "id": widget_id or uuid.uuid4().hex,
                    "type": widget_type,
                    "x": x,
                    "y": y,
                    "scale": scale,
                    "width": width,
                    "height": height,
                    "padding": padding,
                    "radius": radius,
                    "background_color": background_color,
                    "background_opacity": background_opacity,
                    "border_color": border_color,
                    "border_width": border_width,
                    "text_color": text_color,
                    "font_size": font_size,
                    "image_src": image_src,
                    "text": text,
                    "show_seconds": show_seconds,
                    "enabled": enabled,
                    "weather_city": weather_city,
                    "weather_lat": weather_lat,
                    "weather_lon": weather_lon,
                    "progress_style": progress_style,
                    "progress_direction": progress_direction,
                }
            )
        config["widgets"] = normalized_widgets

    _save_info_bands_config(config)
    return jsonify({"success": True, "config": config})


def _load_custom_slides_index() -> Dict[str, Any]:
    try:
        raw = json.loads(CUSTOM_SLIDES_INDEX_FILE.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            return {"slides": []}
        slides = raw.get("slides")
        if not isinstance(slides, list):
            slides = []
        return {"slides": slides}
    except Exception:
        return {"slides": []}


def _save_custom_slides_index(data: Dict[str, Any]) -> None:
    payload = {"slides": data.get("slides") if isinstance(data.get("slides"), list) else []}
    CUSTOM_SLIDES_INDEX_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _custom_slide_dir(slide_id: str) -> Path:
    safe = re.sub(r"[^0-9a-fA-F]", "", slide_id or "")
    return CUSTOM_SLIDES_DIR / safe


def _custom_slide_config_path(slide_id: str) -> Path:
    return _custom_slide_dir(slide_id) / "config.json"


def _load_custom_slide_config(slide_id: str) -> Dict[str, Any]:
    path = _custom_slide_config_path(slide_id)
    if not path.exists():
        return {"background": None, "texts": [], "meta": {"name": "", "event_date": ""}}
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            return {"background": None, "texts": [], "meta": {"name": "", "event_date": ""}}
        return raw
    except Exception:
        return {"background": None, "texts": [], "meta": {"name": "", "event_date": ""}}


def _save_custom_slide_config(slide_id: str, data: Dict[str, Any]) -> None:
    slide_folder = _custom_slide_dir(slide_id)
    slide_folder.mkdir(parents=True, exist_ok=True)
    path = _custom_slide_config_path(slide_id)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _get_custom_slide_index_entry(slide_id: str) -> Optional[Dict[str, Any]]:
    index = _load_custom_slides_index()
    for entry in index.get("slides", []):
        if isinstance(entry, dict) and entry.get("id") == slide_id:
            return entry
    return None


def _normalize_custom_slide_settings(raw: Any) -> Dict[str, Any]:
    base = dict(CUSTOM_SLIDE_DEFAULT_SETTINGS)
    if not isinstance(raw, dict):
        return base
    enabled = raw.get("enabled")
    if enabled is not None:
        base["enabled"] = bool(enabled)
    try:
        base["order_index"] = max(0, int(raw.get("order_index", base["order_index"])))
    except Exception:
        pass
    try:
        duration = float(raw.get("duration", base["duration"]))
        base["duration"] = min(600.0, max(1.0, duration))
    except Exception:
        pass
    return base


def _custom_slide_to_api_item(slide_id: str) -> Optional[Dict[str, Any]]:
    entry = _get_custom_slide_index_entry(slide_id)
    if not entry:
        return None
    cfg = _load_custom_slide_config(slide_id)
    settings = _normalize_custom_slide_settings(entry.get("settings"))
    name = entry.get("name") or cfg.get("slide_name") or "Diapo personnalisée"
    event_date = entry.get("event_date") or cfg.get("event_date") or ""

    texts_raw = cfg.get("texts")
    texts: List[Dict[str, Any]] = []
    if isinstance(texts_raw, list):
        texts = [t for t in texts_raw if isinstance(t, dict)]

    meta = cfg.get("meta") if isinstance(cfg.get("meta"), dict) else None
    if not meta:
        meta = {"name": name, "event_date": event_date}
    else:
        meta = {"name": meta.get("name") or name, "event_date": meta.get("event_date") or event_date}

    background = cfg.get("background") if isinstance(cfg.get("background"), dict) else None

    return {
        "id": slide_id,
        "name": name,
        "enabled": bool(settings.get("enabled")),
        "order_index": settings.get("order_index", 0),
        "duration": settings.get("duration", 12.0),
        "background": background,
        "texts": texts,
        "meta": meta,
        "signature": cfg.get("signature"),
    }


@bp.app_context_processor
def _inject_custom_slides_nav() -> Dict[str, Any]:
    index = _load_custom_slides_index()
    slides: List[Dict[str, Any]] = []
    for entry in index.get("slides", []):
        if not isinstance(entry, dict):
            continue
        slide_id = entry.get("id")
        if not isinstance(slide_id, str) or not slide_id:
            continue
        name = entry.get("name") or slide_id
        slides.append({"id": slide_id, "name": name})
    return {"custom_slides_nav": slides}


@bp.route("/diaporama/diapos-personnalisees", endpoint="custom_slides")
def custom_slides_page() -> Any:
    index = _load_custom_slides_index()
    slides: List[Dict[str, Any]] = []
    for entry in index.get("slides", []):
        if not isinstance(entry, dict):
            continue
        slide_id = entry.get("id")
        if not isinstance(slide_id, str) or not slide_id:
            continue
        item = _custom_slide_to_api_item(slide_id)
        if item:
            slides.append(item)
    return render_template("custom_slides.html", slides=slides)


@bp.route("/diaporama/diapo-personnalisee/<slide_id>", endpoint="custom_slide")
def custom_slide_page(slide_id: str) -> Any:
    item = _custom_slide_to_api_item(slide_id)
    if not item:
        abort(404)
    return render_template("custom_slide.html", slide=item)


@bp.route("/api/custom-slides", methods=["GET"])
def api_custom_slides_list() -> Any:
    index = _load_custom_slides_index()
    items: List[Dict[str, Any]] = []
    for entry in index.get("slides", []):
        if not isinstance(entry, dict):
            continue
        slide_id = entry.get("id")
        if not isinstance(slide_id, str) or not slide_id:
            continue
        item = _custom_slide_to_api_item(slide_id)
        if item and item.get("enabled"):
            items.append(item)
    return jsonify({"items": items})


@bp.route("/api/custom-slides", methods=["POST"])
def api_custom_slides_create() -> Any:
    index = _load_custom_slides_index()
    slides_list = index.get("slides", [])
    if not isinstance(slides_list, list):
        slides_list = []

    new_id = uuid.uuid4().hex
    display_name = f"Custom {len(slides_list) + 1}"
    now_iso = _now_iso()
    slides_list.append(
        {
            "id": new_id,
            "name": display_name,
            "event_date": "",
            "created_at": now_iso,
            "updated_at": now_iso,
            "settings": dict(CUSTOM_SLIDE_DEFAULT_SETTINGS),
        }
    )
    index["slides"] = slides_list
    _save_custom_slides_index(index)
    _save_custom_slide_config(
        new_id,
        {
            "background": None,
            "texts": [],
            "meta": {"name": display_name, "event_date": ""},
            "signature": now_iso,
        },
    )
    return jsonify({"id": new_id})


@bp.route("/api/custom-slides/<slide_id>", methods=["DELETE"])
def api_custom_slides_delete(slide_id: str) -> Any:
    index = _load_custom_slides_index()
    slides_list = index.get("slides", [])
    if not isinstance(slides_list, list):
        slides_list = []
    next_list = []
    removed = False
    for entry in slides_list:
        if isinstance(entry, dict) and entry.get("id") == slide_id:
            removed = True
            continue
        next_list.append(entry)
    index["slides"] = next_list
    _save_custom_slides_index(index)
    slide_folder = _custom_slide_dir(slide_id)
    if slide_folder.exists():
        shutil.rmtree(slide_folder, ignore_errors=True)
    if not removed:
        abort(404)
    return jsonify({"deleted": slide_id})


@bp.route("/diaporama/messages-temporaires")
def temporary() -> Any:
    return render_template("temporary.html")


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
        app_logger.exception(
            "Failed to convert %s to PDF: %s\n%s",
            ppt_filename,
            exc,
            stderr_output,
        )
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
    mimetype = _guess_mimetype(filename) or "application/octet-stream"
    resp = send_from_directory(
        BIRTHDAY_SLIDE_ASSETS_DIR,
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


@bp.route("/time-change-slide-assets/<path:filename>")
def serve_time_change_slide_asset(filename: str) -> Any:
    target = TIME_CHANGE_SLIDE_ASSETS_DIR / filename
    if not target.exists():
        abort(404, description="Fichier introuvable.")
    return send_from_directory(
        TIME_CHANGE_SLIDE_ASSETS_DIR,
        filename,
        as_attachment=False,
    )


@bp.route("/service-worker.js")
def service_worker() -> Any:
    # Servez le service worker depuis la racine pour couvrir tout le scope.
    sw_path = FRONTEND_STATIC_DIR / "service-worker.js"
    if not sw_path.exists():
        abort(404)
    return send_from_directory(
        str(FRONTEND_STATIC_DIR),
        "service-worker.js",
        as_attachment=False,
        mimetype="application/javascript",
    )


@bp.post("/api/test/background")
def upload_test_background() -> Any:
    uploaded = request.files.get("file")
    if not uploaded or not getattr(uploaded, "filename"):
        abort(400, description="Aucun fichier reçu.")
    filename = os.path.basename(str(uploaded.filename))
    if not filename:
        abort(400, description="Nom de fichier invalide.")
    extension = Path(filename).suffix.lower()
    if extension not in TEST_BACKGROUND_EXTENSIONS:
        abort(400, description="Format non supporté.")
    target = TEST_BACKGROUND_DIR / filename
    uploaded.save(target)
    return jsonify({"status": "ok", "filename": filename})


@bp.post("/api/test/background/active")
def set_test_background_active() -> Any:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or "filename" not in payload:
        abort(400, description="Nom de fichier requis.")
    filename = os.path.basename(str(payload["filename"]))
    if not filename:
        abort(400, description="Nom de fichier invalide.")
    target = TEST_BACKGROUND_DIR / filename
    if not target.exists() or not target.is_file():
        abort(404, description="Fichier introuvable.")
    config = _read_test_config()
    config["background"] = filename
    _write_test_config(config)
    return jsonify({"status": "ok", "active": filename})


@bp.delete("/api/test/background/<path:filename>")
def delete_test_background(filename: str) -> Any:
    safe_name = os.path.basename(filename)
    if not safe_name:
        abort(404, description="Fichier introuvable.")
    target = TEST_BACKGROUND_DIR / safe_name
    if not target.exists() or not target.is_file():
        abort(404, description="Fichier introuvable.")
    try:
        target.unlink()
    except OSError:
        abort(500, description="Impossible de supprimer le fichier.")
    config = _read_test_config()
    if config.get("background") == safe_name:
        config.pop("background", None)
        _write_test_config(config)
    return jsonify({"status": "ok", "deleted": safe_name})


@bp.get("/api/test/texts")
def list_test_texts() -> Any:
    config = _read_test_config()
    meta = _read_test_meta(config)
    token_map = _build_test_token_map(meta)
    texts = _collect_text_entries(config)
    entries = []
    for name in sorted(
        texts.keys(),
        key=lambda n: int(n.replace("text", "")) if n.startswith("text") and n[4:].isdigit() else n,
    ):
        entry = texts[name]
        style_value = entry.get("style") or DEFAULT_TEST_TEXT_STYLE
        resolved_value = _resolve_test_tokens(entry.get("value") or "", token_map)
        entries.append(
            {
                "name": name,
                "value": entry.get("value") or "",
                "resolved_value": resolved_value,
                "position": entry.get("position") or dict(DEFAULT_TEST_TEXT_POSITION),
                "size": entry.get("size") or dict(DEFAULT_TEST_TEXT_SIZE),
                "color": entry.get("color") or DEFAULT_TEST_TEXT_COLOR,
                "background": entry.get("background") or dict(DEFAULT_TEST_TEXT_BACKGROUND),
                "style": dict(style_value),
            }
        )
    return jsonify(entries)


@bp.post("/api/test/texts")
def add_test_text() -> Any:
    config = _read_test_config()
    texts = _collect_text_entries(config)
    index = 1
    while True:
        candidate = f"text{index}"
        if candidate not in texts:
            break
        index += 1
    texts[candidate] = {
        "value": "[texte]",
        "position": dict(DEFAULT_TEST_TEXT_POSITION),
        "size": dict(DEFAULT_TEST_TEXT_SIZE),
        "color": DEFAULT_TEST_TEXT_COLOR,
        "background": dict(DEFAULT_TEST_TEXT_BACKGROUND),
        "style": dict(DEFAULT_TEST_TEXT_STYLE),
    }
    config["texts"] = texts
    _write_test_config(config)
    return jsonify({"status": "ok", "name": candidate})


@bp.put("/api/test/texts/<text_name>")
def update_test_text(text_name: str) -> Any:
    if not _text_name_is_valid(text_name):
        abort(400, description="Nom de texte invalide.")
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Payload invalide.")
    config = _read_test_config()
    texts = _collect_text_entries(config)
    entry = texts.get(text_name)
    if not entry:
        abort(404, description="Texte introuvable.")
    meta = _read_test_meta(config)
    token_map = _build_test_token_map(meta)
    if "value" in payload:
        value = str(payload["value"] or "")
        if not value.strip():
            texts.pop(text_name, None)
            if texts:
                config["texts"] = texts
            else:
                config.pop("texts", None)
            _write_test_config(config)
            return jsonify({"status": "ok", "name": text_name, "deleted": True})
        entry["value"] = value
    if "position" in payload:
        entry["position"] = _normalize_text_position(payload["position"])
    if "size" in payload:
        entry["size"] = _normalize_text_size(payload["size"])
    if "color" in payload:
        entry["color"] = _normalize_text_color(payload["color"])
    if "background" in payload:
        entry["background"] = _normalize_text_background(payload["background"])
    if "style" in payload:
        entry["style"] = _normalize_text_style(payload["style"])
    texts[text_name] = entry
    config["texts"] = texts
    _write_test_config(config)
    return jsonify(
        {
            "status": "ok",
            "name": text_name,
            "value": entry["value"],
            "resolved_value": _resolve_test_tokens(entry["value"], token_map),
            "position": entry["position"],
            "size": entry["size"],
            "color": entry.get("color", DEFAULT_TEST_TEXT_COLOR),
            "background": entry.get("background", dict(DEFAULT_TEST_TEXT_BACKGROUND)),
            "style": dict(entry.get("style") or DEFAULT_TEST_TEXT_STYLE),
        }
    )


@bp.get("/api/test/slide")
def get_test_slide() -> Any:
    settings = store.get_settings().get("test_slide") or dict(DEFAULT_TEST_SLIDE_SETTINGS)
    payload = _build_test_slide_payload()
    try:
        duration = float(settings.get("duration", DEFAULT_TEST_SLIDE_SETTINGS["duration"]))
    except (TypeError, ValueError):
        duration = DEFAULT_TEST_SLIDE_SETTINGS["duration"]
    response = {
        "enabled": bool(settings.get("enabled")),
        "order_index": int(settings.get("order_index") or 0),
        "duration": max(1.0, min(600.0, duration)),
        "background": payload["background"],
        "texts": payload["texts"],
        "has_background": payload["has_background"],
        "has_texts": payload["has_texts"],
        "meta": payload.get("meta", dict(DEFAULT_TEST_SLIDE_META)),
        "signature": payload["signature"],
    }
    return jsonify(response)


@bp.delete("/api/test/texts/<text_name>")
def delete_test_text(text_name: str) -> Any:
    if not _text_name_is_valid(text_name):
        abort(400, description="Nom de texte invalide.")
    config = _read_test_config()
    texts = _collect_text_entries(config)
    if text_name not in texts:
        abort(404, description="Texte introuvable.")
    texts.pop(text_name, None)
    if texts:
        config["texts"] = texts
    else:
        config.pop("texts", None)
    _write_test_config(config)
    return jsonify({"status": "ok", "deleted": text_name})


@bp.get("/api/test/meta")
def get_test_meta() -> Any:
    config = _read_test_config()
    meta = _read_test_meta(config)
    return jsonify(meta)


@bp.patch("/api/test/meta")
def update_test_meta() -> Any:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Payload invalide.")
    config = _read_test_config()
    current = _read_test_meta(config)
    merged = {**current, **payload}
    normalized = _normalize_test_meta(merged)
    _write_test_meta(config, normalized)
    _write_test_config(config)
    return jsonify(normalized)

@bp.get("/api/test/backgrounds")
def list_test_backgrounds() -> Any:
    entries = []
    config = _read_test_config()
    active_name = config.get("background")
    for child in sorted(TEST_BACKGROUND_DIR.iterdir()):
        if not child.is_file():
            continue
        name = child.name
        entries.append(
            {
                "name": name,
                "url": url_for("main.serve_test_background", filename=name, _external=False),
                "mimetype": _guess_mimetype(name) or "application/octet-stream",
                "is_active": name == active_name,
            }
        )
    return jsonify(entries)


@bp.route("/test/background/<path:filename>")
def serve_test_background(filename: str) -> Any:
    safe_name = os.path.basename(filename)
    if not safe_name:
        abort(404, description="Fichier introuvable.")
    target = TEST_BACKGROUND_DIR / safe_name
    if not target.exists() or not target.is_file():
        abort(404, description="Fichier introuvable.")
    return send_from_directory(
        TEST_BACKGROUND_DIR,
        safe_name,
        as_attachment=False,
        mimetype=_guess_mimetype(safe_name) or "application/octet-stream",
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

        time_change_slide = settings.get("time_change_slide") or {}
        tc_bg_path = time_change_slide.get("background_path")
        time_change_background_url = None
        if isinstance(tc_bg_path, str) and tc_bg_path:
            time_change_background_url = url_for(
                "main.serve_time_change_slide_asset", filename=tc_bg_path, _external=False
            )
        else:
            time_change_slide["background_path"] = None
        time_change_slide["background_url"] = time_change_background_url
        settings["time_change_slide"] = time_change_slide

        christmas_slide = settings.get("christmas_slide") or {}
        xmas_bg_path = christmas_slide.get("background_path")
        christmas_background_url = None
        if isinstance(xmas_bg_path, str) and xmas_bg_path:
            christmas_background_url = url_for(
                "main.serve_christmas_slide_asset", filename=xmas_bg_path, _external=False
            )
        else:
            christmas_slide["background_path"] = None
        christmas_slide["background_url"] = christmas_background_url
        settings["christmas_slide"] = christmas_slide

        # Include news slide settings
        news_config = _load_news_config()
        settings["news_slide"] = {
            "enabled": news_config.get("enabled", False),
            "order_index": news_config.get("order_index", 0),
            "duration": news_config.get("duration", 20),
        }

        # Include weather slide settings
        weather_config = _load_weather_config()
        settings["weather_slide"] = {
            "enabled": weather_config.get("enabled", False),
            "order_index": weather_config.get("order_index", 0),
            "duration": weather_config.get("duration", 15),
        }
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
    
    log_file = LOGS_DIR / "key-events.json"
    
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
        app_logger.error("Failed to write key event log: %s", exc)
    
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
        if active_only and not item.get("enabled", True):
            continue
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
        logs_dir = LOGS_DIR
        
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
        app_logger.exception("Error logging user-agent: %s", e)
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
        video_path = config.get("background_video_path")
        if video_path:
            config["background_video_url"] = url_for(
                "main.serve_birthday_slide_asset", filename=video_path, _external=False
            )
        else:
            config["background_video_url"] = None
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


@bp.route("/birthday-fonts/<path:filename>")
def serve_birthday_font(filename: str) -> Any:
    safe = secure_filename(filename)
    if not safe or safe != filename:
        abort(400, description="Nom de fichier invalide.")
    target = (BIRTHDAY_FONT_DIR / safe).resolve()
    base_dir = BIRTHDAY_FONT_DIR.resolve()
    try:
        target.relative_to(base_dir)
    except ValueError:
        abort(400, description="Chemin de fichier non autorisé.")
    if not target.exists() or not target.is_file():
        abort(404, description="Police introuvable.")
    mimetype = _guess_mimetype(target.name) or "font/otf"
    return send_from_directory(base_dir, target.name, mimetype=mimetype)


@bp.get("/api/birthday-slide/fonts")
def list_birthday_fonts() -> Any:
    """Liste les polices personnalisées disponibles pour la diapositive Anniversaire."""
    BIRTHDAY_FONT_DIR.mkdir(parents=True, exist_ok=True)
    allowed_ext = {".ttf", ".otf", ".woff", ".woff2"}
    items: List[Dict[str, Any]] = []
    for entry in sorted(BIRTHDAY_FONT_DIR.iterdir(), key=lambda p: p.name.lower()):
        if not entry.is_file():
            continue
        if entry.suffix.lower() not in allowed_ext:
            continue
        filename = entry.name
        url = url_for("main.serve_birthday_font", filename=filename, _external=False)
        family = Path(filename).stem.replace("_", " ").replace("-", " ")
        items.append(
            {
                "filename": filename,
                "url": url,
                "family": family,
            }
        )
    return jsonify({"items": items})


@bp.delete("/api/birthday-slide/background/<path:filename>")
def delete_birthday_slide_background(filename: str) -> Any:
    """Supprime un arrière-plan de la diapositive Anniversaire."""
    safe_name = secure_filename(filename)
    if not safe_name or safe_name != filename:
        abort(400, description="Nom de fichier invalide.")

    BIRTHDAY_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    target = (BIRTHDAY_SLIDE_ASSETS_DIR / safe_name).resolve()
    base_dir = BIRTHDAY_SLIDE_ASSETS_DIR.resolve()
    try:
        target.relative_to(base_dir)
    except ValueError:
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
        settings = {"birthday_slide": DEFAULT_SETTINGS["birthday_slide"]}

    birthday_slide = settings.get("birthday_slide") or {}
    updates: Dict[str, Any] = {}
    if isinstance(birthday_slide.get("background_path"), str) and birthday_slide["background_path"] == filename:
        updates = {"background_path": None, "background_mimetype": None}

    new_settings = settings
    if updates:
        try:
            new_settings = store.update_settings({"birthday_slide": updates})
        except ValueError as exc:
            abort(400, description=str(exc))

    cleared_variants: List[str] = []
    for variant in BIRTHDAY_VARIANTS:
        config_path = BIRTHDAY_SLIDE_CONFIG_DIR / f"{variant}.json"
        if not config_path.exists():
            continue
        try:
            with config_path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
        except Exception:
            continue
        if not isinstance(data, dict):
            continue
        if data.get("background_path") != filename:
            continue
        data["background_path"] = None
        data["background_mimetype"] = None
        try:
            with config_path.open("w", encoding="utf-8") as handle:
                json.dump(data, handle, ensure_ascii=False, indent=2)
            cleared_variants.append(variant)
        except Exception:
            continue

    current = (new_settings.get("birthday_slide") or {}).get("background_path")
    current_payload = {"type": "upload", "filename": current} if current else {}
    return jsonify(
        {
            "removed": filename,
            "current": current_payload,
            "settings": new_settings,
            "cleared_variants": cleared_variants,
        }
    )


@bp.get("/api/time-change-slide/next")
def api_time_change_next() -> Any:
    info = _next_time_change_info()
    days_before_arg = request.args.get("days_before")
    within_window: Optional[bool] = None
    if days_before_arg is not None:
        try:
            limit_days = int(days_before_arg)
            within_window = info is not None and info.get("days_until") is not None and info["days_until"] <= limit_days
        except (TypeError, ValueError):
            within_window = None
    return jsonify({"change": info, "within_window": within_window})


@bp.get("/api/time-change-slide/upcoming")
def api_time_change_upcoming() -> Any:
    """Retourne les 4 prochains changements d'heure (les 2 de cette année + les 2 de l'an prochain si besoin)."""
    now = _now().astimezone(QUEBEC_TZ)
    upcoming: List[Dict[str, Any]] = []

    for year_offset in range(3):
        year = now.year + year_offset
        schedule = _get_time_change_schedule(year)
        if not schedule:
            continue
        for kind in ("start", "end"):
            dt = schedule.get(kind)
            if not isinstance(dt, datetime):
                continue
            local_dt = dt.astimezone(QUEBEC_TZ)
            if local_dt <= now:
                continue
            before_offset = QUEBEC_TZ.utcoffset(local_dt - timedelta(hours=2)) or timedelta()
            after_offset = QUEBEC_TZ.utcoffset(local_dt + timedelta(hours=2)) or before_offset
            direction = "forward" if after_offset > before_offset else "backward"
            direction_label = "avancer" if direction == "forward" else "reculer"
            season = "summer" if direction == "forward" else "winter"
            season_label = "d'été" if direction == "forward" else "d'hiver"
            date_label = f"{local_dt.day} {TIME_CHANGE_MONTHS_FR[local_dt.month - 1]} {local_dt.year}"
            weekday_label = TIME_CHANGE_WEEKDAYS_FR[local_dt.weekday()]
            offset_hours = abs(after_offset - before_offset).total_seconds() / 3600.0
            days_until = (local_dt.date() - now.date()).days
            upcoming.append({
                "change_at": local_dt.isoformat(),
                "change_at_local": local_dt.isoformat(),
                "kind": "dst_start" if kind == "start" else "dst_end",
                "direction": direction,
                "direction_label": direction_label,
                "season": season,
                "season_label": season_label,
                "weekday_label": weekday_label,
                "date_label": date_label,
                "time_label": local_dt.strftime("%H:%M"),
                "offset_from": _format_offset(before_offset),
                "offset_to": _format_offset(after_offset),
                "offset_hours": round(offset_hours, 2),
                "days_until": days_until,
                "source": schedule.get("source") or "unknown",
            })
        if len(upcoming) >= 4:
            break

    upcoming.sort(key=lambda entry: entry["change_at"])
    return jsonify({"upcoming": upcoming[:4]})


@bp.post("/api/time-change-slide/background")
def upload_time_change_slide_background() -> Any:
    """Téléverse un fond image/vidéo pour la diapositive Changement d'heure."""
    uploaded = request.files.get("file") or request.files.get("background")
    if not uploaded or not uploaded.filename:
        abort(400, description="Aucun fichier reçu.")

    original_name = uploaded.filename
    safe_name = secure_filename(original_name) or "time-change-background"
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

    TIME_CHANGE_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    media_id = uuid.uuid4().hex
    storage_name = f"{media_id}{ext_lower}" if ext_lower else media_id
    target = TIME_CHANGE_SLIDE_ASSETS_DIR / storage_name
    uploaded.save(target)

    updates: Dict[str, Any] = {
        "background_path": storage_name,
        "background_mimetype": mimetype or None,
    }

    try:
        settings = store.update_settings({"time_change_slide": updates})
    except ValueError as exc:
        abort(400, description=str(exc))

    time_change_slide = settings.get("time_change_slide") or {}
    bg_path = time_change_slide.get("background_path")
    background_url = None
    if isinstance(bg_path, str) and bg_path:
        background_url = url_for("main.serve_time_change_slide_asset", filename=bg_path, _external=False)

    return jsonify(
        {
            "background_url": background_url,
            "background_mimetype": time_change_slide.get("background_mimetype"),
            "settings": settings,
        }
    )


@bp.get("/api/time-change-slide/backgrounds")
def list_time_change_slide_backgrounds() -> Any:
    """Liste les fonds téléversés pour la diapositive Changement d'heure."""
    TIME_CHANGE_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    items: List[Dict[str, Any]] = []
    for entry in sorted(TIME_CHANGE_SLIDE_ASSETS_DIR.iterdir()):
        if not entry.is_file():
            continue
        filename = entry.name
        mimetype = _guess_mimetype(filename) or "application/octet-stream"
        url = url_for("main.serve_time_change_slide_asset", filename=filename, _external=False)
        items.append(
            {
                "filename": filename,
                "url": url,
                "mimetype": mimetype,
            }
        )

    settings = store.get_settings()
    time_change_slide = settings.get("time_change_slide") or {}
    current = time_change_slide.get("background_path")
    return jsonify({"items": items, "current": current})


@bp.delete("/api/time-change-slide/background/<path:filename>")
def delete_time_change_slide_background(filename: str) -> Any:
    """Supprime un arrière-plan de la diapositive Changement d'heure."""
    safe_name = secure_filename(filename)
    if not safe_name or safe_name != filename:
        abort(400, description="Nom de fichier invalide.")

    TIME_CHANGE_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    target = (TIME_CHANGE_SLIDE_ASSETS_DIR / safe_name).resolve()
    base_dir = TIME_CHANGE_SLIDE_ASSETS_DIR.resolve()
    try:
        target.relative_to(base_dir)
    except ValueError:
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
        settings = {"time_change_slide": DEFAULT_SETTINGS["time_change_slide"]}

    time_change_slide = settings.get("time_change_slide") or {}
    updates: Dict[str, Any] = {}
    if isinstance(time_change_slide.get("background_path"), str) and time_change_slide["background_path"] == filename:
        updates = {"background_path": None, "background_mimetype": None}

    new_settings = settings
    if updates:
        try:
            new_settings = store.update_settings({"time_change_slide": updates})
        except ValueError as exc:
            abort(400, description=str(exc))

    current = (new_settings.get("time_change_slide") or {}).get("background_path")
    return jsonify({"removed": filename, "current": current, "settings": new_settings})


# ───────────────────────────────────────────────────────────────────────────────
# Christmas slide API endpoints
# ───────────────────────────────────────────────────────────────────────────────

@bp.get("/api/christmas-slide/next")
def api_christmas_next() -> Any:
    info = _next_christmas_info()
    days_before_arg = request.args.get("days_before")
    within_window: Optional[bool] = None
    if days_before_arg is not None:
        try:
            limit_days = int(days_before_arg)
            within_window = info is not None and info.get("days_until") is not None and info["days_until"] <= limit_days
        except (TypeError, ValueError):
            within_window = None
    return jsonify({"christmas": info, "within_window": within_window})


@bp.post("/api/christmas-slide/background")
def upload_christmas_slide_background() -> Any:
    """Téléverse un fond image/vidéo pour la diapositive Noël."""
    uploaded = request.files.get("file") or request.files.get("background")
    if not uploaded or not uploaded.filename:
        abort(400, description="Aucun fichier reçu.")

    original_name = uploaded.filename
    safe_name = secure_filename(original_name) or "christmas-background"
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

    CHRISTMAS_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    media_id = uuid.uuid4().hex
    storage_name = f"{media_id}{ext_lower}" if ext_lower else media_id
    target = CHRISTMAS_SLIDE_ASSETS_DIR / storage_name
    uploaded.save(target)

    updates: Dict[str, Any] = {
        "background_path": storage_name,
        "background_mimetype": mimetype or None,
    }

    try:
        settings = store.update_settings({"christmas_slide": updates})
    except ValueError as exc:
        abort(400, description=str(exc))

    christmas_slide = settings.get("christmas_slide") or {}
    bg_path = christmas_slide.get("background_path")
    background_url = None
    if isinstance(bg_path, str) and bg_path:
        background_url = url_for("main.serve_christmas_slide_asset", filename=bg_path, _external=False)

    return jsonify(
        {
            "background_url": background_url,
            "background_mimetype": christmas_slide.get("background_mimetype"),
            "settings": settings,
        }
    )


@bp.get("/api/christmas-slide/backgrounds")
def list_christmas_slide_backgrounds() -> Any:
    """Liste les fonds téléversés pour la diapositive Noël."""
    CHRISTMAS_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    items: List[Dict[str, Any]] = []
    for entry in sorted(CHRISTMAS_SLIDE_ASSETS_DIR.iterdir()):
        if not entry.is_file():
            continue
        filename = entry.name
        mimetype = _guess_mimetype(filename) or "application/octet-stream"
        url = url_for("main.serve_christmas_slide_asset", filename=filename, _external=False)
        items.append(
            {
                "filename": filename,
                "url": url,
                "mimetype": mimetype,
            }
        )

    settings = store.get_settings()
    christmas_slide = settings.get("christmas_slide") or {}
    current = christmas_slide.get("background_path")
    return jsonify({"items": items, "current": current})


@bp.delete("/api/christmas-slide/background/<path:filename>")
def delete_christmas_slide_background(filename: str) -> Any:
    """Supprime un arrière-plan de la diapositive Noël."""
    safe_name = secure_filename(filename)
    if not safe_name or safe_name != filename:
        abort(400, description="Nom de fichier invalide.")

    CHRISTMAS_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    target = (CHRISTMAS_SLIDE_ASSETS_DIR / safe_name).resolve()
    base_dir = CHRISTMAS_SLIDE_ASSETS_DIR.resolve()
    try:
        target.relative_to(base_dir)
    except ValueError:
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
        settings = {"christmas_slide": DEFAULT_SETTINGS["christmas_slide"]}

    christmas_slide = settings.get("christmas_slide") or {}
    updates: Dict[str, Any] = {}
    if isinstance(christmas_slide.get("background_path"), str) and christmas_slide["background_path"] == filename:
        updates = {"background_path": None, "background_mimetype": None}

    new_settings = settings
    if updates:
        try:
            new_settings = store.update_settings({"christmas_slide": updates})
        except ValueError as exc:
            abort(400, description=str(exc))

    current = (new_settings.get("christmas_slide") or {}).get("background_path")
    return jsonify({"removed": filename, "current": current, "settings": new_settings})


@bp.get("/christmas-slide/asset/<path:filename>")
def serve_christmas_slide_asset(filename: str) -> Any:
    """Sert un fichier d'arrière-plan pour la diapositive Noël."""
    CHRISTMAS_SLIDE_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    target = (CHRISTMAS_SLIDE_ASSETS_DIR / filename).resolve()
    base_dir = CHRISTMAS_SLIDE_ASSETS_DIR.resolve()
    try:
        target.relative_to(base_dir)
    except ValueError:
        abort(403, description="Chemin de fichier non autorisé.")
    if not target.exists() or not target.is_file():
        abort(404, description="Fichier introuvable.")
    return send_from_directory(CHRISTMAS_SLIDE_ASSETS_DIR, filename)


# ───────────────────────────────────────────────────────────────────────────────
# News (RSS) slide API endpoints
# ───────────────────────────────────────────────────────────────────────────────

NEWS_CACHE: Dict[str, Any] = {"items": [], "fetched_at": None}
NEWS_CACHE_LOCK = RLock()
NEWS_CACHE_TTL = timedelta(minutes=1)
NEWS_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif"}
NEWS_FEED_SCHEMES = ("http", "https")

DEFAULT_WEATHER_SECRETS = {
    "api_key": "",
}


def _read_secrets_file(path: Path, defaults: Dict[str, Any]) -> Dict[str, Any]:
    secrets = copy.deepcopy(defaults)
    if not path.exists():
        return secrets
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(raw, dict):
            for key in secrets:
                if key in raw:
                    secrets[key] = raw[key]
        return secrets
    except (OSError, json.JSONDecodeError):
        return secrets


def _load_weather_secrets() -> Dict[str, Any]:
    secrets = _read_secrets_file(WEATHER_SECRETS_FILE, DEFAULT_WEATHER_SECRETS)
    if WEATHER_SECRETS_FILE.exists():
        return secrets
    legacy = _read_secrets_file(LEGACY_SECRETS_FILE, DEFAULT_WEATHER_SECRETS)
    if legacy.get("api_key"):
        _save_weather_secrets(legacy)
        return legacy
    return secrets


def _save_weather_secrets(secrets: Dict[str, Any]) -> Dict[str, Any]:
    WEATHER_SECRETS_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = {**DEFAULT_WEATHER_SECRETS, **(secrets or {})}
    WEATHER_SECRETS_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def _migrate_config_file(old_path: Path, new_path: Path) -> None:
    if new_path.exists() or not old_path.exists():
        return
    try:
        raw = old_path.read_text(encoding="utf-8")
        new_path.parent.mkdir(parents=True, exist_ok=True)
        new_path.write_text(raw, encoding="utf-8")
    except OSError:
        pass


def _write_json_atomic(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    tmp_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_path.replace(path)


def _normalize_rss_image_url(url: str) -> str:
    if not url:
        return url
    cleaned = html.unescape(url.strip())
    try:
        parsed = urllib.parse.urlparse(cleaned)
    except ValueError:
        return cleaned
    if not parsed.query:
        return cleaned
    if os.path.splitext(parsed.path.lower())[1] not in NEWS_IMAGE_EXTS:
        return cleaned
    query_lower = parsed.query.lower()
    if not any(marker in query_lower for marker in ("impolicy", "crop", "resize")):
        return cleaned
    if any(marker in query_lower for marker in ("token", "signature", "sig", "expires", "exp", "apikey", "access_token", "x-amz-")):
        return cleaned
    return urllib.parse.urlunparse(parsed._replace(query="", fragment=""))


def _normalize_feed_url(url: str) -> str:
    if not url:
        return url
    cleaned = url.strip()
    if not cleaned:
        return cleaned
    try:
        parsed = urllib.parse.urlparse(cleaned)
    except ValueError:
        return cleaned
    if parsed.scheme:
        return cleaned
    if cleaned.startswith("//"):
        return f"https:{cleaned}"
    return f"https://{cleaned}"


def _parse_rss_feed(url: str, max_items: int = 10) -> List[Dict[str, Any]]:
    """Parse un flux RSS et retourne les items."""
    items: List[Dict[str, Any]] = []
    url = _normalize_feed_url(url)
    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            content = response.read().decode("utf-8", errors="ignore")
    except OSError:
        return items

    # Parse simple XML pour RSS
    item_pattern = re.compile(r"<item>(.*?)</item>", re.DOTALL | re.IGNORECASE)
    entry_pattern = re.compile(r"<entry>(.*?)</entry>", re.DOTALL | re.IGNORECASE)
    title_pattern = re.compile(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", re.DOTALL | re.IGNORECASE)
    link_pattern = re.compile(r"<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</link>", re.DOTALL | re.IGNORECASE)
    link_href_pattern = re.compile(r'<link[^>]+href=["\']([^"\']+)["\']', re.IGNORECASE)
    desc_pattern = re.compile(r"<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</description>", re.DOTALL | re.IGNORECASE)
    summary_pattern = re.compile(r"<summary>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</summary>", re.DOTALL | re.IGNORECASE)
    content_pattern = re.compile(r"<content[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</content>", re.DOTALL | re.IGNORECASE)
    pubdate_pattern = re.compile(r"<pubDate>(.*?)</pubDate>", re.DOTALL | re.IGNORECASE)
    updated_pattern = re.compile(r"<updated>(.*?)</updated>", re.DOTALL | re.IGNORECASE)
    media_pattern = re.compile(r'<(?:media:content|enclosure)[^>]+url=["\']([^"\']+)["\']', re.IGNORECASE)
    image_pattern = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.IGNORECASE)

    matches = list(item_pattern.finditer(content))
    is_atom = False
    if not matches:
        matches = list(entry_pattern.finditer(content))
        is_atom = True

    for match in matches:
        if len(items) >= max_items:
            break
        item_content = match.group(1)

        title_match = title_pattern.search(item_content)
        title = _strip_html(title_match.group(1)) if title_match else ""

        link = ""
        link_href_match = link_href_pattern.search(item_content)
        if link_href_match:
            link = link_href_match.group(1).strip()
        if not link:
            link_match = link_pattern.search(item_content)
            link = link_match.group(1).strip() if link_match else ""

        desc_match = desc_pattern.search(item_content)
        description = _strip_html(desc_match.group(1)) if desc_match else ""
        if not description and is_atom:
            summary_match = summary_pattern.search(item_content)
            if summary_match:
                description = _strip_html(summary_match.group(1))
        if not description and is_atom:
            content_match = content_pattern.search(item_content)
            if content_match:
                description = _strip_html(content_match.group(1))

        pubdate_match = pubdate_pattern.search(item_content)
        pubdate = pubdate_match.group(1).strip() if pubdate_match else ""
        if not pubdate and is_atom:
            updated_match = updated_pattern.search(item_content)
            pubdate = updated_match.group(1).strip() if updated_match else ""

        # Chercher une image
        image_url = ""
        media_match = media_pattern.search(item_content)
        if media_match:
            image_url = media_match.group(1)
        if not image_url:
            img_match = image_pattern.search(item_content)
            if img_match:
                image_url = img_match.group(1)
        if not image_url and desc_match:
            img_in_desc = image_pattern.search(desc_match.group(1))
            if img_in_desc:
                image_url = img_in_desc.group(1)
        if image_url:
            image_url = _normalize_rss_image_url(image_url)

        # Parser la date
        parsed_time = ""
        parsed_ts = 0.0
        if pubdate:
            try:
                from email.utils import parsedate_to_datetime
                dt = parsedate_to_datetime(pubdate)
                parsed_ts = dt.timestamp()
                parsed_time = dt.astimezone(QUEBEC_TZ).strftime("%H:%M")
            except Exception:
                parsed_time = pubdate[:16] if len(pubdate) > 16 else pubdate

        items.append({
            "title": title,
            "link": link,
            "description": description[:200] if description else "",
            "image": image_url,
            "time": parsed_time,
            "pubdate": pubdate,
            "pubdate_ts": parsed_ts,
        })

    return items


def _load_news_config() -> Dict[str, Any]:
    """Charge la configuration de la diapositive Nouvelles."""
    _migrate_config_file(LEGACY_NEWS_CONFIG_FILE, NEWS_CONFIG_FILE)
    default = copy.deepcopy(DEFAULT_SETTINGS["news_slide"])
    raw = None
    if NEWS_CONFIG_FILE.exists():
        try:
            raw = json.loads(NEWS_CONFIG_FILE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            raw = None
    if raw is None and LEGACY_NEWS_CONFIG_FILE.exists():
        try:
            raw = json.loads(LEGACY_NEWS_CONFIG_FILE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            raw = None
    if isinstance(raw, dict):
        for key in default:
            if key in raw:
                default[key] = raw[key]
        feeds = default.get("rss_feeds", [])
        changed = False
        if isinstance(feeds, list):
            for feed in feeds:
                if not isinstance(feed, dict):
                    continue
                url = feed.get("url", "")
                normalized = _normalize_feed_url(url)
                if normalized and normalized != url:
                    feed["url"] = normalized
                    changed = True
        if changed or not NEWS_CONFIG_FILE.exists():
            _write_json_atomic(NEWS_CONFIG_FILE, default)
    return default


def _save_news_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Sauvegarde la configuration de la diapositive Nouvelles."""
    _write_json_atomic(NEWS_CONFIG_FILE, config)
    return config


def _fetch_news_items(force: bool = False) -> List[Dict[str, Any]]:
    """Récupère les nouvelles depuis les flux RSS configurés."""
    now = _now()
    with NEWS_CACHE_LOCK:
        cached_at = NEWS_CACHE.get("fetched_at")
        if not force and cached_at and (now - cached_at) < NEWS_CACHE_TTL:
            return copy.deepcopy(NEWS_CACHE.get("items", []))

    config = _load_news_config()
    feeds = config.get("rss_feeds", [])
    max_items = config.get("max_items", 10)
    all_items: List[Dict[str, Any]] = []

    for feed in feeds:
        if not feed.get("enabled", True):
            continue
        url = feed.get("url", "")
        if not url:
            continue
        items = _parse_rss_feed(url, max_items)
        for item in items:
            item["source"] = feed.get("name", "RSS")
        all_items.extend(items)

    # Trier par date de publication (plus récent en premier)
    all_items.sort(key=lambda x: (x.get("pubdate_ts", 0), x.get("pubdate", "")), reverse=True)
    all_items = all_items[:max_items]

    with NEWS_CACHE_LOCK:
        NEWS_CACHE["items"] = all_items
        NEWS_CACHE["fetched_at"] = now
    return all_items


@bp.get("/api/news-slide")
def api_news_slide() -> Any:
    """Retourne la configuration et les items de la diapositive Nouvelles."""
    config = _load_news_config()
    items = _fetch_news_items()
    return jsonify({
        "config": config,
        "items": items,
    })


@bp.post("/api/news-slide")
def api_news_slide_update() -> Any:
    """Met à jour la configuration de la diapositive Nouvelles."""
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")

    config = _load_news_config()

    if "enabled" in payload:
        config["enabled"] = bool(payload["enabled"])
    if "order_index" in payload:
        try:
            config["order_index"] = max(0, int(payload["order_index"]))
        except (TypeError, ValueError):
            pass
    if "scroll_delay" in payload:
        try:
            config["scroll_delay"] = max(0.5, min(30.0, float(payload["scroll_delay"])))
        except (TypeError, ValueError):
            pass
    if "scroll_speed" in payload:
        try:
            config["scroll_speed"] = max(10, min(200, int(payload["scroll_speed"])))
        except (TypeError, ValueError):
            pass
    if "max_items" in payload:
        try:
            config["max_items"] = max(1, min(50, int(payload["max_items"])))
        except (TypeError, ValueError):
            pass
    if "rss_feeds" in payload and isinstance(payload["rss_feeds"], list):
        normalized_feeds = []
        for feed in payload["rss_feeds"]:
            if not isinstance(feed, dict):
                continue
            url = _normalize_feed_url(feed.get("url", ""))
            normalized_feeds.append({**feed, "url": url})
        config["rss_feeds"] = normalized_feeds
    if "card_style" in payload and isinstance(payload["card_style"], dict):
        config["card_style"] = {**config.get("card_style", {}), **payload["card_style"]}
    if "layout" in payload and isinstance(payload["layout"], dict):
        config["layout"] = {**config.get("layout", {}), **payload["layout"]}

    _save_news_config(config)

    # Also update main settings store for playlist integration
    try:
        store.update_settings({"news_slide": {"enabled": config["enabled"], "order_index": config["order_index"]}})
    except Exception:
        pass

    return jsonify({"config": config})


@bp.get("/api/news-slide/items")
def api_news_items() -> Any:
    """Récupère les nouvelles depuis les flux RSS avec les settings."""
    force = request.args.get("force", "").lower() in ("1", "true", "yes")
    items = _fetch_news_items(force=force)
    config = _load_news_config()
    return jsonify({
        "items": items,
        "settings": {
            "enabled": config.get("enabled", False),
            "order_index": config.get("order_index", 0),
            "duration": config.get("duration", 20),
            "scroll_delay": config.get("scroll_delay", 3),
            "scroll_speed": config.get("scroll_speed", 50),
            "max_items": config.get("max_items", 10),
            "card_background_color": config.get("card_style", {}).get("background_color", "#1a1a2e"),
            "card_background_opacity": config.get("card_style", {}).get("background_opacity", 0.9),
            "card_title_color": config.get("card_style", {}).get("title_color", "#f8fafc"),
            "card_time_color": config.get("card_style", {}).get("time_color", "#94a3b8"),
            "card_title_size": config.get("card_style", {}).get("title_size", 28),
            "card_time_size": config.get("card_style", {}).get("time_size", 18),
            "card_source_size": config.get("card_style", {}).get("source_size", 16),
            "card_description_size": config.get("card_style", {}).get("description_size", 16),
            "card_border_radius": config.get("card_style", {}).get("border_radius", 12),
            "card_padding": config.get("card_style", {}).get("padding", 20),
            "card_width_percent": config.get("layout", {}).get("card_width_percent", 90),
            "card_height_percent": config.get("layout", {}).get("card_height_percent", 25),
            "card_gap": config.get("layout", {}).get("card_gap", 20),
            "cards_per_row": config.get("layout", {}).get("cards_per_row", 1),
            "show_image": config.get("layout", {}).get("show_image", True),
            "show_time": config.get("layout", {}).get("show_time", True),
            "image_width": config.get("layout", {}).get("image_width", 0),
            "image_height": config.get("layout", {}).get("image_height", 0),
        },
    })


@bp.post("/api/news-slide/feeds")
def api_news_add_feed() -> Any:
    """Ajoute un nouveau flux RSS."""
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")

    url = payload.get("url", "").strip()
    name = payload.get("name", "Nouveau flux").strip()
    if not url:
        abort(400, description="L'URL du flux est requise.")
    url = _normalize_feed_url(url)

    config = _load_news_config()
    feeds = config.get("rss_feeds", [])
    new_feed = {
        "id": uuid.uuid4().hex[:8],
        "name": name,
        "url": url,
        "enabled": True,
    }
    feeds.append(new_feed)
    config["rss_feeds"] = feeds
    _save_news_config(config)

    return jsonify({"feed": new_feed, "config": config})


@bp.delete("/api/news-slide/feeds/<feed_id>")
def api_news_delete_feed(feed_id: str) -> Any:
    """Supprime un flux RSS."""
    config = _load_news_config()
    feeds = config.get("rss_feeds", [])
    config["rss_feeds"] = [f for f in feeds if f.get("id") != feed_id]
    _save_news_config(config)
    return jsonify({"removed": feed_id, "config": config})


# ───────────────────────────────────────────────────────────────────────────────
# Weather slide API endpoints
# ───────────────────────────────────────────────────────────────────────────────

WEATHER_CACHE: Dict[str, Any] = {"data": None, "fetched_at": None}
WEATHER_CACHE_TTL = timedelta(minutes=15)
WEATHER_CACHE_LOCK = RLock()

# Codes météo Open-Meteo vers conditions
WEATHER_CODE_MAP = {
    0: "sunny",
    1: "sunny",
    2: "cloudy",
    3: "cloudy",
    45: "foggy",
    48: "foggy",
    51: "rainy",
    53: "rainy",
    55: "rainy",
    56: "rainy",
    57: "rainy",
    61: "rainy",
    63: "rainy",
    65: "rainy",
    66: "rainy",
    67: "rainy",
    71: "snowy",
    73: "snowy",
    75: "snowy",
    77: "snowy",
    80: "rainy",
    81: "rainy",
    82: "rainy",
    85: "snowy",
    86: "snowy",
    95: "stormy",
    96: "stormy",
    99: "stormy",
}

WEATHER_CONDITION_LABELS = {
    "sunny": "Ensoleillé",
    "cloudy": "Nuageux",
    "rainy": "Pluvieux",
    "snowy": "Neigeux",
    "stormy": "Orageux",
    "foggy": "Brumeux",
    "windy": "Venteux",
    "default": "Variable",
}

WEATHER_CONDITION_ICONS = {
    "sunny": "☀️",
    "cloudy": "☁️",
    "rainy": "🌧️",
    "snowy": "❄️",
    "stormy": "⛈️",
    "foggy": "🌫️",
    "windy": "💨",
    "default": "🌤️",
}


def _get_current_season() -> str:
    """Retourne la saison actuelle."""
    now = _now()
    month = now.month
    if month in (3, 4, 5):
        return "spring"
    elif month in (6, 7, 8):
        return "summer"
    elif month in (9, 10, 11):
        return "autumn"
    else:
        return "winter"


def _load_weather_config() -> Dict[str, Any]:
    """Charge la configuration de la diapositive Météo."""
    _migrate_config_file(LEGACY_WEATHER_CONFIG_FILE, WEATHER_CONFIG_FILE)
    default = copy.deepcopy(DEFAULT_SETTINGS["weather_slide"])
    secrets = _load_weather_secrets()
    default["api_key"] = secrets.get("api_key", "")
    if not WEATHER_CONFIG_FILE.exists():
        return default
    try:
        raw = json.loads(WEATHER_CONFIG_FILE.read_text(encoding="utf-8"))
        if isinstance(raw, dict):
            if not default["api_key"] and raw.get("api_key"):
                secrets["api_key"] = raw.get("api_key") or ""
                _save_weather_secrets(secrets)
            for key in default:
                if key in raw:
                    if isinstance(default[key], dict) and isinstance(raw[key], dict):
                        default[key] = {**default[key], **raw[key]}
                    else:
                        default[key] = raw[key]
        return default
    except (OSError, json.JSONDecodeError):
        return default


def _save_weather_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Sauvegarde la configuration de la diapositive Météo."""
    secrets = _load_weather_secrets()
    api_key = config.get("api_key", "")
    if api_key is not None:
        secrets["api_key"] = api_key
        _save_weather_secrets(secrets)
    WEATHER_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    config_to_save = {**config}
    config_to_save.pop("api_key", None)
    WEATHER_CONFIG_FILE.write_text(json.dumps(config_to_save, ensure_ascii=False, indent=2), encoding="utf-8")
    return config


def _fetch_weather_data(force: bool = False) -> Optional[Dict[str, Any]]:
    """Récupère les données météo depuis Open-Meteo."""
    now = _now()
    with WEATHER_CACHE_LOCK:
        cached_at = WEATHER_CACHE.get("fetched_at")
        if not force and cached_at and (now - cached_at) < WEATHER_CACHE_TTL:
            return copy.deepcopy(WEATHER_CACHE.get("data"))

    config = _load_weather_config()
    location = config.get("location", {})
    lat = location.get("latitude", 46.8139)
    lon = location.get("longitude", -71.2080)
    location_name = location.get("name", "Québec")

    # Open-Meteo API (gratuit, pas de clé requise)
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m"
        f"&hourly=temperature_2m,apparent_temperature,wind_speed_10m"
        f"&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum"
        f"&timezone=America/Toronto"
        f"&forecast_days=8"
    )

    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            raw_data = json.loads(response.read().decode("utf-8"))
    except (OSError, json.JSONDecodeError):
        with WEATHER_CACHE_LOCK:
            cached_weather = WEATHER_CACHE.get("data")
        return copy.deepcopy(cached_weather) if cached_weather is not None else None

    current = raw_data.get("current", {})
    daily = raw_data.get("daily", {})
    hourly = raw_data.get("hourly", {})

    weather_code = current.get("weather_code", 0)
    condition = WEATHER_CODE_MAP.get(weather_code, "default")

    # Vérifier si venteux (vent > 30 km/h)
    wind_speed = current.get("wind_speed_10m", 0)
    if wind_speed > 30 and condition in ("sunny", "cloudy"):
        condition = "windy"

    daily_maxs = daily.get("temperature_2m_max", [])
    daily_mins = daily.get("temperature_2m_min", [])
    today_max = daily_maxs[0] if daily_maxs else None
    today_min = daily_mins[0] if daily_mins else None

    weather_data = {
        "location": location_name,
        "current": {
            "temperature": current.get("temperature_2m"),
            "feels_like": current.get("apparent_temperature"),
            "humidity": current.get("relative_humidity_2m"),
            "precipitation": current.get("precipitation"),
            "wind_speed": wind_speed,
            "wind_direction": current.get("wind_direction_10m"),
            "weather_code": weather_code,
            "condition": condition,
            "condition_label": WEATHER_CONDITION_LABELS.get(condition, "Variable"),
            "icon": WEATHER_CONDITION_ICONS.get(condition, "🌤️"),
            "temp_max": today_max,
            "temp_min": today_min,
        },
        "temperature": current.get("temperature_2m"),
        "feels_like": current.get("apparent_temperature"),
        "humidity": current.get("relative_humidity_2m"),
        "precipitation": current.get("precipitation"),
        "wind_speed": wind_speed,
        "wind_direction": current.get("wind_direction_10m"),
        "weather_code": weather_code,
        "condition": condition,
        "condition_label": WEATHER_CONDITION_LABELS.get(condition, "Variable"),
        "icon": WEATHER_CONDITION_ICONS.get(condition, "🌤️"),
        "temp_max": today_max,
        "temp_min": today_min,
        "forecast": [],
        "season": _get_current_season(),
        "fetched_at": now.isoformat(),
    }

    hourly_times = hourly.get("time", [])
    hourly_temps = hourly.get("temperature_2m", [])
    hourly_feels = hourly.get("apparent_temperature", [])
    hourly_winds = hourly.get("wind_speed_10m", [])
    hourly_buckets: Dict[str, Dict[str, List[float]]] = {}
    wind_peaks: Dict[str, Tuple[float, int]] = {}

    for i, timestamp in enumerate(hourly_times):
        if i >= len(hourly_temps):
            continue
        temp = hourly_temps[i]
        feels = hourly_feels[i] if i < len(hourly_feels) else None
        wind = hourly_winds[i] if i < len(hourly_winds) else None
        if temp is None:
            continue
        if isinstance(timestamp, str) and "T" in timestamp:
            date_part, time_part = timestamp.split("T", 1)
            hour_str = time_part.split(":", 1)[0]
            try:
                hour = int(hour_str)
            except ValueError:
                continue
        else:
            continue

        if hour < 6:
            bucket = "night"
        elif hour < 18:
            bucket = "day"
        else:
            bucket = "evening"

        day_bucket = hourly_buckets.setdefault(date_part, {
            "day": [],
            "evening": [],
            "night": [],
            "day_feels": [],
            "evening_feels": [],
            "night_feels": [],
            "winds": [],
        })
        day_bucket[bucket].append(temp)
        if feels is not None:
            day_bucket[f"{bucket}_feels"].append(feels)
        if wind is not None:
            day_bucket["winds"].append(wind)
            peak = wind_peaks.get(date_part)
            if peak is None or wind > peak[0] or (wind == peak[0] and hour > peak[1]):
                wind_peaks[date_part] = (wind, hour)

    # Parser les prévisions
    dates = daily.get("time", [])
    codes = daily.get("weather_code", [])
    maxs = daily_maxs
    mins = daily_mins
    apparent_maxs = daily.get("apparent_temperature_max", [])
    apparent_mins = daily.get("apparent_temperature_min", [])
    precips = daily.get("precipitation_sum", [])

    for i in range(len(dates)):
        day_code = codes[i] if i < len(codes) else 0
        day_condition = WEATHER_CODE_MAP.get(day_code, "default")
        temp_avg = None
        feels_like = None
        if i < len(maxs) and i < len(mins):
            if maxs[i] is not None and mins[i] is not None:
                temp_avg = (maxs[i] + mins[i]) / 2
        if i < len(apparent_maxs) and i < len(apparent_mins):
            if apparent_maxs[i] is not None and apparent_mins[i] is not None:
                feels_like = (apparent_maxs[i] + apparent_mins[i]) / 2
        bucket = hourly_buckets.get(dates[i], {})
        day_temps = bucket.get("day", [])
        evening_temps = bucket.get("evening", [])
        night_temps = bucket.get("night", [])
        day_feels = bucket.get("day_feels", [])
        evening_feels = bucket.get("evening_feels", [])
        night_feels = bucket.get("night_feels", [])
        wind_values = bucket.get("winds", [])

        temp_day = sum(day_temps) / len(day_temps) if day_temps else None
        temp_evening = sum(evening_temps) / len(evening_temps) if evening_temps else None
        temp_night = sum(night_temps) / len(night_temps) if night_temps else None
        feels_day = sum(day_feels) / len(day_feels) if day_feels else None
        feels_evening = sum(evening_feels) / len(evening_feels) if evening_feels else None
        feels_night = sum(night_feels) / len(night_feels) if night_feels else None
        wind_max = max(wind_values) if wind_values else None
        wind_peak = None
        peak_info = wind_peaks.get(dates[i])
        if peak_info is not None:
            peak_hour = peak_info[1]
            if peak_hour < 6:
                wind_peak = "nuit"
            elif peak_hour < 18:
                wind_peak = "jour"
            else:
                wind_peak = "soir"

        day_data = {
            "date": dates[i],
            "weekday": "",
            "temp_max": maxs[i] if i < len(maxs) else None,
            "temp_min": mins[i] if i < len(mins) else None,
            "temp_avg": temp_avg,
            "feels_like": feels_like,
            "temp_day": temp_day,
            "temp_evening": temp_evening,
            "temp_night": temp_night,
            "feels_day": feels_day,
            "feels_evening": feels_evening,
            "feels_night": feels_night,
            "wind_max": wind_max,
            "wind_peak": wind_peak,
            "precipitation": precips[i] if i < len(precips) else 0,
            "condition": day_condition,
            "icon": WEATHER_CONDITION_ICONS.get(day_condition, "🌤️"),
        }
        # Ajouter le jour de la semaine
        try:
            dt = datetime.strptime(dates[i], "%Y-%m-%d")
            day_data["weekday"] = TIME_CHANGE_WEEKDAYS_FR[dt.weekday()].capitalize()
        except Exception:
            pass
        weather_data["forecast"].append(day_data)

    with WEATHER_CACHE_LOCK:
        WEATHER_CACHE["data"] = weather_data
        WEATHER_CACHE["fetched_at"] = now
    return weather_data


@bp.get("/api/weather-slide")
def api_weather_slide() -> Any:
    """Retourne la configuration et les données de la diapositive Météo."""
    config = _load_weather_config()
    weather = _fetch_weather_data()
    return jsonify({
        "config": config,
        "weather": weather,
    })


@bp.post("/api/weather-slide")
def api_weather_slide_update() -> Any:
    """Met à jour la configuration de la diapositive Météo."""
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        abort(400, description="Requête invalide.")

    config = _load_weather_config()

    if "enabled" in payload:
        config["enabled"] = bool(payload["enabled"])
    if "order_index" in payload:
        try:
            config["order_index"] = max(0, int(payload["order_index"]))
        except (TypeError, ValueError):
            pass
    if "duration" in payload:
        try:
            config["duration"] = max(5.0, min(120.0, float(payload["duration"])))
        except (TypeError, ValueError):
            pass
    if "location" in payload and isinstance(payload["location"], dict):
        loc = payload["location"]
        config["location"] = {
            "name": str(loc.get("name", config["location"]["name"])),
            "latitude": float(loc.get("latitude", config["location"]["latitude"])),
            "longitude": float(loc.get("longitude", config["location"]["longitude"])),
        }
    if "display" in payload and isinstance(payload["display"], dict):
        config["display"] = {**config.get("display", {}), **payload["display"]}
    if "widgets" in payload and isinstance(payload["widgets"], list):
        config["widgets"] = payload["widgets"]
    if "use_seasonal_backgrounds" in payload:
        config["use_seasonal_backgrounds"] = bool(payload["use_seasonal_backgrounds"])

    _save_weather_config(config)
    with WEATHER_CACHE_LOCK:
        WEATHER_CACHE["fetched_at"] = None
        WEATHER_CACHE["data"] = None

    # Also update main settings store
    try:
        store.update_settings({"weather_slide": {"enabled": config["enabled"], "order_index": config["order_index"], "duration": config["duration"]}})
    except Exception:
        pass

    return jsonify({"config": config})


@bp.get("/api/weather-slide/data")
def api_weather_data() -> Any:
    """Récupère les données météo actuelles avec les settings."""
    force = request.args.get("force", "").lower() in ("1", "true", "yes")
    weather = _fetch_weather_data(force=force)
    config = _load_weather_config()
    
    # Build background URLs
    backgrounds = {}
    for condition, filename in config.get("backgrounds", {}).items():
        if filename:
            backgrounds[condition] = url_for("main.serve_weather_asset", filename=filename, _external=False)
    
    seasonal_backgrounds = {}
    for season, filename in config.get("seasonal_backgrounds", {}).items():
        if filename:
            seasonal_backgrounds[season] = url_for("main.serve_weather_asset", filename=filename, _external=False)
    
    return jsonify({
        "weather": weather,
        "settings": {
            "enabled": config.get("enabled", False),
            "order_index": config.get("order_index", 0),
            "duration": config.get("duration", 15),
            "location": config.get("location", {}).get("name", "Québec"),
            "latitude": config.get("location", {}).get("latitude", 46.8139),
            "longitude": config.get("location", {}).get("longitude", -71.2080),
            "show_current": config.get("display", {}).get("show_current", True),
            "show_feels_like": config.get("display", {}).get("show_feels_like", True),
            "show_humidity": config.get("display", {}).get("show_humidity", True),
            "show_wind": config.get("display", {}).get("show_wind", True),
            "show_forecast": config.get("display", {}).get("show_forecast", True),
            "forecast_days": config.get("display", {}).get("forecast_days", 5),
            "card_opacity": config.get("display", {}).get("card_opacity", 1.0),
            "icon_size": config.get("display", {}).get("icon_size", 120),
            "temp_size": config.get("display", {}).get("temp_size", 80),
            "condition_size": config.get("display", {}).get("condition_size", 32),
            "detail_label_size": config.get("display", {}).get("detail_label_size", 17),
            "detail_value_size": config.get("display", {}).get("detail_value_size", 25),
            "forecast_weekday_size": config.get("display", {}).get("forecast_weekday_size", 17),
            "forecast_icon_size": config.get("display", {}).get("forecast_icon_size", 35),
            "forecast_temp_size": config.get("display", {}).get("forecast_temp_size", 17),
            "forecast_min_width": config.get("display", {}).get("forecast_min_width", 110),
            "backgrounds": backgrounds,
            "seasonal_backgrounds": seasonal_backgrounds,
        },
    })


@bp.post("/api/weather-slide/background/<condition>")
def upload_weather_background(condition: str) -> Any:
    """Téléverse un arrière-plan pour une condition météo spécifique."""
    valid_conditions = (
        set(WEATHER_CODE_MAP.values())
        | {"default", "windy"}
        | set(DEFAULT_SETTINGS["weather_slide"]["seasonal_backgrounds"].keys())
    )
    if condition not in valid_conditions:
        abort(400, description=f"Condition invalide. Valeurs acceptées: {', '.join(sorted(valid_conditions))}")

    uploaded = request.files.get("file") or request.files.get("background")
    if not uploaded or not uploaded.filename:
        abort(400, description="Aucun fichier reçu.")

    original_name = uploaded.filename
    safe_name = secure_filename(original_name) or f"weather-bg-{condition}"
    ext = Path(original_name).suffix or Path(safe_name).suffix
    ext_lower = (ext or "").lower()

    mimetype = uploaded.mimetype or _guess_mimetype(original_name, safe_name) or ""
    if not (mimetype.startswith("image/") or mimetype.startswith("video/") or ext_lower in IMAGE_EXTENSIONS | VIDEO_EXTENSIONS):
        abort(400, description="Veuillez fournir une image ou une vidéo.")

    WEATHER_BACKGROUNDS_DIR.mkdir(parents=True, exist_ok=True)
    media_id = uuid.uuid4().hex
    storage_name = f"{condition}_{media_id}{ext_lower}"
    target = WEATHER_BACKGROUNDS_DIR / storage_name
    uploaded.save(target)

    config = _load_weather_config()
    is_seasonal = condition in ("spring", "summer", "autumn", "winter")
    if is_seasonal:
        config["seasonal_backgrounds"][condition] = storage_name
    else:
        config["backgrounds"][condition] = storage_name
    _save_weather_config(config)

    return jsonify({
        "condition": condition,
        "filename": storage_name,
        "url": url_for("main.serve_weather_asset", filename=storage_name, _external=False),
    })


@bp.get("/api/weather-slide/backgrounds")
def list_weather_backgrounds() -> Any:
    """Liste les arrière-plans météo téléversés."""
    WEATHER_BACKGROUNDS_DIR.mkdir(parents=True, exist_ok=True)
    items: List[Dict[str, Any]] = []
    for entry in sorted(WEATHER_BACKGROUNDS_DIR.iterdir()):
        if not entry.is_file():
            continue
        filename = entry.name
        mimetype = _guess_mimetype(filename) or "application/octet-stream"
        url = url_for("main.serve_weather_asset", filename=filename, _external=False)
        items.append({"filename": filename, "url": url, "mimetype": mimetype})

    config = _load_weather_config()
    return jsonify({
        "items": items,
        "backgrounds": config.get("backgrounds", {}),
        "seasonal_backgrounds": config.get("seasonal_backgrounds", {}),
    })


@bp.get("/weather-slide/asset/<path:filename>")
def serve_weather_asset(filename: str) -> Any:
    """Sert un fichier d'arrière-plan météo."""
    WEATHER_BACKGROUNDS_DIR.mkdir(parents=True, exist_ok=True)
    target = (WEATHER_BACKGROUNDS_DIR / filename).resolve()
    base_dir = WEATHER_BACKGROUNDS_DIR.resolve()
    try:
        target.relative_to(base_dir)
    except ValueError:
        abort(403, description="Chemin de fichier non autorisé.")
    if not target.exists() or not target.is_file():
        abort(404, description="Fichier introuvable.")
    return send_from_directory(WEATHER_BACKGROUNDS_DIR, filename)


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
            app_logger.error(
                "Failed to prepare bundle directory for %s: %s", original_filename, exc
            )
            errors.append(f"Impossible de préparer le dossier de conversion pour «{original_filename}» : {exc}.")
            continue

        safe_base = Path(safe_name).stem or media_id
        source_filename = f"{safe_base}{ext_lower}" if ext_lower else safe_base
        source_path = bundle_dir / source_filename

        try:
            uploaded.save(source_path)
        except Exception as exc:
            app_logger.error(
                "Failed to save uploaded powerpoint %s: %s", uploaded.filename, exc
            )
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
            app_logger.error(
                "Failed to prepare slides directory for %s: %s", uploaded.filename, exc
            )
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
                app_logger.exception(
                    "Failed to convert %s using %s: %s\n%s",
                    uploaded.filename,
                    filter_arg,
                    exc,
                    stderr_output,
                )
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
                app_logger.error(
                    "Failed to transcode PNG %s to JPEG: %s", candidate, exc
                )
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
            app_logger.warning(
                "No slide assets extracted for %s. Skipping upload.", uploaded.filename
            )
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
        app_logger.info(
            "Starting CardinalTV with Waitress on 0.0.0.0:39010 "
            "(threads=%s, connection_limit=%s, channel_timeout=%s, backlog=%s)",
            threads,
            connection_limit,
            channel_timeout,
            backlog,
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
        app_logger.warning(
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
