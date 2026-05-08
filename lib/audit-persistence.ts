import { supabase } from './supabase'
import type { AuditMetadata, AuditResponses, RatingValue } from '@/types/audit'
import type { Location, AuditInsert, AuditResponseInsert, AuditScoreInsert } from '@/types/database'
import { getRatingLabel, getGlobalLabel } from '@/types/audit'
import { AUDIT_STRUCTURE, getItemById } from '@/data/audit-structure'
import { calculateCategoryScore, calculateAreaScore, calculateGlobalScores } from './audit-scoring'

/**
 * Map area IDs to their corresponding score column names in the audits table
 */
const AREA_SCORE_COLUMNS: Record<string, 'salon_score' | 'cocina_score' | 'calidad_score'> = {
  salon: 'salon_score',
  cocina: 'cocina_score',
  calidad: 'calidad_score',
}

/**
 * Save an individual area score immediately when the auditor completes that area.
 * Also recalculates and updates the global_score based on all available area scores.
 */
export async function saveAreaScore(
  auditId: string,
  areaId: string,
  responses: AuditResponses
): Promise<{ areaScore: number; globalScore: number } | null> {
  const columnName = AREA_SCORE_COLUMNS[areaId]
  if (!columnName) {
    console.error('Unknown area ID:', areaId)
    return null
  }

  // Calculate score for this area
  const areaScoreData = calculateAreaScore(areaId, responses)
  if (!areaScoreData) {
    console.error('Could not calculate area score for:', areaId)
    return null
  }

  const areaScore = areaScoreData.percentage

  // First, get the current scores from the audit to calculate global
  const { data: currentAudit, error: fetchError } = await supabase
    .from('audits')
    .select('salon_score, cocina_score, calidad_score')
    .eq('id', auditId)
    .single()

  if (fetchError) {
    console.error('Error fetching current audit scores:', fetchError)
    throw fetchError
  }

  // Build updated scores object
  const updatedScores = {
    salon_score: currentAudit?.salon_score ?? null,
    cocina_score: currentAudit?.cocina_score ?? null,
    calidad_score: currentAudit?.calidad_score ?? null,
  }

  // Update with the new area score
  updatedScores[columnName] = areaScore

  // Calculate global score as average of available area scores
  const availableScores = [
    updatedScores.salon_score,
    updatedScores.cocina_score,
    updatedScores.calidad_score,
  ].filter((score): score is number => score !== null)

  const globalScore = availableScores.length > 0
    ? Math.round(availableScores.reduce((sum, s) => sum + s, 0) / availableScores.length)
    : 0

  const globalLabel = getGlobalLabel(globalScore)

  // Update the audit record with the area score and recalculated global score
  const { error: updateError } = await supabase
    .from('audits')
    .update({
      [columnName]: areaScore,
      global_score: globalScore,
      global_label: globalLabel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auditId)

  if (updateError) {
    console.error('Error updating area score:', updateError)
    throw updateError
  }

  console.log(`[Audit] Saved ${areaId} score: ${areaScore}%, global: ${globalScore}%`)

  return { areaScore, globalScore }
}

/**
 * Fetch all locations from Supabase
 */
export async function fetchLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching locations:', error)
    throw error
  }

  return data ?? []
}

/**
 * Create a new audit in Supabase with status 'in_progress'
 */
export async function createAudit(metadata: AuditMetadata): Promise<string> {
  // Get all auditor names, preferring auditorNames array over single auditorName
  const allAuditors = metadata.auditorNames?.length > 0
    ? metadata.auditorNames
    : metadata.auditorName
      ? [metadata.auditorName]
      : []

  const auditData: AuditInsert = {
    location_id: metadata.locationId,
    // Keep auditor_name for backward compatibility (use first auditor or joined string)
    auditor_name: allAuditors.join(', '),
    // Store array of auditors in auditor_names column
    auditor_names: allAuditors.length > 0 ? allAuditors : null,
    audit_date: metadata.auditDate,
    audit_quarter: metadata.auditQuarter,
    status: 'in_progress',
  }

  const { data, error } = await supabase
    .from('audits')
    .insert(auditData)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating audit:', error)
    throw error
  }

  return data.id
}

/**
 * Upsert a single audit response
 */
export async function upsertAuditResponse(
  auditId: string,
  itemId: string,
  response: {
    value: RatingValue | null
    observation: string
    photoUrl: string | null
    photoUrls?: string[]
    customLabel: string
    textValue: string
  }
): Promise<void> {
  const itemData = getItemById(itemId)
  if (!itemData) {
    console.error('Item not found:', itemId)
    return
  }

  const { item, category, area } = itemData

  // Get all photos - prefer photoUrls array, fallback to single photoUrl
  const allPhotos = response.photoUrls && response.photoUrls.length > 0
    ? response.photoUrls
    : response.photoUrl
      ? [response.photoUrl]
      : []

  const responseData: AuditResponseInsert = {
    audit_id: auditId,
    area_id: area.id,
    area_label: area.label,
    category_id: category.id,
    category_label: category.label,
    item_id: itemId,
    item_label: item.isCustomLabel && response.customLabel ? response.customLabel : item.label,
    item_description: item.description ?? null,
    rating_value: response.value,
    rating_label: response.value !== null ? getRatingLabel(response.value) : null,
    observation: response.observation || null,
    // For backward compatibility, store first photo in photo_url
    photo_url: allPhotos[0] || null,
    // Store all photos as JSON array in photo_urls column (if column exists)
    photo_urls: allPhotos.length > 0 ? allPhotos : null,
    custom_label: response.customLabel || null,
    text_value: response.textValue || null,
    is_text_field: item.isTextField ?? false,
    is_custom_label: item.isCustomLabel ?? false,
  }

  // First, check if response exists
  const { data: existing } = await supabase
    .from('audit_responses')
    .select('id')
    .eq('audit_id', auditId)
    .eq('item_id', itemId)
    .single()

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('audit_responses')
      .update({
        ...responseData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating audit response:', error)
      throw error
    }
  } else {
    // Insert new
    const { error } = await supabase
      .from('audit_responses')
      .insert(responseData)

    if (error) {
      console.error('Error inserting audit response:', error)
      throw error
    }
  }
}

/**
 * Upload photo to Supabase storage
 */
export async function uploadPhoto(
  auditId: string,
  itemId: string,
  file: File
): Promise<string> {
  const timestamp = Date.now()
  const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const path = `${auditId}/${itemId}/${timestamp}-${filename}`

  const { error: uploadError } = await supabase.storage
    .from('audit-photos')
    .upload(path, file)

  if (uploadError) {
    console.error('Error uploading photo:', uploadError)
    throw uploadError
  }

  const { data: urlData } = supabase.storage
    .from('audit-photos')
    .getPublicUrl(path)

  return urlData.publicUrl
}

/**
 * Submit the complete audit
 */
export async function submitAudit(
  auditId: string,
  responses: AuditResponses
): Promise<void> {
  // Calculate all scores
  const globalScores = calculateGlobalScores(responses)

  // Update audit with final scores
  const { error: updateError } = await supabase
    .from('audits')
    .update({
      status: 'submitted',
      salon_score: globalScores.salon,
      cocina_score: globalScores.cocina,
      calidad_score: globalScores.calidad,
      global_score: globalScores.global,
      global_label: globalScores.globalLabel,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', auditId)

  if (updateError) {
    console.error('Error updating audit:', updateError)
    throw updateError
  }

  // Insert audit scores for each area and category
  const scoreInserts: AuditScoreInsert[] = []

  for (const area of AUDIT_STRUCTURE.areas) {
    const areaScore = calculateAreaScore(area.id, responses)
    if (areaScore) {
      // Area score
      scoreInserts.push({
        audit_id: auditId,
        score_type: 'area',
        area_id: area.id,
        category_id: null,
        weight: null,
        score_value: areaScore.percentage,
        score_label: getScoreLabel(areaScore.percentage),
      })

      // Category scores
      for (const categoryScore of areaScore.categoryScores) {
        scoreInserts.push({
          audit_id: auditId,
          score_type: 'category',
          area_id: area.id,
          category_id: categoryScore.categoryId,
          weight: categoryScore.weight,
          score_value: categoryScore.percentage,
          score_label: getScoreLabel(categoryScore.percentage),
        })
      }
    }
  }

  // Global score
  scoreInserts.push({
    audit_id: auditId,
    score_type: 'global',
    area_id: null,
    category_id: null,
    weight: null,
    score_value: globalScores.global,
    score_label: globalScores.globalLabel,
  })

  const { error: scoresError } = await supabase
    .from('audit_scores')
    .insert(scoreInserts)

  if (scoresError) {
    console.error('Error inserting audit scores:', scoresError)
    throw scoresError
  }
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excelente'
  if (score >= 80) return 'Óptimo'
  if (score >= 70) return 'Aceptable'
  return 'Requiere acción'
}

/**
 * Debounced save function - saves response after delay
 */
let saveTimeout: NodeJS.Timeout | null = null
const pendingSaves: Map<string, () => Promise<void>> = new Map()

export function debouncedSaveResponse(
  auditId: string,
  itemId: string,
  response: {
    value: RatingValue | null
    observation: string
    photoUrl: string | null
    photoUrls?: string[]
    customLabel: string
    textValue: string
  },
  delay: number = 500
): void {
  const key = `${auditId}-${itemId}`

  pendingSaves.set(key, () => upsertAuditResponse(auditId, itemId, response))

  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }

  saveTimeout = setTimeout(async () => {
    const saves = Array.from(pendingSaves.values())
    pendingSaves.clear()

    for (const save of saves) {
      try {
        await save()
      } catch (error) {
        console.error('Error saving response:', error)
      }
    }
  }, delay)
}

/**
 * Force save all pending responses immediately
 */
export async function flushPendingSaves(): Promise<void> {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }

  const saves = Array.from(pendingSaves.values())
  pendingSaves.clear()

  for (const save of saves) {
    try {
      await save()
    } catch (error) {
      console.error('Error flushing save:', error)
    }
  }
}
