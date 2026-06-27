"""
Microservicio generador de informes DOCX de auditorías trimestrales.

Recibe un payload universal (ver schema.py), renderiza el template maestro
con docxtpl, genera los gráficos con matplotlib, sube el DOCX al bucket privado
de Supabase Storage y devuelve la ruta + metadata.

NOTA DE DESPLIEGUE: este servicio NO corre dentro de v0. Se despliega por fuera
(contenedor Docker) y se conecta a la app Next.js mediante las variables:
  - REPORT_GENERATOR_URL  (en Next.js, apunta a este servicio)
  - REPORT_GENERATOR_TOKEN (secreto compartido para autenticar)
Ver README.md para el procedimiento completo.
"""
from __future__ import annotations

import logging
import os
import time

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse

from .schema import GenerateRequest, GenerateResponse
from .renderer import render_report
from .storage import upload_docx
from .version import GENERATOR_VERSION, TEMPLATE_VERSION

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("report-generator")

app = FastAPI(title="Auditorías - Generador de Informes DOCX", version=GENERATOR_VERSION)

SHARED_TOKEN = os.environ.get("REPORT_GENERATOR_TOKEN", "")


def _check_auth(authorization: str | None) -> None:
    if not SHARED_TOKEN:
        # Sin token configurado el servicio no debe aceptar peticiones.
        raise HTTPException(status_code=503, detail="Servicio sin token configurado")
    expected = f"Bearer {SHARED_TOKEN}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="No autorizado")


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "generator_version": GENERATOR_VERSION,
        "template_version": TEMPLATE_VERSION,
    }


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest, authorization: str | None = Header(default=None)) -> GenerateResponse:
    _check_auth(authorization)
    started = time.time()
    log.info("Generando informe audit_id=%s template=%s", req.payload.meta.audit_id, req.template_version)

    # Validación de compatibilidad de versión de template.
    if req.template_version and req.template_version != TEMPLATE_VERSION:
        log.warning("Template version mismatch: pedido %s, servicio %s", req.template_version, TEMPLATE_VERSION)

    try:
        docx_bytes, page_count = render_report(req.payload)
    except Exception as exc:  # noqa: BLE001
        log.exception("Fallo al renderizar")
        raise HTTPException(status_code=500, detail=f"Error de renderizado: {exc}") from exc

    storage_path = upload_docx(
        audit_id=req.payload.meta.audit_id,
        quarter=req.payload.meta.quarter,
        location_slug=req.payload.meta.location_slug,
        data=docx_bytes,
    )

    elapsed = round((time.time() - started) * 1000)
    log.info("Informe generado audit_id=%s en %sms -> %s", req.payload.meta.audit_id, elapsed, storage_path)

    return GenerateResponse(
        ok=True,
        storage_path=storage_path,
        file_size=len(docx_bytes),
        page_count=page_count,
        generator_version=GENERATOR_VERSION,
        template_version=TEMPLATE_VERSION,
        elapsed_ms=elapsed,
    )


@app.exception_handler(HTTPException)
def http_exc_handler(_, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"ok": False, "error": exc.detail})
