from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any


# =========================================================
# WILDORA DATABASE
# =========================================================

BASE_DIR = Path(__file__).resolve().parent


DATA_DIR_ENV = os.getenv(
    "WILDORA_DATA_DIR",
    "",
).strip()


if DATA_DIR_ENV:

    DATA_DIR = Path(
        DATA_DIR_ENV
    )

    DATA_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    DB_PATH = (
        DATA_DIR / "wildora.db"
    )

else:

    DB_PATH = (
        BASE_DIR / "wildora.db"
    )


print(
    f"[Wildora] DB_PATH={DB_PATH}"
)


# =========================================================
# SCHEMA
# =========================================================

SCHEMA = """
CREATE TABLE IF NOT EXISTS observations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    latitude REAL,
    longitude REAL,
    locality TEXT NOT NULL DEFAULT '',
    photo_url TEXT NOT NULL,
    creature_url TEXT,
    analysis_json TEXT NOT NULL,
    creature_json TEXT,
    is_demo INTEGER NOT NULL DEFAULT 0
);
"""


# =========================================================
# DATABASE CONNECTION
# =========================================================

def connect() -> sqlite3.Connection:

    conn = sqlite3.connect(
        DB_PATH
    )

    conn.row_factory = sqlite3.Row

    return conn


# =========================================================
# INITIALIZE DATABASE
# =========================================================

def init_db() -> None:

    with connect() as conn:

        conn.executescript(
            SCHEMA
        )


        # -------------------------------------------------
        # Compatibility with older databases
        # -------------------------------------------------

        cols = {

            row[1]

            for row in conn.execute(
                "PRAGMA table_info(observations)"
            )

        }


        if "is_demo" not in cols:

            conn.execute(
                """
                ALTER TABLE observations
                ADD COLUMN is_demo
                INTEGER NOT NULL DEFAULT 0
                """
            )


        conn.commit()


# =========================================================
# INSERT OBSERVATION
# =========================================================

def insert_observation(
    *,
    latitude: float | None,
    longitude: float | None,
    locality: str,
    photo_url: str,
    creature_url: str | None,
    analysis: dict[str, Any],
    creature: dict[str, Any] | None,
    is_demo: bool = False,
) -> int:

    with connect() as conn:

        cur = conn.execute(
            """
            INSERT INTO observations
            (
                latitude,
                longitude,
                locality,
                photo_url,
                creature_url,
                analysis_json,
                creature_json,
                is_demo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
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
            cur.lastrowid
        )


# =========================================================
# LIST OBSERVATIONS
# =========================================================

def list_observations() -> list[
    dict[str, Any]
]:

    with connect() as conn:

        rows = conn.execute(
            """
            SELECT *
            FROM observations
            ORDER BY id DESC
            """
        ).fetchall()


    result: list[
        dict[str, Any]
    ] = []


    for row in rows:

        item = dict(row)


        # -------------------------------------------------
        # Analysis JSON
        # -------------------------------------------------

        item["analysis"] = (
            json.loads(
                item.pop(
                    "analysis_json"
                )
            )
        )


        # -------------------------------------------------
        # Creature JSON
        # -------------------------------------------------

        creature_json = item.pop(
            "creature_json"
        )


        item["creature"] = (

            json.loads(
                creature_json
            )

            if creature_json

            else None

        )


        # -------------------------------------------------
        # Demo flag
        # -------------------------------------------------

        item["is_demo"] = bool(
            item.get(
                "is_demo"
            )
        )


        result.append(
            item
        )


    return result


# =========================================================
# PROGRESS / XP
# =========================================================

def _progress(
    obs: list[
        dict[str, Any]
    ],
) -> dict[str, Any]:

    animals = [

        observation

        for observation in obs

        if observation[
            "analysis"
        ].get(
            "kind",
            "",
        ).lower()
        == "animal"

    ]


    # -----------------------------------------------------
    # Unique species
    # -----------------------------------------------------

    species_keys = {

        (
            observation[
                "analysis"
            ].get(
                "scientific_name"
            )

            or observation[
                "analysis"
            ].get(
                "common_name"
            )

            or "unknown"

        ).lower().strip()

        for observation in animals

        if (

            observation[
                "analysis"
            ].get(
                "scientific_name"
            )

            or observation[
                "analysis"
            ].get(
                "common_name"
            )

        )

    }


    # -----------------------------------------------------
    # Taxonomic groups
    # -----------------------------------------------------

    groups: dict[
        str,
        int
    ] = {}


    for observation in animals:

        group = (

            observation[
                "analysis"
            ].get(
                "taxon_group",
                "Other",
            )

            or "Other"

        )


        groups[group] = (
            groups.get(
                group,
                0,
            )
            + 1
        )


    # -----------------------------------------------------
    # XP SYSTEM
    # -----------------------------------------------------

    xp = (

        len(animals)
        * 100

        +

        len(species_keys)
        * 75

        +

        len(groups)
        * 50

    )


    level = max(
        1,
        xp // 500 + 1,
    )


    current_floor = (
        level - 1
    ) * 500


    level_progress = min(
        100,
        round(
            (
                xp
                - current_floor
            )
            / 500
            * 100
        ),
    )


    # -----------------------------------------------------
    # WILDORA BADGES
    # -----------------------------------------------------

    badge_defs = [

        (
            "First Sighting",
            "Record your first wildlife sighting",
            len(animals) >= 1,
            "✦",
        ),

        (
            "Species Explorer",
            "Discover 5 different species",
            len(species_keys) >= 5,
            "◉",
        ),

        (
            "Biodiversity Keeper",
            "Observe 3 different animal groups",
            len(groups) >= 3,
            "⌘",
        ),

        (
            "Night Explorer",
            "Discover a nocturnal species",

            any(

                "noct"

                in (

                    observation[
                        "analysis"
                    ].get(
                        "fun_fact",
                        "",
                    )

                    or ""

                ).lower()

                for observation
                in animals

            ),

            "☾",
        ),

        (
            "Wildlife Guardian",
            "Record 10 wildlife observations",
            len(animals) >= 10,
            "△",
        ),

        (
            "Wildora BioBlitz",
            "Discover 10 different species",
            len(species_keys) >= 10,
            "⚡",
        ),

    ]


    badges = [

        {
            "name":
                name,

            "description":
                description,

            "unlocked":
                unlocked,

            "icon":
                icon,

        }

        for (
            name,
            description,
            unlocked,
            icon,
        )
        in badge_defs

    ]


    return {

        "observations":
            len(animals),

        "species":
            len(species_keys),

        "groups":
            groups,

        "xp":
            xp,

        "level":
            level,

        "level_progress":
            level_progress,

        "badges":
            badges,

        "unlocked_badges":
            sum(

                1

                for badge
                in badges

                if badge[
                    "unlocked"
                ]

            ),

    }


# =========================================================
# STATS
# =========================================================

def stats() -> dict[str, Any]:

    return _progress(
        list_observations()
    )


# =========================================================
# WILDORA DEMO DATA
# =========================================================

DEMO_SEED = [

    # -----------------------------------------------------
    # 1. INDIAN ELEPHANT — KERALA
    # -----------------------------------------------------

    (
        10.8505,
        76.2711,
        "Kerala",

        "/static/demo/elephant.svg",

        "/static/demo/forest-guardian.svg",

        {
            "kind":
                "animal",

            "common_name":
                "Indian Elephant",

            "scientific_name":
                "Elephas maximus",

            "confidence":
                0.94,

            "taxon_group":
                "Mammal",

            "native_status":
                "Native Indian wildlife species.",

            "conservation_note":
                "Indian elephants depend on connected forest habitats and safe wildlife corridors.",

            "fun_fact":
                "Asian elephants communicate using a wide range of sounds and vibrations.",

            "safety_note":
                "Observe elephants from a safe distance and never approach, feed, or provoke them.",
        },

        {
            "name":
                "Forest Guardian",

            "element":
                "Forest",

            "rarity":
                "Legendary",

            "tagline":
                "Guardian of India's ancient forests.",

            "lore":
                "Forest Guardian travels through hidden forest paths, protecting the balance between trees, rivers, and wildlife.",

            "abilities": [
                "Forest Roar",
                "Elephant Guard",
                "Jungle Trail",
            ],

            "habitat":
                "Western Ghats forests",
        },

    ),


    # -----------------------------------------------------
    # 2. INDIAN PEAFOWL — KOZHIKODE
    # -----------------------------------------------------

    (
        11.1271,
        75.8346,
        "Kozhikode, Kerala",

        "/static/demo/peafowl.svg",

        "/static/demo/rainbow-crest.svg",

        {
            "kind":
                "animal",

            "common_name":
                "Indian Peafowl",

            "scientific_name":
                "Pavo cristatus",

            "confidence":
                0.92,

            "taxon_group":
                "Bird",

            "native_status":
                "Native Indian bird species.",

            "conservation_note":
                "Open woodland, grassland, and agricultural landscapes can provide habitat for Indian peafowl.",

            "fun_fact":
                "The Indian peafowl is India's national bird and is famous for its elaborate courtship display.",

            "safety_note":
                "Observe birds quietly and avoid disturbing nests or breeding areas.",
        },

        {
            "name":
                "Rainbow Crest",

            "element":
                "Air",

            "rarity":
                "Epic",

            "tagline":
                "A living flash of monsoon colour.",

            "lore":
                "Rainbow Crest appears when monsoon clouds gather, carrying the colours of India's forests across the wind.",

            "abilities": [
                "Monsoon Dance",
                "Feather Flash",
                "Rain Call",
            ],

            "habitat":
                "Indian grasslands and woodland edges",
        },

    ),


    # -----------------------------------------------------
    # 3. MALABAR GLIDING FROG — MUNNAR
    # -----------------------------------------------------

    (
        10.0889,
        77.0595,
        "Munnar, Kerala",

        "/static/demo/gliding-frog.svg",

        "/static/demo/rain-glider.svg",

        {
            "kind":
                "animal",

            "common_name":
                "Malabar Gliding Frog",

            "scientific_name":
                "Rhacophorus malabaricus",

            "confidence":
                0.87,

            "taxon_group":
                "Amphibian",

            "native_status":
                "Native to the Western Ghats.",

            "conservation_note":
                "The Western Ghats contain important habitats for many endemic amphibians.",

            "fun_fact":
                "The Malabar gliding frog can use its webbed feet and skin flaps to glide between vegetation.",

            "safety_note":
                "Do not touch amphibians. Observe them without disturbing their habitat.",
        },

        {
            "name":
                "Rain Glider",

            "element":
                "Water",

            "rarity":
                "Rare",

            "tagline":
                "Born where the Western Ghats meet the monsoon.",

            "lore":
                "Rain Glider watches over hidden streams and rain-filled forest pools deep within the Western Ghats.",

            "abilities": [
                "Rain Leap",
                "Forest Ripple",
                "Monsoon Call",
            ],

            "habitat":
                "Western Ghats rainforest",
        },

    ),


    # -----------------------------------------------------
    # 4. COMMON MORMON — JAIPUR
    # -----------------------------------------------------

    (
        26.9124,
        75.7873,
        "Jaipur, Rajasthan",

        "/static/demo/common-mormon.svg",

        "/static/demo/bloom-wing.svg",

        {
            "kind":
                "animal",

            "common_name":
                "Common Mormon",

            "scientific_name":
                "Papilio polytes",

            "confidence":
                0.84,

            "taxon_group":
                "Insect",

            "native_status":
                "Common butterfly species found across parts of India.",

            "conservation_note":
                "Flower-rich gardens and native plants provide important resources for pollinators.",

            "fun_fact":
                "The Common Mormon butterfly is known for its striking variation in wing patterns.",

            "safety_note":
                "Photograph butterflies without capturing or handling them.",
        },

        {
            "name":
                "Bloom Wing",

            "element":
                "Bloom",

            "rarity":
                "Uncommon",

            "tagline":
                "A spark carried between India's flowers.",

            "lore":
                "Bloom Wing follows flowering trails across gardens and grasslands, carrying a tiny glow from bloom to bloom.",

            "abilities": [
                "Flower Trail",
                "Light Wing",
                "Pollinator Whisper",
            ],

            "habitat":
                "Indian gardens and flowering grasslands",
        },

    ),


    # -----------------------------------------------------
    # 5. INDIAN PALM SQUIRREL — MUMBAI
    # -----------------------------------------------------

    (
        19.0760,
        72.8777,
        "Mumbai, Maharashtra",

        "/static/demo/palm-squirrel.svg",

        "/static/demo/tree-runner.png",

        {
            "kind":
                "animal",

            "common_name":
                "Indian Palm Squirrel",

            "scientific_name":
                "Funambulus palmarum",

            "confidence":
                0.91,

            "taxon_group":
                "Mammal",

            "native_status":
                "Native Indian squirrel species.",

            "conservation_note":
                "Urban trees and green spaces can provide valuable habitat for small wildlife.",

            "fun_fact":
                "Indian palm squirrels are highly active and can adapt to many human-dominated environments.",

            "safety_note":
                "Do not feed wild squirrels or encourage them to approach people.",
        },

        {
            "name":
                "Tree Runner",

            "element":
                "Forest",

            "rarity":
                "Uncommon",

            "tagline":
                "The quick guardian of India's green spaces.",

            "lore":
                "Tree Runner moves between old trees and city gardens, remembering every hidden route through the canopy.",

            "abilities": [
                "Canopy Dash",
                "Seed Keeper",
                "Treebound Leap",
            ],

            "habitat":
                "Urban gardens and woodland edges",
        },

    ),


    # -----------------------------------------------------
    # 6. INDIAN GARDEN LIZARD — KOLKATA
    # -----------------------------------------------------

    (
        22.5726,
        88.3639,
        "Kolkata, West Bengal",

        "/static/demo/garden-lizard.svg",

        "/static/demo/sunscale.svg",

        {
            "kind":
                "animal",

            "common_name":
                "Indian Garden Lizard",

            "scientific_name":
                "Calotes versicolor",

            "confidence":
                0.88,

            "taxon_group":
                "Reptile",

            "native_status":
                "Common reptile found across much of India.",

            "conservation_note":
                "Small reptiles help maintain ecological balance by feeding on insects.",

            "fun_fact":
                "Indian garden lizards can change body colour and are often seen basking in sunlight.",

            "safety_note":
                "Never attempt to catch or handle a wild reptile.",
        },

        {
            "name":
                "Sunscale",

            "element":
                "Light",

            "rarity":
                "Rare",

            "tagline":
                "A keeper of warm stones and quiet gardens.",

            "lore":
                "Sunscale spends the morning gathering sunlight before disappearing into the green shadows.",

            "abilities": [
                "Solar Scale",
                "Stone Dash",
                "Heat Sense",
            ],

            "habitat":
                "Indian gardens and woodland edges",
        },

    ),

]


# =========================================================
# SEED DEMO DATA
# =========================================================

def seed_demo_data() -> None:

    with connect() as conn:

        count = conn.execute(
            """
            SELECT COUNT(*)
            FROM observations
            """
        ).fetchone()[0]


    # Do not duplicate demo data.

    if count:

        return


    for (
        latitude,
        longitude,
        locality,
        photo_url,
        creature_url,
        analysis,
        creature,
    ) in DEMO_SEED:

        insert_observation(

            latitude=latitude,

            longitude=longitude,

            locality=locality,

            photo_url=photo_url,

            creature_url=creature_url,

            analysis=analysis,

            creature=creature,

            is_demo=True,

        )