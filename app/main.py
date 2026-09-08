from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .db import (
    init_db,
    insert_observation,
    list_observations,
    seed_demo_data,
    stats,
)

from .gemini import (
    analyze_image,
    create_creature_metadata,
    generate_creature_image,
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent


STATIC_CANDIDATES = [
    BASE_DIR / "static",
    PROJECT_DIR / "static",
]


STATIC_DIR = next(
    (
        path
        for path in STATIC_CANDIDATES
        if (path / "index.html").exists()
    ),
    PROJECT_DIR / "static",
)


UPLOAD_DIR = STATIC_DIR / "uploads"
CREATURE_DIR = STATIC_DIR / "creatures"


# UPLOAD_DIR.mkdir(
#     parents=True,
#     exist_ok=True,
# )

# CREATURE_DIR.mkdir(
#     parents=True,
#     exist_ok=True,
# )


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="Wildora",
    description="AI-powered Indian wildlife discovery platform",
    version="2.0.0",
)


app.mount(
    "/static",
    StaticFiles(
        directory=str(STATIC_DIR)
    ),
    name="static",
)


# ============================================================
# STARTUP
# ============================================================

@app.on_event("startup")
def startup() -> None:

    init_db()
    seed_demo_data()


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    index_file = (
        STATIC_DIR / "index.html"
    )

    if not index_file.exists():

        raise HTTPException(
            status_code=500,
            detail=(
                "Wildora frontend not found. "
                f"Expected index.html at: {index_file}"
            ),
        )

    return FileResponse(
        index_file
    )


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
def health():

    return {
        "status": "ok",
        "app": "Wildora",
        "version": "2.0.0",
        "demo_mode": (
            os.getenv(
                "DEMO_MODE",
                "true",
            ).lower()
            in {
                "1",
                "true",
                "yes",
                "on",
            }
        ),
    }


# ============================================================
# HELPERS
# ============================================================

def demo_mode_enabled() -> bool:

    return (
        os.getenv(
            "DEMO_MODE",
            "true",
        ).lower()
        in {
            "1",
            "true",
            "yes",
            "on",
        }
    )


def parse_coordinate(
    value: str,
    name: str,
    minimum: float,
    maximum: float,
) -> float | None:

    value = (
        value or ""
    ).strip()

    if not value:
        return None

    try:

        number = float(value)

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail=f"Invalid {name}.",
        )

    if not (
        minimum
        <= number
        <= maximum
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                f"{name} must be between "
                f"{minimum} and {maximum}."
            ),
        )

    return number


# ============================================================
# OBSERVE
# ============================================================

@app.post("/api/observe")
async def observe(

    photo: UploadFile = File(...),

    latitude: str = Form(""),

    longitude: str = Form(""),

    locality: str = Form(""),

    sample_id: str = Form(""),
):

    # --------------------------------------------------------
    # Validate image
    # --------------------------------------------------------

    if not photo:

        raise HTTPException(
            status_code=400,
            detail=(
                "Please upload a wildlife image."
            ),
        )


    content_type = (
        photo.content_type or ""
    ).lower()


    if not content_type.startswith(
        "image/"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Please upload a valid image file."
            ),
        )


    # --------------------------------------------------------
    # Coordinates
    # --------------------------------------------------------

    latitude_value = parse_coordinate(
        latitude,
        "latitude",
        -90,
        90,
    )


    longitude_value = parse_coordinate(
        longitude,
        "longitude",
        -180,
        180,
    )


    # --------------------------------------------------------
    # Read image
    # --------------------------------------------------------

    image_bytes = await photo.read()


    if not image_bytes:

        raise HTTPException(
            status_code=400,
            detail=(
                "The uploaded image is empty."
            ),
        )


    max_size = (
        12 * 1024 * 1024
    )


    if len(image_bytes) > max_size:

        raise HTTPException(
            status_code=413,
            detail=(
                "Image is too large. "
                "Maximum size is 12 MB."
            ),
        )


    # --------------------------------------------------------
    # Extension
    # --------------------------------------------------------

    extension_map = {

        "image/jpeg": ".jpg",

        "image/jpg": ".jpg",

        "image/png": ".png",

        "image/webp": ".webp",

        "image/gif": ".gif",

        "image/bmp": ".bmp",

    }


    extension = extension_map.get(
        content_type,
        Path(
            photo.filename or ""
        ).suffix.lower(),
    )


    if not extension:

        extension = ".jpg"


    # --------------------------------------------------------
    # Save uploaded image
    # --------------------------------------------------------

    filename = (
        f"{uuid.uuid4().hex}"
        f"{extension}"
    )


    image_path = (
        UPLOAD_DIR / filename
    )


    image_path.write_bytes(
        image_bytes
    )


    photo_url = (
        f"/static/uploads/{filename}"
    )


    # --------------------------------------------------------
    # Previous progress
    #
    # Used to calculate exactly how much XP
    # this observation added.
    # --------------------------------------------------------

    before_stats = stats()


    # --------------------------------------------------------
    # AI ANALYSIS
    # --------------------------------------------------------

    try:

        # Newer gemini.py can accept sample_id.
        # Older gemini.py is also supported.

        try:

            analysis = analyze_image(
                image_path,
                content_type,
                sample_id=sample_id.strip(),
            )

        except TypeError:

            analysis = analyze_image(
                image_path,
                content_type,
            )


    except Exception as exc:

        print(
            f"[Wildora analysis error] {exc}"
        )


        raise HTTPException(
            status_code=500,
            detail=(
                "AI analysis failed. "
                "Please try again."
            ),
        )


    if not isinstance(
        analysis,
        dict,
    ):

        raise HTTPException(
            status_code=500,
            detail=(
                "AI returned an invalid analysis."
            ),
        )


    # --------------------------------------------------------
    # FANTASY COMPANION
    # --------------------------------------------------------

    creature = None

    creature_url = None


    try:

        creature = (
            create_creature_metadata(
                analysis,
                image_path,
                content_type,
            )
        )


    except Exception as exc:

        print(
            "[Wildora companion metadata note] "
            f"{exc}"
        )


    # --------------------------------------------------------
    # AI GENERATED COMPANION IMAGE
    # --------------------------------------------------------

    if creature:

        creature_filename = (
            f"{uuid.uuid4().hex}.png"
        )


        creature_path = (
            CREATURE_DIR
            / creature_filename
        )


        try:

            generated = (
                generate_creature_image(
                    image_path,
                    content_type,
                    creature,
                    creature_path,
                )
            )


            if (
                generated
                and creature_path.exists()
            ):

                creature_url = (
                    "/static/creatures/"
                    f"{creature_filename}"
                )


        except Exception as exc:

            print(
                "[Wildora companion image note] "
                f"{exc}"
            )

            creature_url = None


    # --------------------------------------------------------
    # Locality
    # --------------------------------------------------------

    locality = (
        locality or ""
    ).strip()


    # --------------------------------------------------------
    # SAVE OBSERVATION
    # --------------------------------------------------------

    try:

        observation_id = (
            insert_observation(
                latitude=latitude_value,
                longitude=longitude_value,
                locality=locality,
                photo_url=photo_url,
                creature_url=creature_url,
                analysis=analysis,
                creature=creature,
                is_demo=False,
            )
        )


    except Exception as exc:

        print(
            f"[Wildora database error] {exc}"
        )


        raise HTTPException(
            status_code=500,
            detail=(
                "Could not save the observation."
            ),
        )


    # --------------------------------------------------------
    # UPDATED PROGRESS
    # --------------------------------------------------------

    current_stats = stats()


    xp_gained = max(
        0,
        current_stats["xp"]
        - before_stats["xp"],
    )


    level_up = (
        current_stats["level"]
        > before_stats["level"]
    )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "id":
            observation_id,

        "photo_url":
            photo_url,

        "creature_url":
            creature_url,

        "analysis":
            analysis,

        "creature":
            creature,

        "progress":
            current_stats,

        "stats":
            current_stats,

        "xp_gained":
            xp_gained,

        "level_up":
            level_up,

        "demo_mode":
            demo_mode_enabled(),

        "sample_id":
            sample_id,

        "locality":
            locality,

        "latitude":
            latitude_value,

        "longitude":
            longitude_value,
    }


# ============================================================
# ALL OBSERVATIONS
# ============================================================

@app.get("/api/observations")
def observations():

    return {

        "items":
            list_observations(),

        "stats":
            stats(),

    }