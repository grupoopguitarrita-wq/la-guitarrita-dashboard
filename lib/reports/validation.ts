import type { ReportPayload, ValidationIssue, ValidationResult } from "./types"

// ============================================================================
// Validación del payload antes de permitir la generación del DOCX.
// Errores => bloquean la generación. Warnings => permiten generar pero avisan.
// ============================================================================

export function validatePayload(p: ReportPayload): ValidationResult {
  const issues: ValidationIssue[] = []

  const err = (code: string, field: string, message: string) =>
    issues.push({ code, field, message, severity: "error" })
  const warn = (code: string, field: string, message: string) =>
    issues.push({ code, field, message, severity: "warning" })

  // --- Encabezado ---
  if (!p.header.local_nombre?.trim()) err("HEADER_LOCAL", "header.local_nombre", "Falta el nombre del local.")
  if (!p.header.trimestre?.trim()) err("HEADER_TRIMESTRE", "header.trimestre", "Falta el trimestre.")
  if (!p.header.auditores?.trim()) warn("HEADER_AUDITORES", "header.auditores", "No se registran auditores para esta auditoría.")
  if (!p.header.fecha_auditoria?.trim()) warn("HEADER_FECHA", "header.fecha_auditoria", "Falta la fecha de auditoría.")

  // --- Puntajes ---
  const scores: [string, number][] = [
    ["global", p.score.global],
    ["salon", p.score.salon],
    ["cocina", p.score.cocina],
    ["calidad", p.score.calidad],
  ]
  for (const [name, v] of scores) {
    if (v === null || v === undefined || Number.isNaN(v)) {
      err("SCORE_MISSING", `score.${name}`, `Falta el puntaje de ${name}.`)
    } else if (v < 0 || v > 100) {
      err("SCORE_RANGE", `score.${name}`, `El puntaje de ${name} (${v}) está fuera de rango 0-100.`)
    }
  }

  // --- Áreas ---
  if (!p.areas || p.areas.length === 0) {
    warn("AREAS_EMPTY", "areas", "No hay detalle por área disponible.")
  } else {
    for (const a of p.areas) {
      const suma = a.cumple + a.no_cumple + a.excepcional
      if (a.total_items > 0 && suma > a.total_items) {
        warn("AREA_COUNTS", `areas.${a.area}`, `Los conteos del área ${a.area} superan el total de ítems.`)
      }
    }
  }

  // --- Hallazgos: coherencia entre puntaje crítico y ausencia de no-cumple ---
  if (p.score.global < 76 && p.no_cumple.length === 0) {
    warn("FINDINGS_COHERENCE", "no_cumple", "Puntaje en banda baja pero sin ítems 'no cumple' registrados.")
  }

  // --- Meta ---
  if (!p.meta.source_hash) err("META_HASH", "meta.source_hash", "Falta el source_hash del payload.")
  if (!p.meta.template_version) err("META_TEMPLATE", "meta.template_version", "Falta la versión del template.")

  // --- Contexto de red ---
  if (p.contexto_red.ranking_total > 0 && p.contexto_red.ranking_posicion > p.contexto_red.ranking_total) {
    warn("RANKING_INVALID", "contexto_red", "La posición de ranking supera el total de locales.")
  }

  const errorCount = issues.filter((i) => i.severity === "error").length
  const warningCount = issues.filter((i) => i.severity === "warning").length
  return { ok: errorCount === 0, issues, errorCount, warningCount }
}
