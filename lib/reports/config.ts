// ============================================================================
// Configuración y detección del microservicio generador de informes.
// El servicio Python (FastAPI + docxtpl) vive FUERA de v0 y se despliega aparte.
// Mientras no esté configurado, Pizarra muestra "Servicio generador no configurado".
// ============================================================================

export interface GeneratorServiceConfig {
  configured: boolean
  baseUrl: string | null
  hasSecret: boolean
}

/**
 * Lee la configuración del servicio generador desde variables de entorno.
 * - REPORT_GENERATOR_URL: URL base del microservicio (p. ej. https://reports.midominio.com)
 * - REPORT_GENERATOR_SECRET: token compartido para autenticar las llamadas.
 *
 * Si falta la URL, el sistema se considera NO configurado y la UI lo refleja
 * sin simular descargas ni estados falsos.
 */
export function getGeneratorConfig(): GeneratorServiceConfig {
  const baseUrl = process.env.REPORT_GENERATOR_URL?.trim() || null
  const secret = process.env.REPORT_GENERATOR_SECRET?.trim() || null
  return {
    configured: Boolean(baseUrl),
    baseUrl,
    hasSecret: Boolean(secret),
  }
}

export function getGeneratorSecret(): string | null {
  return process.env.REPORT_GENERATOR_SECRET?.trim() || null
}

// Nombre del bucket de Storage donde el servicio sube los DOCX.
export const REPORTS_BUCKET = "audit-reports"

// Timeout para llamadas al microservicio (ms).
export const GENERATOR_TIMEOUT_MS = 15_000
