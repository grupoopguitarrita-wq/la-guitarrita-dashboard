// Etiquetas en español, colores y helpers de presentación para el Análisis cruzado.
import type {
  CrossAnalysisTheme,
  CrossPriority,
  SourceAgreement,
  CrossTrend,
  ClosureStatus,
  ConfidenceLevel,
  RiskLevel,
} from "./types"

export const THEME_LABELS: Record<CrossAnalysisTheme, string> = {
  shelf_life: "Vida útil y vencimientos",
  traceability: "Trazabilidad y rotulado",
  deep_cleaning: "Limpieza profunda",
  cold_chain_equipment: "Frío, cámaras y equipos",
  product_standardization: "Producto y estandarización",
  sin_tacc: "SIN TACC",
  infrastructure_brand_image: "Infraestructura e imagen",
  stock_availability: "Stock y disponibilidad",
  brand_procedures: "Marca y procedimientos",
  management_closure: "Gestión y capacidad de cierre",
}

export const THEME_ORDER: CrossAnalysisTheme[] = [
  "shelf_life",
  "traceability",
  "deep_cleaning",
  "cold_chain_equipment",
  "product_standardization",
  "sin_tacc",
  "infrastructure_brand_image",
  "stock_availability",
  "brand_procedures",
  "management_closure",
]

export const THEME_SHORT: Record<CrossAnalysisTheme, string> = {
  shelf_life: "Vida útil",
  traceability: "Trazabilidad",
  deep_cleaning: "Limpieza",
  cold_chain_equipment: "Frío/equipos",
  product_standardization: "Producto",
  sin_tacc: "SIN TACC",
  infrastructure_brand_image: "Infraestructura",
  stock_availability: "Stock",
  brand_procedures: "Marca/proc.",
  management_closure: "Gestión/cierre",
}

export const PRIORITY_LABELS: Record<CrossPriority, string> = {
  urgent: "Intervención urgente",
  high: "Prioridad alta",
  focused: "Seguimiento focalizado",
  consolidation: "Consolidación",
  insufficient_data: "Datos insuficientes",
}

// Clases Tailwind por prioridad (badge con texto, no solo color).
export const PRIORITY_CLASSES: Record<CrossPriority, string> = {
  urgent: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  focused: "bg-amber-50 text-amber-700 border-amber-200",
  consolidation: "bg-emerald-50 text-emerald-700 border-emerald-200",
  insufficient_data: "bg-gray-100 text-gray-600 border-gray-200",
}

// Color de relleno (para puntos del scatter).
export const PRIORITY_FILL: Record<CrossPriority, string> = {
  urgent: "#dc2626",
  high: "#ea580c",
  focused: "#d97706",
  consolidation: "#059669",
  insufficient_data: "#9ca3af",
}

export const AGREEMENT_LABELS: Record<SourceAgreement, string> = {
  very_high_confirmation: "Confirmación muy alta",
  high_confirmation: "Confirmación alta",
  partial_high_confirmation: "Confirmación parcial alta",
  partial_confirmation: "Confirmación parcial",
  relevant_divergence: "Divergencia relevante",
  confirmed_improvement: "Mejora confirmada",
  partial_positive_confirmation: "Confirmación parcial positiva",
  insufficient_evidence: "Evidencia insuficiente",
}

export const TREND_LABELS: Record<CrossTrend, string> = {
  persistent: "Persistente",
  deteriorating: "En deterioro",
  partial_improvement: "Mejora parcial",
  gradual_improvement_without_close: "Mejora gradual sin cierre",
  confirmed_recovery: "Recuperación confirmada",
  stable_with_specific_risk: "Estable con riesgo puntual",
  intermittent: "Intermitente",
  insufficient_follow_up: "Seguimiento insuficiente",
}

export const CLOSURE_LABELS: Record<ClosureStatus, string> = {
  confirmed_closed: "Cierre confirmado",
  sustained_improvement: "Mejora sostenida",
  partial_improvement: "Mejora parcial",
  persistent: "Persistencia",
  reappeared: "Reaparición",
  immediate_persistence_after_q2: "Persistencia inmediata posterior",
  insufficient_post_audit_evidence: "Evidencia posterior insuficiente",
  not_evaluable: "No evaluable",
}

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: "Alta",
  medium_high: "Media-alta",
  medium: "Media",
  low: "Baja",
}

export const CONFIDENCE_CLASSES: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium_high: "bg-teal-50 text-teal-700 border-teal-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-red-50 text-red-700 border-red-200",
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Bajo",
  moderate: "Moderado",
  high: "Alto",
  critical: "Crítico",
  insufficient_data: "Sin datos",
}

export const RISK_CLASSES: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800",
  moderate: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
  insufficient_data: "bg-gray-100 text-gray-500",
}

// Cuadrante de la matriz Q2 vs incidencia diaria.
export function quadrant(global: number, incidence: number): string {
  const highIncidence = incidence >= 50
  const highScore = global >= 86
  if (highScore && highIncidence) return "Riesgo oculto"
  if (!highScore && highIncidence) return "Riesgo sistémico"
  if (!highScore && !highIncidence) return "Deterioro focalizado"
  return "Operación sólida o recuperación"
}

export function formatPct(n: number): string {
  return `${n.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

export function formatVar(n: number): string {
  if (n > 0) return `+${n}`
  return `${n}`
}
