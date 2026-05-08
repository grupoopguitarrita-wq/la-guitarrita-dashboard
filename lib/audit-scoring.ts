import type {
  AuditResponses,
  CategoryScore,
  AreaScore,
  GlobalScores,
  RatingValue,
} from '@/types/audit'
import { getGlobalLabel } from '@/types/audit'
import { AUDIT_STRUCTURE } from '@/data/audit-structure'

/**
 * Calculate score percentage using the formula:
 * % = (points + max_possible) / (2 * max_possible) * 100
 *
 * Rules:
 * - Exclude items with value = 0 from calculation
 * - Ignore text-only items
 * - Ignore items with no response
 * - Round to integer
 */
export function calculatePercentage(points: number, maxPossible: number): number {
  if (maxPossible === 0) return 0
  const percentage = ((points + maxPossible) / (2 * maxPossible)) * 100
  return Math.round(percentage)
}

/**
 * Calculate score for a single category
 */
export function calculateCategoryScore(
  categoryId: string,
  areaId: string,
  responses: AuditResponses
): CategoryScore | null {
  const area = AUDIT_STRUCTURE.areas.find((a) => a.id === areaId)
  if (!area) return null

  const category = area.categories.find((c) => c.id === categoryId)
  if (!category) return null

  let points = 0
  let maxPossible = 0
  let validItems = 0

  for (const item of category.items) {
    // Skip text-only items
    if (item.isTextField) continue

    const response = responses[item.id]
    if (!response || response.value === null || response.value === undefined) continue

    // Skip items marked as "no auditable" (value = 0)
    if (response.value === 0) continue

    // For custom label items, skip if no custom label is set
    if (item.isCustomLabel && !response.customLabel) continue

    points += response.value
    maxPossible += 2 // Max possible per item is 2
    validItems++
  }

  const percentage = calculatePercentage(points, maxPossible)

  return {
    categoryId,
    label: category.label,
    points,
    maxPossible,
    percentage,
    weight: category.weight,
  }
}

/**
 * Calculate weighted area score
 */
export function calculateAreaScore(
  areaId: string,
  responses: AuditResponses
): AreaScore | null {
  const area = AUDIT_STRUCTURE.areas.find((a) => a.id === areaId)
  if (!area) return null

  const categoryScores: CategoryScore[] = []
  let weightedSum = 0
  let totalWeight = 0

  for (const category of area.categories) {
    const categoryScore = calculateCategoryScore(category.id, areaId, responses)
    if (categoryScore) {
      categoryScores.push(categoryScore)

      // Only include in weighted calculation if there are valid items
      if (categoryScore.maxPossible > 0) {
        weightedSum += categoryScore.percentage * categoryScore.weight
        totalWeight += categoryScore.weight
      }
    }
  }

  const percentage = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

  return {
    areaId,
    label: area.label,
    percentage,
    categoryScores,
  }
}

/**
 * Calculate all global scores
 */
export function calculateGlobalScores(responses: AuditResponses): GlobalScores {
  const salonScore = calculateAreaScore('salon', responses)
  const cocinaScore = calculateAreaScore('cocina', responses)
  const calidadScore = calculateAreaScore('calidad', responses)

  const salon = salonScore?.percentage ?? 0
  const cocina = cocinaScore?.percentage ?? 0
  const calidad = calidadScore?.percentage ?? 0

  // Global = average of three areas
  const global = Math.round((cocina + calidad + salon) / 3)
  const globalLabel = getGlobalLabel(global)

  return {
    salon,
    cocina,
    calidad,
    global,
    globalLabel,
  }
}

/**
 * Get completion status for a category
 */
export function getCategoryCompletion(
  categoryId: string,
  areaId: string,
  responses: AuditResponses
): { answered: number; total: number; percentage: number } {
  const area = AUDIT_STRUCTURE.areas.find((a) => a.id === areaId)
  if (!area) return { answered: 0, total: 0, percentage: 0 }

  const category = area.categories.find((c) => c.id === categoryId)
  if (!category) return { answered: 0, total: 0, percentage: 0 }

  let answered = 0
  let total = 0

  for (const item of category.items) {
    // For custom label items, only count if they have a custom label set
    if (item.isCustomLabel) {
      const response = responses[item.id]
      if (response?.customLabel) {
        total++
        if (response.value !== null && response.value !== undefined) {
          answered++
        }
      }
      continue
    }

    total++

    const response = responses[item.id]
    if (!response) continue

    if (item.isTextField) {
      if (response.textValue && response.textValue.trim() !== '') {
        answered++
      }
    } else {
      if (response.value !== null && response.value !== undefined) {
        answered++
      }
    }
  }

  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0

  return { answered, total, percentage }
}

/**
 * Get completion status for an area
 */
export function getAreaCompletion(
  areaId: string,
  responses: AuditResponses
): { answered: number; total: number; percentage: number } {
  const area = AUDIT_STRUCTURE.areas.find((a) => a.id === areaId)
  if (!area) return { answered: 0, total: 0, percentage: 0 }

  let totalAnswered = 0
  let totalItems = 0

  for (const category of area.categories) {
    const completion = getCategoryCompletion(category.id, areaId, responses)
    totalAnswered += completion.answered
    totalItems += completion.total
  }

  const percentage = totalItems > 0 ? Math.round((totalAnswered / totalItems) * 100) : 0

  return { answered: totalAnswered, total: totalItems, percentage }
}

/**
 * Validate if an item response is complete based on rating requirements
 */
export function validateItemResponse(
  itemId: string,
  responses: AuditResponses
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const response = responses[itemId]

  if (!response) {
    return { valid: false, errors: ['Respuesta requerida'] }
  }

  // Find the item in the structure
  let foundItem = null
  for (const area of AUDIT_STRUCTURE.areas) {
    for (const category of area.categories) {
      const item = category.items.find((i) => i.id === itemId)
      if (item) {
        foundItem = item
        break
      }
    }
    if (foundItem) break
  }

  if (!foundItem) {
    return { valid: false, errors: ['Item no encontrado'] }
  }

  // Text field validation
  if (foundItem.isTextField) {
    if (!response.textValue || response.textValue.trim() === '') {
      errors.push('Campo de texto requerido')
    }
    return { valid: errors.length === 0, errors }
  }

  // Custom label validation
  if (foundItem.isCustomLabel) {
    if (!response.customLabel || response.customLabel.trim() === '') {
      // Custom label items without a label set are optional
      return { valid: true, errors: [] }
    }
    // If custom label is set, rating is required
    if (response.value === null || response.value === undefined) {
      errors.push('Calificación requerida')
    }
  }

  // Rating validation
  if (!foundItem.isTextField && !foundItem.isCustomLabel) {
    if (response.value === null || response.value === undefined) {
      errors.push('Calificación requerida')
    }
  }

  // -1 requires observation
  if (response.value === -1 && (!response.observation || response.observation.trim() === '')) {
    errors.push('Observación requerida para "No cumple"')
  }

  // -2 requires observation and photo
  if (response.value === -2) {
    if (!response.observation || response.observation.trim() === '') {
      errors.push('Observación requerida para "Crítico"')
    }
    if (!response.photoUrl) {
      errors.push('Foto requerida para "Crítico"')
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate all responses for a category
 */
export function validateCategory(
  categoryId: string,
  areaId: string,
  responses: AuditResponses
): { valid: boolean; itemErrors: Record<string, string[]> } {
  const area = AUDIT_STRUCTURE.areas.find((a) => a.id === areaId)
  if (!area) return { valid: false, itemErrors: {} }

  const category = area.categories.find((c) => c.id === categoryId)
  if (!category) return { valid: false, itemErrors: {} }

  const itemErrors: Record<string, string[]> = {}
  let valid = true

  for (const item of category.items) {
    // Skip custom label items that don't have a label set
    if (item.isCustomLabel) {
      const response = responses[item.id]
      if (!response?.customLabel) continue
    }

    const validation = validateItemResponse(item.id, responses)
    if (!validation.valid) {
      valid = false
      itemErrors[item.id] = validation.errors
    }
  }

  return { valid, itemErrors }
}

/**
 * Validate entire audit
 */
export function validateAudit(responses: AuditResponses): {
  valid: boolean
  areaErrors: Record<string, Record<string, string[]>>
} {
  const areaErrors: Record<string, Record<string, string[]>> = {}
  let valid = true

  for (const area of AUDIT_STRUCTURE.areas) {
    areaErrors[area.id] = {}
    for (const category of area.categories) {
      const validation = validateCategory(category.id, area.id, responses)
      if (!validation.valid) {
        valid = false
        areaErrors[area.id][category.id] = Object.values(validation.itemErrors).flat()
      }
    }
  }

  return { valid, areaErrors }
}
