import { createHash } from "crypto"
import { TEMPLATE_VERSION, GENERATOR_VERSION } from "./types"

// ============================================================================
// Hash determinístico del payload de origen.
// Si cambian los datos de la auditoría, el template o el generador, el hash
// cambia y el informe previamente generado queda marcado como "stale".
// ============================================================================

/**
 * Serializa un objeto de forma estable (claves ordenadas) para que el hash
 * sea reproducible sin importar el orden de inserción de propiedades.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]"
  }
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}"
}

/**
 * Calcula el source_hash a partir de los datos relevantes de la auditoría.
 * Incluye versiones de template/generador para invalidar informes cuando
 * cambian las plantillas, no solo los datos.
 */
export function computeSourceHash(input: {
  auditId: string
  quarter: string
  scores: { global: number; salon: number; cocina: number; calidad: number }
  // Respuestas normalizadas (item_id + rating + observación + foto).
  responses: { itemId: string; rating: number | null; observation: string | null; photoUrl: string | null }[]
  auditDate: string
  auditors: string[]
}): string {
  // Ordenamos las respuestas por item_id para estabilidad.
  const sortedResponses = [...input.responses].sort((a, b) => a.itemId.localeCompare(b.itemId))
  const canonical = stableStringify({
    template: TEMPLATE_VERSION,
    generator: GENERATOR_VERSION,
    auditId: input.auditId,
    quarter: input.quarter,
    scores: input.scores,
    auditDate: input.auditDate,
    auditors: [...input.auditors].sort(),
    responses: sortedResponses,
  })
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32)
}
