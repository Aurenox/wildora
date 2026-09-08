from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass
class SpeciesAnalysis:
    kind: str
    common_name: str
    scientific_name: str
    confidence: float
    taxon_group: str
    native_status: str
    conservation_note: str
    fun_fact: str
    safety_note: str
    habitat_hint: str = ""
    ecological_role: str = ""
    observation_quality: str = ""


@dataclass
class Creature:
    name: str
    element: str
    rarity: str
    tagline: str
    lore: str
    abilities: list[str]
    habitat: str


@dataclass
class Observation:
    id: int
    created_at: str
    latitude: float | None
    longitude: float | None
    locality: str
    photo_url: str
    creature_url: str | None
    analysis: SpeciesAnalysis
    creature: Creature | None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)