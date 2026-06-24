export type RatingValue = 2 | 1 | 0 | -1 | -2

export type RatingOption = {
  value: RatingValue
  label: string
  icon: string
  requiresObservation: boolean
  requiresPhoto: boolean
}

export const RATING_OPTIONS: RatingOption[] = [
  { value: 2, label: 'Excepcional', icon: '⭐', requiresObservation: false, requiresPhoto: false },
  { value: 1, label: 'Cumple', icon: '✅', requiresObservation: false, requiresPhoto: false },
  { value: 0, label: 'No auditable', icon: '0', requiresObservation: false, requiresPhoto: false },
  { value: -1, label: 'No cumple', icon: '⚠️', requiresObservation: true, requiresPhoto: false },
  { value: -2, label: 'Crítico', icon: '🚨', requiresObservation: true, requiresPhoto: true },
]

export type ItemSuggestions = {
  [key in RatingValue]?: string
}

export type AuditItem = {
  id: string
  label: string
  description?: string
  suggestions?: ItemSuggestions
  isTextField?: boolean
  isCustomLabel?: boolean
  groupHeader?: string
}

export type AuditCategory = {
  id: string
  label: string
  weight: number
  items: AuditItem[]
}

export type AuditArea = {
  id: string
  label: string
  categories: AuditCategory[]
}

export type AuditStructure = {
  areas: AuditArea[]
}

export type ItemResponse = {
  value: RatingValue | null
  observation: string
  /** @deprecated Use photoUrls instead. Kept for backward compatibility */
  photoUrl: string | null
  /** Array of photo URLs - supports multiple photos per item */
  photoUrls: string[]
  customLabel: string
  textValue: string
}

/**
 * Helper to get all photos from a response (handles backward compatibility)
 */
export function getResponsePhotos(response: ItemResponse): string[] {
  // If photoUrls exists and has items, use it
  if (response.photoUrls && response.photoUrls.length > 0) {
    return response.photoUrls
  }
  // Fallback to single photoUrl for backward compatibility
  if (response.photoUrl) {
    return [response.photoUrl]
  }
  return []
}

export type AuditResponses = {
  [itemId: string]: ItemResponse
}

export type AuditQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export type AuditMetadata = {
  locationId: string
  locationName: string
  /** @deprecated Use auditorNames instead. Kept for backward compatibility */
  auditorName: string
  /** Array of auditor names - supports multiple auditors per audit */
  auditorNames: string[]
  auditDate: string
  auditQuarter: AuditQuarter
}

/**
 * Helper to get all auditor names from metadata (handles backward compatibility)
 */
export function getAuditorNames(metadata: AuditMetadata): string[] {
  if (metadata.auditorNames && metadata.auditorNames.length > 0) {
    return metadata.auditorNames
  }
  if (metadata.auditorName) {
    return [metadata.auditorName]
  }
  return []
}

/**
 * Helper to get display string for auditors
 */
export function getAuditorDisplayString(metadata: AuditMetadata): string {
  const names = getAuditorNames(metadata)
  return names.join(', ')
}

export type AreaStatus = 'pendiente' | 'en_progreso' | 'completada'

export type AreaProgress = {
  areaId: string
  status: AreaStatus
  score: number | null
}

export const AUDITOR_OPTIONS = [
  'CARLOS',
  'GABRIEL',
  'DIEGO',
  'CHRISTIAN',
  'FACUNDO',
  'AUDITOR 1',
  'AUDITOR 2',
] as const

export const QUARTER_OPTIONS: AuditQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4']

export type CategoryScore = {
  categoryId: string
  label: string
  points: number
  maxPossible: number
  percentage: number
  weight: number
}

export type AreaScore = {
  areaId: string
  label: string
  percentage: number
  categoryScores: CategoryScore[]
}

export type GlobalScores = {
  salon: number
  cocina: number
  calidad: number
  global: number
  globalLabel: string
}

export function getGlobalLabel(score: number): string {
  if (score >= 90) return 'Excelente'
  if (score >= 80) return 'Óptimo'
  if (score >= 70) return 'Aceptable'
  return 'Requiere acción'
}

export function getRatingLabel(value: RatingValue): string {
  const option = RATING_OPTIONS.find(o => o.value === value)
  return option?.label ?? ''
}
