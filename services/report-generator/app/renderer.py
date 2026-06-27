"""Renderiza el template maestro DOCX con docxtpl a partir del payload.

Mapea las claves del payload universal a los 210 placeholders {{MAYUSCULAS}}
del template, genera los gráficos (radar de áreas, barras de categorías,
línea de evolución) con matplotlib y los inserta como imágenes.
"""
from __future__ import annotations

import io
import os
from pathlib import Path

import matplotlib

matplotlib.use("Agg")  # backend sin display, obligatorio en contenedor
import matplotlib.pyplot as plt  # noqa: E402
from docx.shared import Mm  # noqa: E402
from docxtpl import DocxTemplate, InlineImage  # noqa: E402

from .schema import Payload  # noqa: E402

TEMPLATE_PATH = Path(os.environ.get("TEMPLATE_PATH", "/app/templates/template_maestro.docx"))

# Paleta institucional (coincide con la Pizarra).
BAND_COLORS = {
    "Excelencia": "#1D4ED8",
    "Satisfactorio": "#16A34A",
    "En alerta": "#D97706",
    "Crítico": "#DC2626",
}
BRAND = "#B5123F"


def _fmt(v: float | None, dash: str = "Sin dato") -> str:
    return dash if v is None else f"{round(v)}"


def _radar_chart(payload: Payload) -> io.BytesIO:
    labels = ["Salón", "Cocina", "Calidad"]
    vals = [payload.scores.salon or 0, payload.scores.cocina or 0, payload.scores.calidad or 0]
    net = [
        payload.network.avg_salon or 0,
        payload.network.avg_cocina or 0,
        payload.network.avg_calidad or 0,
    ]
    import numpy as np

    angles = np.linspace(0, 2 * np.pi, len(labels), endpoint=False).tolist()
    vals += vals[:1]
    net += net[:1]
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(4, 4), subplot_kw=dict(polar=True))
    ax.plot(angles, vals, color=BRAND, linewidth=2, label="Local")
    ax.fill(angles, vals, color=BRAND, alpha=0.15)
    ax.plot(angles, net, color="#9CA3AF", linewidth=1.5, linestyle="--", label="Red")
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels)
    ax.set_ylim(0, 100)
    ax.legend(loc="upper right", bbox_to_anchor=(1.2, 1.1), fontsize=8)
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


def _evolution_chart(payload: Payload) -> io.BytesIO | None:
    pts = [p for p in payload.evolution if p.global_score is not None]
    if len(pts) < 2:
        return None
    xs = [p.quarter for p in pts]
    ys = [p.global_score for p in pts]
    fig, ax = plt.subplots(figsize=(5, 2.8))
    ax.plot(xs, ys, color=BRAND, marker="o", linewidth=2)
    for x, y in zip(xs, ys):
        ax.annotate(f"{round(y)}", (x, y), textcoords="offset points", xytext=(0, 8), fontsize=8, ha="center")
    ax.set_ylim(0, 100)
    ax.grid(axis="y", alpha=0.3)
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


def _categories_chart(payload: Payload) -> io.BytesIO | None:
    cats = [c for c in payload.category_scores if c.score is not None]
    if not cats:
        return None
    cats = sorted(cats, key=lambda c: c.score or 0)
    labels = [f"{c.category_label}" for c in cats]
    vals = [c.score for c in cats]
    fig, ax = plt.subplots(figsize=(5, max(2.5, len(cats) * 0.35)))
    colors = [BRAND if (v or 0) < 76 else "#16A34A" for v in vals]
    ax.barh(labels, vals, color=colors)
    ax.set_xlim(0, 100)
    ax.tick_params(axis="y", labelsize=7)
    fig.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf


def render_report(payload: Payload) -> tuple[bytes, int]:
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"Template no encontrado en {TEMPLATE_PATH}")

    doc = DocxTemplate(str(TEMPLATE_PATH))

    # Contexto de placeholders de texto (subset representativo de los 210).
    m = payload.meta
    ctx: dict = {
        "TRIMESTRE": m.quarter,
        "NOMBRE_LOCAL": m.location_name,
        "AUDITORES": ", ".join(m.auditor_names) or "Sin asignar",
        "FECHA_AUDITORIA": m.audit_date or "Sin fecha",
        "FECHA_GENERACION": m.generated_at or "",
        "PUNTAJE_GLOBAL": _fmt(payload.scores.global_score),
        "PUNTAJE_SALON": _fmt(payload.scores.salon),
        "PUNTAJE_COCINA": _fmt(payload.scores.cocina),
        "PUNTAJE_CALIDAD": _fmt(payload.scores.calidad),
        "BANDA": payload.band_label,
        "BANDA_RANGO": payload.band_range,
        "NIVEL_RIESGO": payload.risk_level or "Sin determinar",
        "ACCION_REQUERIDA": payload.required_action or "Sin acciones críticas",
        "TOTAL_FORTALEZAS": str(payload.summary_strengths),
        "TOTAL_NO_CUMPLE": str(payload.summary_fails),
        "TOTAL_OBSERVACIONES": str(payload.summary_observations),
        "PROMEDIO_RED": _fmt(payload.network.avg_global),
        "RANKING": f"{payload.network.rank or '-'} de {payload.network.total_ranked or '-'}",
        "COBERTURA": _fmt(payload.network.coverage, "—") + "%",
        # Narrativa (textos largos prearmados en Next.js).
        "RESUMEN_EJECUTIVO": payload.narrative.get("executive", ""),
        "DIAGNOSTICO": payload.narrative.get("diagnosis", ""),
        "RECOMENDACIONES": payload.narrative.get("recommendations", ""),
        # Listas iterables para {% for %} en el template.
        "FINDINGS": [f.model_dump() for f in payload.findings],
        "CATEGORIES": [c.model_dump() for c in payload.category_scores],
        "EVOLUTION": [p.model_dump(by_alias=True) for p in payload.evolution],
    }

    # Gráficos como imágenes embebidas.
    ctx["GRAFICO_RADAR"] = InlineImage(doc, _radar_chart(payload), width=Mm(90))
    evo = _evolution_chart(payload)
    if evo is not None:
        ctx["GRAFICO_EVOLUCION"] = InlineImage(doc, evo, width=Mm(120))
    cat = _categories_chart(payload)
    if cat is not None:
        ctx["GRAFICO_CATEGORIAS"] = InlineImage(doc, cat, width=Mm(120))

    doc.render(ctx)

    out = io.BytesIO()
    doc.save(out)
    out.seek(0)
    data = out.read()

    # Conteo aproximado de páginas (docx no expone páginas; estimación por saltos).
    page_count = max(1, data.count(b"w:type=\"page\"") + 1)
    return data, page_count
