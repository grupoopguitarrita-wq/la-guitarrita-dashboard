FROM python:3.12-slim

# LibreOffice se incluye por si en el futuro se exporta a PDF; docxtpl no lo
# requiere para generar el .docx en sí.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer-nogui \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY templates ./templates

ENV TEMPLATE_PATH=/app/templates/template_maestro.docx
ENV PORT=8080

EXPOSE 8080
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
