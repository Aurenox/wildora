from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types


# ============================================================
# ENVIRONMENT
# ============================================================

# Always load .env from the project root
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE, override=True)


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name, str(default)).strip().lower()
    return value in {"1", "true", "yes", "on"}


DEMO_MODE = _env_bool("DEMO_MODE", True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Support both names so the configuration cannot silently break.
ANALYSIS_MODEL = (
    os.getenv("GEMINI_VISION_MODEL")
    or os.getenv("GEMINI_ANALYSIS_MODEL")
    or "gemini-3.6-flash"
).strip()

IMAGE_MODEL = (
    os.getenv("GEMINI_IMAGE_MODEL")
    or "gemini-3.1-flash-image"
).strip()


print(
    f"[Wildora] DEMO_MODE={DEMO_MODE} | "
    f"VISION_MODEL={ANALYSIS_MODEL} | "
    f"API_KEY={'configured' if GEMINI_API_KEY else 'missing'}"
)


# ============================================================
# GEMINI CLIENT
# ============================================================

client = None

if GEMINI_API_KEY:
    try:
        client = genai.Client(
            api_key=GEMINI_API_KEY
        )
    except Exception as exc:
        print(
            f"[Wildora Gemini client warning] {exc}"
        )
        client = None


# ============================================================
# DEMO SPECIES
# ============================================================

DEMO_SPECIES = {

    "elephant": {
        "is_animal": True,
        "kind": "animal",
        "common_name": "Indian Elephant",
        "scientific_name": "Elephas maximus",
        "taxonomic_group": "Mammal",
        "taxon_group": "Mammal",
        "confidence": 0.94,
        "native_status": "Native to India",
        "conservation_note": (
            "Asian elephants face habitat fragmentation "
            "and human-wildlife conflict."
        ),
        "fun_fact": (
            "Elephants can use their trunks for breathing, "
            "smelling, drinking and manipulating objects."
        ),
        "safety_note": (
            "Observe elephants from a safe distance "
            "and never approach wild herds."
        ),
        "habitat_hint": (
            "Evergreen forests, grasslands and wildlife corridors."
        ),
        "ecological_role": (
            "Seed disperser and ecosystem engineer."
        ),
        "observation_quality": "Excellent",
    },

    "peafowl": {
        "is_animal": True,
        "kind": "animal",
        "common_name": "Indian Peafowl",
        "scientific_name": "Pavo cristatus",
        "taxonomic_group": "Bird",
        "taxon_group": "Bird",
        "confidence": 0.97,
        "native_status": "Native to India",
        "conservation_note": (
            "The Indian peafowl is widespread across "
            "the Indian subcontinent and is India's national bird."
        ),
        "fun_fact": (
            "The spectacular train is made from elongated "
            "upper-tail coverts rather than the true tail feathers."
        ),
        "safety_note": (
            "Watch from a distance and never chase "
            "or feed wild birds."
        ),
        "habitat_hint": (
            "Open forests, scrublands, grasslands "
            "and agricultural edges."
        ),
        "ecological_role": (
            "Seed disperser and insect predator."
        ),
        "observation_quality": "Excellent",
    },

    "frog": {
        "is_animal": True,
        "kind": "animal",
        "common_name": "Malabar Gliding Frog",
        "scientific_name": "Rhacophorus malabaricus",
        "taxonomic_group": "Amphibian",
        "taxon_group": "Amphibian",
        "confidence": 0.91,
        "native_status": "Native to the Western Ghats",
        "conservation_note": (
            "Forest loss and changes to humid microhabitats "
            "can threaten specialist amphibians."
        ),
        "fun_fact": (
            "Its large webbed feet help it glide between trees."
        ),
        "safety_note": (
            "Do not handle wild amphibians; their skin "
            "is sensitive to contaminants."
        ),
        "habitat_hint": (
            "Moist evergreen forest canopy and streams."
        ),
        "ecological_role": (
            "Insect predator and indicator of ecosystem health."
        ),
        "observation_quality": "Very good",
    },

    "butterfly": {
        "is_animal": True,
        "kind": "animal",
        "common_name": "Common Mormon",
        "scientific_name": "Papilio polytes",
        "taxonomic_group": "Butterfly",
        "taxon_group": "Butterfly",
        "confidence": 0.96,
        "native_status": "Native to India",
        "conservation_note": (
            "Butterflies depend on healthy host plants "
            "and nectar-rich habitats."
        ),
        "fun_fact": (
            "Female Common Mormons can mimic the appearance "
            "of other swallowtail butterflies."
        ),
        "safety_note": (
            "Avoid touching butterfly wings and observe "
            "without disturbing them."
        ),
        "habitat_hint": (
            "Gardens, forests, woodland edges and "
            "flowering habitats."
        ),
        "ecological_role": "Pollinator.",
        "observation_quality": "Excellent",
    },
}


# ============================================================
# DEFAULT DEMO
# ============================================================

def _demo_analysis() -> dict[str, Any]:
    return dict(
        DEMO_SPECIES["elephant"]
    )


# ============================================================
# IMAGE → GEMINI PART
# ============================================================

def _image_part(
    image_path: Path,
    mime_type: str,
) -> types.Part:

    image_bytes = image_path.read_bytes()

    return types.Part.from_bytes(
        data=image_bytes,
        mime_type=mime_type,
    )


# ============================================================
# CLEAN JSON
# ============================================================

def _extract_json(
    text: str,
) -> dict[str, Any]:

    text = (text or "").strip()

    if text.startswith("```"):
        text = (
            text.replace("```json", "")
            .replace("```", "")
            .strip()
        )

    start = text.find("{")
    end = text.rfind("}")

    if (
        start == -1
        or end == -1
        or end <= start
    ):
        raise ValueError(
            "Gemini did not return valid JSON."
        )

    return json.loads(
        text[start:end + 1]
    )


# ============================================================
# NORMALIZE ANALYSIS
# ============================================================

def _normalize_analysis(
    data: dict[str, Any],
) -> dict[str, Any]:

    result = dict(data)

    result["is_animal"] = bool(
        result.get(
            "is_animal",
            result.get("kind") == "animal",
        )
    )

    kind = str(
        result.get(
            "kind",
            "unknown",
        )
    ).lower().strip()

    if kind not in {
        "animal",
        "human",
        "other",
        "unknown",
    }:
        kind = (
            "animal"
            if result["is_animal"]
            else "unknown"
        )

    result["kind"] = kind

    result["common_name"] = (
        str(
            result.get(
                "common_name",
                "Unknown species",
            )
        ).strip()
        or "Unknown species"
    )

    result["scientific_name"] = (
        str(
            result.get(
                "scientific_name",
                "Not available",
            )
        ).strip()
        or "Not available"
    )

    group = (
        result.get("taxon_group")
        or result.get("taxonomic_group")
        or "Other"
    )

    result["taxon_group"] = (
        str(group).strip()
        or "Other"
    )

    result["taxonomic_group"] = (
        result["taxon_group"]
    )

    try:
        confidence = float(
            result.get(
                "confidence",
                0,
            )
        )
    except (
        TypeError,
        ValueError,
    ):
        confidence = 0

    result["confidence"] = max(
        0,
        min(
            1,
            confidence,
        ),
    )

    result["native_status"] = (
        str(
            result.get(
                "native_status",
                "Unknown",
            )
        ).strip()
    )

    result["conservation_note"] = (
        str(
            result.get(
                "conservation_note",
                "No conservation note available.",
            )
        ).strip()
    )

    result["fun_fact"] = (
        str(
            result.get(
                "fun_fact",
                result.get(
                    "description",
                    "No additional information available.",
                ),
            )
        ).strip()
    )

    result["description"] = (
        result["fun_fact"]
    )

    result["safety_note"] = (
        str(
            result.get(
                "safety_note",
                "Observe wildlife respectfully and maintain a safe distance.",
            )
        ).strip()
    )

    result["habitat_hint"] = (
        str(
            result.get(
                "habitat_hint",
                "Natural habitat information unavailable.",
            )
        ).strip()
    )

    result["ecological_role"] = (
        str(
            result.get(
                "ecological_role",
                "Part of the local ecosystem.",
            )
        ).strip()
    )

    result["observation_quality"] = (
        str(
            result.get(
                "observation_quality",
                "Good",
            )
        ).strip()
    )

    return result


# ============================================================
# ANALYZE IMAGE
# ============================================================

def analyze_image(
    image_path: Path,
    mime_type: str,
    sample_id: str = "",
) -> dict[str, Any]:

    sample_id = (
        sample_id or ""
    ).strip().lower()

    print(
        f"[Wildora] Analyzing image | "
        f"sample_id={sample_id!r} | "
        f"demo={DEMO_MODE} | "
        f"gemini={'available' if client else 'unavailable'}"
    )

    # ========================================================
    # IMPORTANT:
    # DEMO SPECIES ARE ONLY USED WHEN A SAMPLE ID EXISTS.
    #
    # A REAL UPLOADED PHOTO MUST GO TO GEMINI.
    # ========================================================

    if DEMO_MODE and sample_id in DEMO_SPECIES:

        print(
            f"[Wildora] Using demo species: {sample_id}"
        )

        return dict(
            DEMO_SPECIES[sample_id]
        )

    # ========================================================
    # REAL AI ANALYSIS
    # ========================================================

    if not client:

        # Only use default demo when explicitly running
        # demo mode AND there is no real sample.
        if DEMO_MODE:
            print(
                "[Wildora] Gemini unavailable; "
                "using fallback demo analysis."
            )

            return _demo_analysis()

        raise RuntimeError(
            "Gemini API key is not configured."
        )

    # ========================================================
    # WILDLIFE IDENTIFICATION PROMPT
    # ========================================================

    prompt = """
You are Wildora, an AI wildlife identification assistant
focused on Indian biodiversity.

Analyze the uploaded image carefully.

Your primary task is to identify the actual animal shown
in the image.

IMPORTANT:
- Look at the image itself.
- Do not assume the animal from previous examples.
- Do not return a default species.
- Do not use any demo species unless the image actually
  contains that species.
- If the image contains a lion, identify it as a lion.
- If the image contains an elephant, identify it as an elephant.
- If the image contains a tiger, identify it as a tiger.
- Carefully distinguish visually similar species.
- If the image is unclear, lower the confidence.
- If there is no animal, set is_animal to false.
- Never invent an animal.

Return ONLY valid JSON.

Use exactly this structure:

{
  "is_animal": true,
  "kind": "animal",
  "common_name": "English common name",
  "scientific_name": "Scientific name",
  "taxonomic_group": "Mammal/Bird/Reptile/Amphibian/Butterfly/Insect/Fish/Other",
  "confidence": 0.0,
  "native_status": "Native / Introduced / Unknown",
  "conservation_note": "Short conservation context",
  "fun_fact": "Interesting factual detail",
  "safety_note": "Safe wildlife observation advice",
  "habitat_hint": "Likely habitat",
  "ecological_role": "Role in ecosystem",
  "observation_quality": "Excellent/Good/Fair/Poor"
}

Rules:

1. Use English common names.
2. Scientific name must be plain JSON text.
3. Confidence must be between 0 and 1.
4. Prefer Indian species only when the visual evidence supports it.
5. Never claim certainty when the image is ambiguous.
6. If there is no animal, set is_animal to false.
7. Do not identify a person as an animal.
8. Keep every field concise and factual.
9. Identify the animal from the uploaded image, not from
   metadata, filenames, demo samples, or assumptions.
"""

    # ========================================================
    # GEMINI REQUEST
    # ========================================================

    try:

        response = client.models.generate_content(
            model=ANALYSIS_MODEL,
            contents=[
                prompt,
                _image_part(
                    image_path,
                    mime_type,
                ),
            ],
            config=types.GenerateContentConfig(
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )

    except Exception as exc:

        print(
            f"[Wildora Gemini analysis error] {exc}"
        )

        raise RuntimeError(
            f"Wildlife AI analysis failed: {exc}"
        ) from exc

    # ========================================================
    # PARSE
    # ========================================================

    try:

        data = _extract_json(
            response.text
        )

    except Exception as exc:

        print(
            "[Wildora Gemini JSON error]",
            response.text[:1000]
            if response.text
            else "(empty response)",
        )

        raise RuntimeError(
            "Gemini returned an invalid wildlife analysis."
        ) from exc

    return _normalize_analysis(
        data
    )


# ============================================================
# FANTASY COMPANION METADATA
# ============================================================

def create_creature_metadata(
    analysis: dict[str, Any],
    image_path: Path | None = None,
    mime_type: str = "image/jpeg",
) -> dict[str, Any] | None:

    if not analysis.get(
        "is_animal",
        False,
    ):
        return None

    species = (
        analysis.get(
            "common_name",
            "Wildlife",
        )
        or "Wildlife"
    )

    # ========================================================
    # DEMO COMPANIONS
    # ========================================================

    companion_map = {

        "Indian Elephant": {
            "name": "Forest Guardian",
            "element": "Earth",
            "rarity": "Legendary",
            "tagline": "Keeper of the ancient forests.",
            "lore": (
                "Forest Guardian carries the memory of India's "
                "oldest forests and protects every path beneath "
                "the canopy."
            ),
            "abilities": [
                "Rootbound Strength",
                "Canopy Call",
                "Memory of the Wild",
            ],
            "habitat": "Western Ghats forests",
        },

        "Indian Peafowl": {
            "name": "Plume Dancer",
            "element": "Light",
            "rarity": "Epic",
            "tagline": (
                "A flash of colour beneath the morning sun."
            ),
            "lore": (
                "Plume Dancer turns every quiet clearing into "
                "a stage, leaving trails of shimmering light behind."
            ),
            "abilities": [
                "Radiant Display",
                "Feather Veil",
                "Dawn Chorus",
            ],
            "habitat": "Indian woodland edges",
        },

        "Malabar Gliding Frog": {
            "name": "Rain Glider",
            "element": "Water",
            "rarity": "Rare",
            "tagline": (
                "Born where monsoon clouds meet the canopy."
            ),
            "lore": (
                "Rain Glider rides warm forest winds and awakens "
                "whenever the first monsoon drops touch the leaves."
            ),
            "abilities": [
                "Rainstep",
                "Canopy Glide",
                "Mist Whisper",
            ],
            "habitat": "Western Ghats rainforest",
        },

        "Common Mormon": {
            "name": "Bloom Wing",
            "element": "Air",
            "rarity": "Rare",
            "tagline": (
                "A tiny messenger between flowers."
            ),
            "lore": (
                "Bloom Wing carries whispers of distant gardens "
                "and leaves glowing trails through flowering forests."
            ),
            "abilities": [
                "Petal Drift",
                "Pollinator's Grace",
                "Garden Sense",
            ],
            "habitat": "Indian forest gardens",
        },
    }

    # ========================================================
    # ONLY FORCE DEMO COMPANIONS FOR DEMO SPECIES
    # ========================================================

    if DEMO_MODE and species in companion_map:

        return dict(
            companion_map[species]
        )

    # ========================================================
    # REAL GEMINI COMPANION
    # ========================================================

    if not client:

        return {
            "name": f"{species} Spirit",
            "element": "Wild",
            "rarity": "Rare",
            "tagline": (
                f"Guardian spirit of the {species}."
            ),
            "lore": (
                f"A fantasy companion inspired by the ecology "
                f"and character of the {species}."
            ),
            "abilities": [
                "Wild Sense",
                "Nature Bond",
                "Explorer's Instinct",
            ],
            "habitat": analysis.get(
                "habitat_hint",
                "Indian wilderness",
            ),
        }

    prompt = f"""
Create a fantasy wildlife companion inspired by:

Species:
{species}

Scientific name:
{analysis.get("scientific_name", "")}

Habitat:
{analysis.get("habitat_hint", "")}

Ecological role:
{analysis.get("ecological_role", "")}

Return ONLY JSON:

{{
  "name": "English fantasy name",
  "element": "Earth/Water/Air/Fire/Light/Shadow/Wild",
  "rarity": "Common/Uncommon/Rare/Epic/Legendary",
  "tagline": "Short tagline",
  "lore": "Two short sentences",
  "abilities": [
    "Ability one",
    "Ability two",
    "Ability three"
  ],
  "habitat": "Short habitat description"
}}

The name must be in English.

Do not use Indian-language words.

Do not use the scientific name as the companion name.

Keep it family-friendly.
"""

    try:

        response = client.models.generate_content(
            model=ANALYSIS_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.8,
                response_mime_type="application/json",
            ),
        )

        return _extract_json(
            response.text
        )

    except Exception as exc:

        print(
            f"[Wildora companion generation warning] {exc}"
        )

        return {
            "name": f"{species} Spirit",
            "element": "Wild",
            "rarity": "Rare",
            "tagline": (
                f"Guardian spirit of the {species}."
            ),
            "lore": (
                f"A fantasy companion inspired by the {species}."
            ),
            "abilities": [
                "Wild Sense",
                "Nature Bond",
                "Explorer's Instinct",
            ],
            "habitat": analysis.get(
                "habitat_hint",
                "Indian wilderness",
            ),
        }


# ============================================================
# AI GENERATED COMPANION IMAGE
# ============================================================

def generate_creature_image(
    image_path: Path,
    mime_type: str,
    creature: dict[str, Any],
    output_path: Path,
) -> bool:

    if DEMO_MODE:
        return False

    if not client:
        return False

    name = creature.get(
        "name",
        "Wildlife Spirit",
    )

    lore = creature.get(
        "lore",
        "",
    )

    prompt = f"""
Create a polished fantasy wildlife companion illustration.

Companion:
{name}

Lore:
{lore}

Requirements:

- Inspired by Indian wilderness.
- Family-friendly.
- Magical but believable.
- Premium game concept-art quality.
- Purple and charcoal visual atmosphere.
- Full creature visible.
- Strong silhouette.
- Detailed natural textures.
- No text.
- No logos.
- No watermark.
"""

    try:

        response = client.models.generate_content(
            model=IMAGE_MODEL,
            contents=[
                prompt,
                _image_part(
                    image_path,
                    mime_type,
                ),
            ],
        )

        for part in response.parts:

            if (
                getattr(
                    part,
                    "inline_data",
                    None,
                )
                is not None
            ):

                image_data = (
                    part.inline_data.data
                )

                if image_data:

                    output_path.write_bytes(
                        image_data
                    )

                    return True

    except Exception as exc:

        print(
            f"[Wildora image generation warning] {exc}"
        )

    return False