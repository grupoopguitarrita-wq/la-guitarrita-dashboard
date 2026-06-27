"""Sube el DOCX generado al bucket privado de Supabase Storage."""
from __future__ import annotations

import os
from datetime import datetime

from supabase import create_client

BUCKET = os.environ.get("REPORTS_BUCKET", "audit-reports")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
# Service role key: SOLO en el backend del servicio, nunca expuesta al cliente.
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def upload_docx(audit_id: str, quarter: str, location_slug: str, data: bytes) -> str:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")

    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    path = f"{quarter}/{location_slug}/{audit_id}-{ts}.docx"

    client.storage.from_(BUCKET).upload(
        path=path,
        file=data,
        file_options={"content-type": _CONTENT_TYPE, "upsert": "true"},
    )
    return path
