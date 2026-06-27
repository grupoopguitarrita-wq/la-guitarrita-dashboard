// ============================================================================
// Tipos del sistema de generación de informes DOCX.
// El payload universal es el contrato entre Next.js (productor) y el
// microservicio Python (consumidor que rellena el template con docxtpl).
// ============================================================================

// Versión del template maestro actualmente soportado (SHA256 corto del .docx).
export const TEMPLATE_VERSION = "v2-9915e92f"
// Versión del contrato de payload / generador esperado.
export const GENERATOR_VERSION = "1.0.0"

export type ReportStatus =
  | "not_configured" // el microservicio generador no está disponible
  | "pending" // hay datos pero nunca se generó
  | "queued" // solicitud encolada
  | "generating" // en proceso
  | "available" // DOCX disponible para descargar
  | "stale" // los datos cambiaron desde la última generación
  | "failed" // la última generación falló
  | "invalid" // los datos no pasan validación (no se puede generar)

export type ValidationSeverity = "error" | "warning"

export interface ValidationIssue {
  code: string
  field: string
  message: string
  severity: ValidationSeverity
}

export interface ValidationResult {
  ok: boolean // true si no hay errores (warnings permitidos)
  issues: ValidationIssue[]
  errorCount: number
  warningCount: number
}

// --- Bloques del payload universal (alineados a los placeholders del template) ---

export interface ReportMeta {
  template_version: string
  generator_version: string
  source_hash: string
  generated_for_quarter: string
  generated_at_iso: string
}

export interface ReportHeader {
  local_nombre: string
  trimestre: string
  fecha_auditoria: string
  auditores: string
  fecha_emision: string
}

export interface ReportScore {
  global: number
  salon: number
  cocina: number
  calidad: number
  banda: string
  banda_rango: string
  riesgo: string
}

export interface ReportAreaDetail {
  area: string
  puntaje: number
  banda: string
  total_items: number
  cumple: number
  no_cumple: number
  excepcional: number
  observaciones: number
}

export interface ReportFinding {
  area: string
  categoria: string
  item: string
  resultado: string
  observacion: string
  foto_url: string
}

export interface ReportNetworkContext {
  promedio_red: number
  ranking_posicion: number
  ranking_total: number
  desviacion_vs_red: number
  mejor_local: string
  peor_local: string
}

export interface ReportEvolutionPoint {
  trimestre: string
  global: number | null
  salon: number | null
  cocina: number | null
  calidad: number | null
}

// Payload completo enviado al microservicio.
export interface ReportPayload {
  meta: ReportMeta
  header: ReportHeader
  score: ReportScore
  areas: ReportAreaDetail[]
  fortalezas: ReportFinding[]
  no_cumple: ReportFinding[]
  observaciones: ReportFinding[]
  contexto_red: ReportNetworkContext
  evolucion: ReportEvolutionPoint[]
  diagnostico: {
    situacion: string[]
    fortalezas: string[]
    riesgos: string[]
    acciones: string[]
  }
  accion_requerida: string
}

// Estado consolidado que consume la UI de Pizarra.
export interface ReportState {
  auditId: string
  locationId: string
  locationName: string
  quarter: string
  status: ReportStatus
  sourceHash: string
  currentHash: string // hash recalculado ahora (para detectar stale)
  storagePath: string | null
  fileName: string | null
  fileSize: number | null
  errorMessage: string | null
  generationCount: number
  completedAt: string | null
  updatedAt: string | null
  validation: ValidationResult
}
