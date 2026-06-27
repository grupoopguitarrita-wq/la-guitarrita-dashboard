import { getGeneratorConfig, getGeneratorSecret, GENERATOR_TIMEOUT_MS } from "./config"
import type { ReportPayload } from "./types"

// ============================================================================
// Cliente HTTP del microservicio generador de DOCX.
// El servicio Python recibe el payload y devuelve el archivo (o lo sube a
// Storage y devuelve la ruta). Aquí solo orquestamos la llamada.
// ============================================================================

export interface GenerateResult {
  ok: boolean
  storagePath?: string
  fileName?: string
  fileSize?: number
  error?: string
  errorDetail?: unknown
}

/**
 * Solicita la generación del DOCX al microservicio.
 * Si el servicio no está configurado, devuelve ok:false con un error claro.
 */
export async function requestGeneration(payload: ReportPayload, auditId: string): Promise<GenerateResult> {
  const config = getGeneratorConfig()
  if (!config.configured || !config.baseUrl) {
    return { ok: false, error: "Servicio generador no configurado (falta REPORT_GENERATOR_URL)." }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GENERATOR_TIMEOUT_MS)
  try {
    const secret = getGeneratorSecret()
    const res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({ audit_id: auditId, payload }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return { ok: false, error: `El servicio respondió ${res.status}`, errorDetail: text.slice(0, 500) }
    }

    const data = (await res.json()) as {
      storage_path?: string
      file_name?: string
      file_size?: number
    }
    return {
      ok: true,
      storagePath: data.storage_path,
      fileName: data.file_name,
      fileSize: data.file_size,
    }
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError"
      ? "Tiempo de espera agotado al contactar el servicio generador."
      : e instanceof Error ? e.message : "Error desconocido al contactar el servicio."
    return { ok: false, error: msg }
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Verifica disponibilidad del servicio (health check).
 */
export async function checkServiceHealth(): Promise<{ healthy: boolean; message: string }> {
  const config = getGeneratorConfig()
  if (!config.configured || !config.baseUrl) {
    return { healthy: false, message: "Servicio generador no configurado." }
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/health`, { signal: controller.signal })
    return { healthy: res.ok, message: res.ok ? "Servicio operativo." : `Estado ${res.status}` }
  } catch {
    return { healthy: false, message: "No se pudo contactar el servicio generador." }
  } finally {
    clearTimeout(timeout)
  }
}
