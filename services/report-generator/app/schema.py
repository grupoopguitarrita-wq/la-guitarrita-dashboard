"""Modelos Pydantic del payload universal. Debe mantenerse en paralelo con
lib/reports/types.ts en la app Next.js."""
from __future__ import annotations

from pydantic import BaseModel, Field


class Meta(BaseModel):
    audit_id: str
    quarter: str
    location_id: str
    location_name: str
    location_slug: str
    auditor_names: list[str] = Field(default_factory=list)
    audit_date: str | None = None
    generated_at: str | None = None
    source_hash: str


class Scores(BaseModel):
    salon: float | None = None
    cocina: float | None = None
    calidad: float | None = None
    global_score: float | None = Field(default=None, alias="global")

    class Config:
        populate_by_name = True


class Finding(BaseModel):
    area_label: str
    category_label: str
    item_id: str
    item_label: str
    rating_value: int | None = None
    rating_label: str | None = None
    observation: str | None = None
    photo_url: str | None = None


class CategoryScore(BaseModel):
    area_label: str
    category_label: str
    score: float | None = None
    items_evaluated: int = 0


class QuarterPoint(BaseModel):
    quarter: str
    global_score: float | None = Field(default=None, alias="global")
    salon: float | None = None
    cocina: float | None = None
    calidad: float | None = None

    class Config:
        populate_by_name = True


class NetworkContext(BaseModel):
    avg_global: float | None = None
    avg_salon: float | None = None
    avg_cocina: float | None = None
    avg_calidad: float | None = None
    rank: int | None = None
    total_ranked: int | None = None
    coverage: float | None = None


class Payload(BaseModel):
    meta: Meta
    scores: Scores
    band_label: str
    band_range: str
    risk_level: str | None = None
    required_action: str | None = None
    summary_strengths: int = 0
    summary_fails: int = 0
    summary_observations: int = 0
    category_scores: list[CategoryScore] = Field(default_factory=list)
    findings: list[Finding] = Field(default_factory=list)
    evolution: list[QuarterPoint] = Field(default_factory=list)
    network: NetworkContext = Field(default_factory=NetworkContext)
    narrative: dict[str, str] = Field(default_factory=dict)


class GenerateRequest(BaseModel):
    payload: Payload
    template_version: str | None = None
    generator_version: str | None = None


class GenerateResponse(BaseModel):
    ok: bool
    storage_path: str
    file_size: int
    page_count: int
    generator_version: str
    template_version: str
    elapsed_ms: int
