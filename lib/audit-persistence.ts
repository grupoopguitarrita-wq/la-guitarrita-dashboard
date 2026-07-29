import { supabase } from './supabase'
import type { AuditMetadata, AuditResponses, RatingValue } from '@/types/audit'
import type { Location } from '@/types/database'
import { getRatingLabel, getGlobalLabel } from '@/types/audit'
import { AUDIT_STRUCTURE, getItemById } from '@/data/audit-structure'
import { calculateAreaScore, calculateGlobalScores } from './audit-scoring'
import {
  sheetsCreateAudit,
  sheetsSaveResponse,
  sheetsSaveAreaScore,
  sheetsSubmitAudit,
  sheetsUploadPhoto,
} from './sheets-db'

/**
 * ============================================================================
 *  PERSISTENCIA DE AUDITORÍAS — Google Sheets como base de datos
 * ============================================================================
 *  Las auditorías se GUARDAN en tu Google Sheet (vía Apps Script), no en
 *  Supabase. La lectura de locales sigue en Supabase por ahora.
 *
 *  Configuración: cargá SHEETS_WEBHOOK_URL y SHEETS_WEBHOOK_TOKEN en las
 *  variables del proyecto. Ver google-sheets-db/README.md.
 * ============================================================================
 */

const AREA_LABELS: Record<string, string> = {
  salon: 'Salón',
  cocina: 'Cocina',
  calidad: 'Calidad',
}

/**
 * Guarda el puntaje de un área apenas el auditor la termina.
 * El Google Sheet recalcula y devuelve el puntaje global.
 */
export async function saveAreaScore(
  auditId: string,
  areaId: string,
  responses: AuditResponses
): Promise<{ areaScore: number; globalScore: number } | null> {
  if (!AREA_LABELS[areaId]) {
    console.error('Unknown area ID:', areaId)
    return null
  }

  const areaScoreData = calculateAreaScore(areaId, responses)
  if (!areaScoreData) {
    console.error('Could not calculate area score for:', areaId)
    return null
  }

  const areaScore = areaScoreData.percentage

  const result = await sheetsSaveAreaScore({
    auditId,
    areaId,
    areaScore,
    globalLabel: getGlobalLabel(areaScore),
  })

  const globalScore = result.globalScore ?? areaScore
  console.log(`[Audit] Saved ${areaId} score: ${areaScore}%, global: ${globalScore}%`)

  return { areaScore, globalScore }
}

/**
 * Locales: se siguen leyendo desde Supabase (lectura).
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
 * Crea una nueva auditoría en Google Sheets con estado 'in_progress'.
 * El id se genera en el cliente para que los reintentos sean idempotentes.
 */
export async function createAudit(metadata: AuditMetadata): Promise<string> {
  const allAuditors = metadata.auditorNames?.length > 0
    ? metadata.auditorNames
    : metadata.auditorName
      ? [metadata.auditorName]
      : []

  const auditId = generateId()

  await sheetsCreateAudit({
    id: auditId,
    locationId: metadata.locationId,
    locationName: metadata.locationName ?? '',
    auditorName: allAuditors.join(', '),
    auditorNames: allAuditors,
    auditDate: metadata.auditDate,
    auditQuarter: metadata.auditQuarter,
  })

  return auditId
}

/**
 * Upsert de una respuesta individual en Google Sheets.
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

  const allPhotos = response.photoUrls && response.photoUrls.length > 0
    ? response.photoUrls
    : response.photoUrl
      ? [response.photoUrl]
      : []

  await sheetsSaveResponse({
    auditId,
    areaId: area.id,
    areaLabel: area.label,
    categoryId: category.id,
    categoryLabel: category.label,
    itemId,
    itemLabel: item.isCustomLabel && response.customLabel ? response.customLabel : item.label,
    itemDescription: item.description ?? '',
    ratingValue: response.value,
    ratingLabel: response.value !== null ? getRatingLabel(response.value) : '',
    observation: response.observation || '',
    photoUrl: allPhotos[0] || '',
    photoUrls: allPhotos,
    customLabel: response.customLabel || '',
    textValue: response.textValue || '',
    isTextField: item.isTextField ?? false,
    isCustomLabel: item.isCustomLabel ?? false,
  })
}

/**
 * Sube una foto: la convierte a base64 y la guarda en Drive vía Apps Script.
 * Devuelve un link público de Google Drive.
 */
export async function uploadPhoto(
  auditId: string,
  itemId: string,
  file: File
): Promise<string> {
  const base64 = await fileToBase64(file)
  const filename = `${auditId}-${itemId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  const result = await sheetsUploadPhoto({
    base64,
    mimeType: file.type || 'image/jpeg',
    filename,
  })

  return result.url
}

/**
 * Cierra la auditoría: calcula puntajes finales y los guarda en Google Sheets.
 */
export async function submitAudit(
  auditId: string,
  responses: AuditResponses
): Promise<void> {
  const globalScores = calculateGlobalScores(responses)

  const scores: Array<{
    scoreType: string
    areaId: string | null
    categoryId: string | null
    weight: number | null
    scoreValue: number
    scoreLabel: string
  }> = []

  for (const area of AUDIT_STRUCTURE.areas) {
    const areaScore = calculateAreaScore(area.id, responses)
    if (areaScore) {
      scores.push({
        scoreType: 'area',
        areaId: area.id,
        categoryId: null,
        weight: null,
        scoreValue: areaScore.percentage,
        scoreLabel: getScoreLabel(areaScore.percentage),
      })

      for (const categoryScore of areaScore.categoryScores) {
        scores.push({
          scoreType: 'category',
          areaId: area.id,
          categoryId: categoryScore.categoryId,
          weight: categoryScore.weight,
          scoreValue: categoryScore.percentage,
          scoreLabel: getScoreLabel(categoryScore.percentage),
        })
      }
    }
  }

  scores.push({
    scoreType: 'global',
    areaId: null,
    categoryId: null,
    weight: null,
    scoreValue: globalScores.global,
    scoreLabel: globalScores.globalLabel,
  })

  await sheetsSubmitAudit({
    auditId,
    salonScore: globalScores.salon,
    cocinaScore: globalScores.cocina,
    calidadScore: globalScores.calidad,
    globalScore: globalScores.global,
    globalLabel: globalScores.globalLabel,
    scores,
  })
}

// ----------------------------------------------------------------------------
//  Helpers
// ----------------------------------------------------------------------------

/** Genera un UUID v4 (con fallback si crypto.randomUUID no está disponible). */
function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Convierte un File a base64 puro (sin el prefijo data:...). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excelente'
  if (score >= 80) return 'Óptimo'
  if (score >= 70) return 'Aceptable'
  return 'Requiere acción'
}

/**
 * Guardado con debounce: guarda la respuesta tras un pequeño retardo.
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
 * Fuerza el guardado inmediato de todas las respuestas pendientes.
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
