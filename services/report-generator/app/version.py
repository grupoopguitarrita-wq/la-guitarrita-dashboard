"""Versiones del generador y del template maestro.

TEMPLATE_VERSION debe coincidir con REPORT_TEMPLATE_VERSION en la app Next.js
(lib/reports/types.ts). Si cambia el .docx, suba este número y el de Next.js
para que los informes existentes se marquen como 'Desactualizado'.
"""

GENERATOR_VERSION = "1.0.0"
TEMPLATE_VERSION = "v2"

# SHA256 del template maestro embebido (TEMPLATE_MAESTRO_AUDITORIAS_TRIMESTRALES_v2).
# Sirve para verificar en el arranque que el .docx no fue alterado.
TEMPLATE_SHA256 = "9915e92f"  # prefijo; ver README para el hash completo
