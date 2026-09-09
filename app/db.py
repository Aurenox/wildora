from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any


# ============================================================
# DATABASE
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "wildora.db"


# ============================================================
# CONNECTION
# ============================================================

def get_connection() -> sqlite3.Connection:

    conn = sqlite3.connect(
        DB_PATH,
        check_same_thread=False,
    )

    conn.row_factory = sqlite3.Row

    return conn


# ============================================================
# INITIALIZE DATABASE
# ============================================================

def init_db() -> None:

    conn = get_connection()

    try:

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS observations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                locality TEXT DEFAULT '',
                photo_url TEXT NOT NULL,
                creature_url TEXT,
                analysis_json TEXT NOT NULL,
                creature_json TEXT,
                is_demo INTEGER DEFAULT 0
            )
            """
        )

        conn.commit()

    finally:

        conn.close()


# ============================================================
# INSERT OBSERVATION
# ============================================================

def insert_observation(
    latitude: float | None,
    longitude: float | None,
    locality: str,
    photo_url: str,
    creature_url: str | None,
    analysis: dict[str, Any],
    creature: dict[str, Any] | None,
    is_demo: bool = False,
) -> int:

    conn = get_connection()

    try:

        cursor = conn.execute(
            """
            INSERT INTO observations (
                created_at,
                latitude,
                longitude,
                locality,
                photo_url,
                creature_url,
                analysis_json,
                creature_json,
                is_demo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                datetime.now().isoformat(
                    timespec="seconds"
                ),
                latitude,
                longitude,
                locality,
                photo_url,
                creature_url,
                json.dumps(
                    analysis,
                    ensure_ascii=False,
                ),
                json.dumps(
                    creature,
                    ensure_ascii=False,
                )
                if creature
                else None,
                1 if is_demo else 0,
            ),
        )

        conn.commit()

        return int(
            cursor.lastrowid
        )

    finally:

        conn.close()


# ============================================================
# LIST OBSERVATIONS
# ============================================================

def list_observations() -> list[dict[str, Any]]:

    conn = get_connection()

    try:

        rows = conn.execute(
            """
            SELECT
                id,
                created_at,
                latitude,
                longitude,
                locality,
                photo_url,
                creature_url,
                analysis_json,
                creature_json,
                is_demo
            FROM observations
            ORDER BY id DESC
            """
        ).fetchall()

    finally:

        conn.close()


    result: list[dict[str, Any]] = []


    for row in rows:

        # ----------------------------------------------------
        # Analysis JSON
        # ----------------------------------------------------

        try:

            analysis = json.loads(
                row["analysis_json"]
            )

        except Exception:

            analysis = {}


        # ----------------------------------------------------
        # Creature JSON
        # ----------------------------------------------------

        creature = None


        if row["creature_json"]:

            try:

                creature = json.loads(
                    row["creature_json"]
                )

            except Exception:

                creature = None


        # ----------------------------------------------------
        # Result
        # ----------------------------------------------------

        result.append(
            {
                "id":
                    row["id"],

                "created_at":
                    row["created_at"],

                "latitude":
                    row["latitude"],

                "longitude":
                    row["longitude"],

                "locality":
                    row["locality"] or "",

                "photo_url":
                    row["photo_url"],

                "creature_url":
                    row["creature_url"],

                "analysis":
                    analysis,

                "creature":
                    creature,

                "is_demo":
                    bool(
                        row["is_demo"]
                    ),
            }
        )


    return result


# ============================================================
# PROGRESS / GAMIFICATION
# ============================================================

def _progress(
    observations: list[dict[str, Any]],
) -> dict[str, Any]:

    # --------------------------------------------------------
    # Only animals count toward wildlife progression
    # --------------------------------------------------------

    animals = [
        item
        for item in observations
        if (
            item.get(
                "analysis",
                {}
            )
            .get(
                "kind",
                ""
            )
            .lower()
            == "animal"
        )
    ]


    # --------------------------------------------------------
    # Unique species
    # --------------------------------------------------------

    species_keys: set[str] = set()


    for item in animals:

        analysis = item.get(
            "analysis",
            {}
        )


        scientific_name = (
            analysis.get(
                "scientific_name"
            )
            or ""
        ).strip().lower()


        common_name = (
            analysis.get(
                "common_name"
            )
            or ""
        ).strip().lower()


        key = (
            scientific_name
            or common_name
            or "unknown"
        )


        species_keys.add(
            key
        )


    # --------------------------------------------------------
    # Taxonomic groups
    # --------------------------------------------------------

    group_counts: dict[str, int] = {}


    for item in animals:

        analysis = item.get(
            "analysis",
            {}
        )


        group = (
            analysis.get(
                "taxon_group"
            )
            or analysis.get(
                "taxonomic_group"
            )
            or "Other"
        )


        group = str(
            group
        ).strip()


        if not group:

            group = "Other"


        group_counts[group] = (
            group_counts.get(
                group,
                0,
            )
            + 1
        )


    # --------------------------------------------------------
    # XP
    #
    # 100 XP = wildlife observation
    # 75 XP  = unique species
    # 50 XP  = new taxonomic group
    # --------------------------------------------------------

    observation_xp = (
        len(animals) * 100
    )


    species_xp = (
        len(species_keys) * 75
    )


    group_xp = (
        len(group_counts) * 50
    )


    xp = (
        observation_xp
        + species_xp
        + group_xp
    )


    # --------------------------------------------------------
    # LEVEL
    #
    # Every 500 XP = one level
    # --------------------------------------------------------

    level = max(
        1,
        (xp // 500) + 1,
    )


    current_floor = (
        (level - 1) * 500
    )


    xp_into_level = max(
        0,
        xp - current_floor,
    )


    xp_to_next_level = max(
        0,
        500 - xp_into_level,
    )


    level_progress = min(
        100,
        round(
            (
                xp_into_level
                / 500
            )
            * 100
        ),
    )


    # --------------------------------------------------------
    # BADGES
    # --------------------------------------------------------

    badges = [

        {
            "id":
                "first-sighting",

            "name":
                "First Sighting",

            "description":
                "Record your first wildlife observation.",

            "icon":
                "◉",

            "unlocked":
                len(animals) >= 1,
        },


        {
            "id":
                "species-explorer",

            "name":
                "Species Explorer",

            "description":
                "Discover 3 different species.",

            "icon":
                "✦",

            "unlocked":
                len(species_keys) >= 3,
        },


        {
            "id":
                "biodiversity-keeper",

            "name":
                "Biodiversity Keeper",

            "description":
                "Explore 5 different species.",

            "icon":
                "❈",

            "unlocked":
                len(species_keys) >= 5,
        },


        {
            "id":
                "wildlife-guardian",

            "name":
                "Wildlife Guardian",

            "description":
                "Record 10 wildlife observations.",

            "icon":
                "◆",

            "unlocked":
                len(animals) >= 10,
        },


        {
            "id":
                "taxa-tracker",

            "name":
                "Taxa Tracker",

            "description":
                "Discover wildlife from 4 taxonomic groups.",

            "icon":
                "◇",

            "unlocked":
                len(group_counts) >= 4,
        },


        {
            "id":
                "wildora-bioblitz",

            "name":
                "Wildora BioBlitz",

            "description":
                "Discover 10 different species.",

            "icon":
                "✹",

            "unlocked":
                len(species_keys) >= 10,
        },

    ]


    unlocked_badges = [
        badge["name"]
        for badge in badges
        if badge["unlocked"]
    ]


    # --------------------------------------------------------
    # FINAL STATS
    # --------------------------------------------------------

    return {

        "observations":
            len(animals),

        "species":
            len(species_keys),

        "groups":
            group_counts,

        "group_count":
            len(group_counts),

        "xp":
            xp,

        "level":
            level,

        "level_progress":
            level_progress,

        "xp_into_level":
            xp_into_level,

        "xp_to_next_level":
            xp_to_next_level,

        "next_level":
            level + 1,

        "badges":
            badges,

        "unlocked_badges":
            unlocked_badges,

        "badge_count":
            len(unlocked_badges),

    }


# ============================================================
# PUBLIC STATS
# ============================================================

def stats() -> dict[str, Any]:

    observations =list_observations()


    return _progress(
        observations
    )


# ============================================================
# DEMO DATA
# ============================================================

def seed_demo_data() -> None:

    conn = get_connection()

    try:

        existing =conn.execute(
                """
                SELECT COUNT(*)
                FROM observations
                WHERE is_demo = 1
                """
            ).fetchone()[0]

    finally:

        conn.close()


    # ========================================================
    # IMPORTANT
    #
    # If demo data already exists from an older version,
    # update the old records with coordinates.
    # ========================================================

    if existing:

        update_demo_coordinates()

        return


    # ========================================================
    # DEMO OBSERVATIONS
    # ========================================================

    demo_observations = [

        # ----------------------------------------------------
        # 1. INDIAN ELEPHANT
        # ----------------------------------------------------

        {
            "latitude":
                9.4626,

            "longitude":
                77.1710,

            "locality":
                "Periyar, Kerala",

            "photo_url":
                "/static/demo/elephant.svg",

            "analysis": {

                "kind":
                    "animal",

                "is_animal":
                    True,

                "common_name":
                    "Indian Elephant",

                "scientific_name":
                    "Elephas maximus",

                "confidence":
                    0.94,

                "taxon_group":
                    "Mammal",

                "native_status":
                    "Native to India",

                "habitat_hint":
                    "Evergreen forests and grasslands",

                "ecological_role":
                    "Seed disperser and ecosystem engineer",

                "observation_quality":
                    "Excellent",

                "conservation_note":
                    "Asian elephants face habitat fragmentation and human-wildlife conflict.",

                "fun_fact":
                    "Elephants can use their trunks for breathing, smelling, drinking and manipulating objects.",

                "safety_note":
                    "Observe elephants from a safe distance and never approach wild herds.",
            },

            "creature": {

                "name":
                    "Forest Guardian",

                "element":
                    "Earth",

                "rarity":
                    "Legendary",

                "tagline":
                    "Keeper of the ancient forests.",

                "lore":
                    "Forest Guardian carries the memory of India's oldest forests and protects every path beneath the canopy.",

                "abilities": [
                    "Rootbound Strength",
                    "Canopy Call",
                    "Memory of the Wild",
                ],

                "habitat":
                    "Western Ghats forests",
            },
        },


        # ----------------------------------------------------
        # 2. INDIAN PEAFOWL
        # ----------------------------------------------------

        {
            "latitude":
                12.2958,

            "longitude":
                76.6394,

            "locality":
                "Mysuru, Karnataka",

            "photo_url":
                "/static/demo/peafowl.svg",

            "analysis": {

                "kind":
                    "animal",

                "is_animal":
                    True,

                "common_name":
                    "Indian Peafowl",

                "scientific_name":
                    "Pavo cristatus",

                "confidence":
                    0.97,

                "taxon_group":
                    "Bird",

                "native_status":
                    "Native to India",

                "habitat_hint":
                    "Open forests, scrublands and agricultural edges",

                "ecological_role":
                    "Seed disperser and insect predator",

                "observation_quality":
                    "Excellent",

                "conservation_note":
                    "The Indian peafowl is widespread across the Indian subcontinent.",

                "fun_fact":
                    "The spectacular train is made from elongated upper-tail coverts rather than the true tail feathers.",

                "safety_note":
                    "Watch from a distance and never chase or feed wild birds.",
            },

            "creature": {

                "name":
                    "Plume Dancer",

                "element":
                    "Light",

                "rarity":
                    "Epic",

                "tagline":
                    "A flash of colour beneath the morning sun.",

                "lore":
                    "Plume Dancer turns every quiet clearing into a stage, leaving trails of shimmering light behind.",

                "abilities": [
                    "Radiant Display",
                    "Feather Veil",
                    "Dawn Chorus",
                ],

                "habitat":
                    "Indian woodland edges",
            },
        },


        # ----------------------------------------------------
        # 3. MALABAR GLIDING FROG
        # ----------------------------------------------------

        {
            "latitude":
                11.0776,

            "longitude":
                76.4344,

            "locality":
                "Silent Valley, Kerala",

            "photo_url":
                "/static/demo/gliding-frog.svg",

            "analysis": {

                "kind":
                    "animal",

                "is_animal":
                    True,

                "common_name":
                    "Malabar Gliding Frog",

                "scientific_name":
                    "Rhacophorus malabaricus",

                "confidence":
                    0.91,

                "taxon_group":
                    "Amphibian",

                "native_status":
                    "Native to the Western Ghats",

                "habitat_hint":
                    "Moist evergreen forest canopy",

                "ecological_role":
                    "Insect predator and indicator of ecosystem health",

                "observation_quality":
                    "Very good",

                "conservation_note":
                    "Forest loss and changes to humid microhabitats can threaten specialist amphibians.",

                "fun_fact":
                    "Its large webbed feet help it glide between trees.",

                "safety_note":
                    "Do not handle wild amphibians; their skin is sensitive to contaminants.",
            },

            "creature": {

                "name":
                    "Rain Glider",

                "element":
                    "Water",

                "rarity":
                    "Rare",

                "tagline":
                    "Born where monsoon clouds meet the canopy.",

                "lore":
                    "Rain Glider rides warm forest winds and awakens whenever the first monsoon drops touch the leaves.",

                "abilities": [
                    "Rainstep",
                    "Canopy Glide",
                    "Mist Whisper",
                ],

                "habitat":
                    "Western Ghats rainforest",
            },
        },


        # ----------------------------------------------------
        # 4. COMMON MORMON
        # ----------------------------------------------------

        {
            "latitude":
                10.1076,

            "longitude":
                76.6720,

            "locality":
                "Thattekad, Kerala",

            "photo_url":
                "/static/demo/common-mormon.svg",

            "analysis": {

                "kind":
                    "animal",

                "is_animal":
                    True,

                "common_name":
                    "Common Mormon",

                "scientific_name":
                    "Papilio polytes",

                "confidence":
                    0.96,

                "taxon_group":
                    "Butterfly",

                "native_status":
                    "Native to India",

                "habitat_hint":
                    "Gardens, forests and woodland edges",

                "ecological_role":
                    "Pollinator",

                "observation_quality":
                    "Excellent",

                "conservation_note":
                    "Butterflies depend on healthy host plants and nectar-rich habitats.",

                "fun_fact":
                    "Female Common Mormons can mimic the appearance of other swallowtail butterflies.",

                "safety_note":
                    "Avoid touching butterfly wings and observe without disturbing them.",
            },

            "creature": {

                "name":
                    "Bloom Wing",

                "element":
                    "Air",

                "rarity":
                    "Rare",

                "tagline":
                    "A tiny messenger between flowers.",

                "lore":
                    "Bloom Wing carries whispers of distant gardens and leaves glowing trails through flowering forests.",

                "abilities": [
                    "Petal Drift",
                    "Pollinator's Grace",
                    "Garden Sense",
                ],

                "habitat":
                    "Indian forest gardens",
            },
        },

    ]


    # ========================================================
    # INSERT DEMO DATA
    # ========================================================

    for item in demo_observations:

        insert_observation(

            latitude=
                item["latitude"],

            longitude=
                item["longitude"],

            locality=
                item["locality"],

            photo_url=
                item["photo_url"],

            creature_url=
                None,

            analysis=
                item["analysis"],

            creature=
                item["creature"],

            is_demo=
                True,

        )


# ============================================================
# UPDATE EXISTING DEMO COORDINATES
# ============================================================

def update_demo_coordinates() -> None:

    """
    Updates older demo records that were originally created
    without latitude/longitude.

    Real user observations are NOT modified.
    """

    conn = get_connection()

    try:

        rows = conn.execute(
            """
            SELECT
                id,
                locality,
                latitude,
                longitude
            FROM observations
            WHERE is_demo = 1
            ORDER BY id ASC
            """
        ).fetchall()


        for row in rows:

            locality =(
                    row["locality"]
                    or ""
                ).lower()


            latitude = None
            longitude = None


            # ------------------------------------------------
            # Indian Elephant
            # ------------------------------------------------

            if "periyar" in locality:

                latitude =9.4626

                longitude =77.1710


            # ------------------------------------------------
            # Indian Peafowl
            # ------------------------------------------------

            elif "mysuru" in locality:

                latitude =12.2958

                longitude =76.6394


            # ------------------------------------------------
            # Malabar Gliding Frog
            # ------------------------------------------------

            elif "silent valley" in locality:

                latitude =11.0776

                longitude =76.4344


            # ------------------------------------------------
            # Common Mormon
            # ------------------------------------------------

            elif "thattekad" in locality:

                latitude =10.1076

                longitude =76.6720


            # ------------------------------------------------
            # Update only matching demo rows
            # ------------------------------------------------

            if (
                latitude is not None
                and longitude is not None
            ):

                conn.execute(
                    """
                    UPDATE observations
                    SET
                        latitude = ?,
                        longitude = ?
                    WHERE id = ?
                    """,
                    (
                        latitude,
                        longitude,
                        row["id"],
                    ),
                )


        conn.commit()


    finally:

        conn.close()