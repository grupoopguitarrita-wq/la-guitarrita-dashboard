// Tipos del Análisis cruzado Q2 2026. Fotografía editorial estática:
// no se consulta Supabase ni Drive desde esta capa.

export type CrossAnalysisTheme =
  | "shelf_life"
  | "traceability"
  | "deep_cleaning"
  | "cold_chain_equipment"
  | "product_standardization"
  | "sin_tacc"
  | "infrastructure_brand_image"
  | "stock_availability"
  | "brand_procedures"
  | "management_closure"

export type CrossPriority =
  | "urgent"
  | "high"
  | "focused"
  | "consolidation"
  | "insufficient_data"

export type SourceAgreement =
  | "very_high_confirmation"
  | "high_confirmation"
  | "partial_high_confirmation"
  | "partial_confirmation"
  | "relevant_divergence"
  | "confirmed_improvement"
  | "partial_positive_confirmation"
  | "insufficient_evidence"

export type CrossTrend =
  | "persistent"
  | "deteriorating"
  | "partial_improvement"
  | "gradual_improvement_without_close"
  | "confirmed_recovery"
  | "stable_with_specific_risk"
  | "intermittent"
  | "insufficient_follow_up"

export type ClosureStatus =
  | "confirmed_closed"
  | "sustained_improvement"
  | "partial_improvement"
  | "persistent"
  | "reappeared"
  | "immediate_persistence_after_q2"
  | "insufficient_post_audit_evidence"
  | "not_evaluable"

export type ConfidenceLevel = "high" | "medium_high" | "medium" | "low"

export type RiskLevel = "low" | "moderate" | "high" | "critical" | "insufficient_data"

export type CrossAnalysisSnapshot = {
  snapshotId: string
  status: "editorial_validated"
  quarter: "Q2"
  year: 2026
  cutoffDate: string
  filloutFrom: string
  filloutTo: string
  networkSize: number
  auditedLocations: number
  analyzedReports: number
  filloutVisits: number
  scoredVisits: number
  productTests: number
  methodologyVersion: string
}

export type MonthlyTriple = {
  abril: number
  mayo: number
  junio: number
}

export type CrossAnalysisLocation = {
  id: string
  name: string
  quarterlyAudit: {
    global: number
    salon: number
    cocina: number
    calidad: number
    critical: number
    nonCompliant: number
    variations: {
      global: number
      salon: number
      cocina: number
      calidad: number
    }
  }
  fillout: {
    visits: number
    averageStars: number
    productTests: number
    productCoverage: number
    expiredVisits: number
    traceabilityVisits: number
    cleaningVisits: number
    qualityHygieneVisits: number
    stockoutVisits: number
  }
  // Mayor incidencia diaria observada (eje Y de la matriz) y su tema.
  topDailyIncidence: number
  topIncidenceTheme: "Trazabilidad" | "Limpieza"
  // Serie mensual usada en Seguimiento (vencimientos salvo Tigre: trazabilidad).
  monthlySeries: MonthlyTriple
  monthlySeriesLabel: string
  priority: CrossPriority
  sourceAgreement: SourceAgreement
  trend: CrossTrend
  closure: ClosureStatus
  confidence: ConfidenceLevel
  executiveProfile: string
  managementReading: string
  dominantRisk: string
  q2Findings: string[]
  filloutEvidence: string[]
  postAuditEvidence: string[]
  immediateActions: string[]
  sevenDayActions: string[]
  thirtyDayActions: string[]
  riskDimensions: Record<CrossAnalysisTheme, RiskLevel>
  methodologyNotes: string[]
}

// Estados de los locales aún sin análisis cruzado.
export type PendingLocation = {
  name: string
  state: "report_pending" | "audit_pending"
}

export type NetworkTheme = {
  theme: CrossAnalysisTheme
  negativeResponses: number | null
  percentage: number | null
  topLocations: string[]
  risks?: string[]
  actions?: string[]
  note?: string
}

export type NetworkMetrics = {
  coverage: {
    analyzedReports: number
    auditedQ2: number
    networkTotal: number
    filloutVisits: number
    scoredVisits: number
    nonScoredVisits: number
    productTestVisits: number
  }
  q2Averages: { global: number; salon: number; cocina: number; calidad: number }
  q2Composition: { critical: number; nonCompliant: number; totalNegative: number; locationsWithCritical: number; totalAnalyzed: number }
  groupings: {
    traceabilitySignals: { count: number; percentage: number }
    cleaningSignals: { count: number; percentage: number }
    anySignal: { count: number; percentage: number }
  }
}
