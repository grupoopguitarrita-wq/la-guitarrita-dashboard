# Generador de Informes DOCX — Microservicio

Servicio FastAPI que renderiza el **template maestro** de auditorías trimestrales
(`templates/template_maestro.docx`, versión `v2`) con [docxtpl], genera los
gráficos con matplotlib y sube el `.docx` resultante al bucket privado de
Supabase Storage.

> **Importante:** este servicio **no corre dentro de v0**. v0 generó todo el
> código, pero el contenedor debe desplegarse por fuera (Fly.io, Railway,
> Render, Cloud Run, una VM, etc.). Hasta que esté desplegado y conectado, la
> Pizarra mostrará el estado **"Servicio generador no configurado"** — que es el
> comportamiento esperado, no un error.

## Arquitectura

```
Pizarra (Next.js)
   │  POST /api/reports/[auditId]/generate
   ▼
Next.js API route  ──(arma payload universal + source_hash)──►  ESTE SERVICIO
   │                                                              │ docxtpl + matplotlib
   │ ◄──(storage_path, file_size, page_count, versiones)──────────┘ sube a Supabase Storage
   ▼
audit_generated_reports (estado: available)
```

## Variables de entorno del servicio

| Variable | Descripción |
| --- | --- |
| `REPORT_GENERATOR_TOKEN` | Secreto compartido. Debe coincidir con el de Next.js. |
| `SUPABASE_URL` | URL del proyecto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo backend, nunca en el cliente). |
| `REPORTS_BUCKET` | Bucket de Storage (default `audit-reports`). |
| `TEMPLATE_PATH` | Ruta al `.docx` (default `/app/templates/template_maestro.docx`). |
| `PORT` | Puerto HTTP (default `8080`). |

## Variables que debe tener la app Next.js (en v0 / Vercel)

| Variable | Descripción |
| --- | --- |
| `REPORT_GENERATOR_URL` | URL pública de este servicio (ej. `https://informes.midominio.com`). |
| `REPORT_GENERATOR_TOKEN` | Mismo secreto que arriba. |
| `SUPABASE_SERVICE_ROLE_KEY` | Para que las API routes firmen URLs de descarga del bucket privado. |

Cuando `REPORT_GENERATOR_URL` y `REPORT_GENERATOR_TOKEN` están presentes, la
Pizarra detecta el servicio como configurado y habilita "Generar informe".

## Desarrollo local

```bash
cd services/report-generator
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export REPORT_GENERATOR_TOKEN=dev-token
export SUPABASE_URL=...                # de tu proyecto
export SUPABASE_SERVICE_ROLE_KEY=...
uvicorn app.main:app --reload --port 8080
```

Probar salud:

```bash
curl localhost:8080/health
```

## Despliegue con Docker

```bash
docker build -t auditorias-report-generator .
docker run -p 8080:8080 \
  -e REPORT_GENERATOR_TOKEN=... \
  -e SUPABASE_URL=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  auditorias-report-generator
```

Luego, en Vercel/v0, configurá `REPORT_GENERATOR_URL` apuntando al host público
del contenedor y `REPORT_GENERATOR_TOKEN` con el mismo valor.

## Versionado del template

`app/version.py` define `TEMPLATE_VERSION = "v2"`. Debe coincidir con
`REPORT_TEMPLATE_VERSION` en `lib/reports/types.ts`. Si modificás el `.docx`,
subí ambas versiones: los informes ya generados quedarán marcados como
**"Desactualizado"** en la Pizarra y podrán regenerarse.

## Contrato del payload

El cuerpo de `POST /generate` es `{ payload, template_version, generator_version }`.
El `payload` sigue `app/schema.py`, que es el reflejo en Python de
`ReportPayload` en `lib/reports/types.ts`. Mantené ambos archivos sincronizados.

[docxtpl]: https://docxtpl.readthedocs.io/
