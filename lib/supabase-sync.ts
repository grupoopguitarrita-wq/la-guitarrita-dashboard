import { createClient } from '@supabase/supabase-js'
import type { AuditMetadata, AuditResponses } from '@/types/audit'
import { AUDIT_STRUCTURE } from '@/data/audit-structure'
import { calculateGlobalScores } from '@/lib/audit-scoring'
import { getGlobalLabel, getRatingLabel } from '@/types/audit'

export type SyncStatus = 'synced' | 'pending_sync' | 'preview_dry_run'

export type SubmittedAuditSyncInput = {
  auditId: string
  metadata: AuditMetadata
  responses: AuditResponses
  scores: Array<{ scoreType: string; areaId: string | null; categoryId: string | null; weight: number | null; scoreValue: number; scoreLabel: string }>
}

export function isPreviewSyncDisabled() {
  return process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV !== 'production'
}

function scoreFromInput(input: SubmittedAuditSyncInput, scoreType: string, areaId: string | null) {
  return input.scores.find((score) => score.scoreType === scoreType && score.areaId === areaId)?.scoreValue
}

export function buildSupabaseSyncPayload(input: SubmittedAuditSyncInput) {
  const now = new Date().toISOString()
  const calculated = calculateGlobalScores(input.responses)
  const salon = scoreFromInput(input, 'area', 'salon') ?? calculated.salon
  const cocina = scoreFromInput(input, 'area', 'cocina') ?? calculated.cocina
  const calidad = scoreFromInput(input, 'area', 'calidad') ?? calculated.calidad
  const global = scoreFromInput(input, 'global', null) ?? calculated.global

  const responseRows = Object.entries(input.responses).map(([itemId, response]) => {
    const item = AUDIT_STRUCTURE.areas
      .flatMap((area) => area.categories.flatMap((category) => category.items.map((item) => ({ item, category, area }))))
      .find((entry) => entry.item.id === itemId)
    if (!item) return null
    const photos = response.photoUrls?.length ? response.photoUrls : response.photoUrl ? [response.photoUrl] : []
    return {
      id: `${input.auditId}:${itemId}`,
      audit_id: input.auditId,
      area_id: item.area.id,
      area_label: item.area.label,
      category_id: item.category.id,
      category_label: item.category.label,
      item_id: itemId,
      item_label: item.item.isCustomLabel && response.customLabel ? response.customLabel : item.item.label,
      item_description: item.item.description ?? null,
      rating_value: response.value,
      rating_label: response.value == null ? null : getRatingLabel(response.value),
      observation: response.observation || null,
      photo_url: photos[0] ?? null,
      photo_urls: photos,
      custom_label: response.customLabel || null,
      text_value: response.textValue || null,
      is_text_field: item.item.isTextField ?? false,
      is_custom_label: item.item.isCustomLabel ?? false,
      created_at: now,
      updated_at: now,
    }
  }).filter(Boolean)

  return {
    audit: {
      id: input.auditId,
      location_id: input.metadata.locationId,
      auditor_name: input.metadata.auditorName || input.metadata.auditorNames.join(', '),
      auditor_names: input.metadata.auditorNames,
      audit_date: input.metadata.auditDate,
      audit_quarter: input.metadata.auditQuarter,
      status: 'submitted',
      salon_score: salon,
      cocina_score: cocina,
      calidad_score: calidad,
      global_score: global,
      global_label: getGlobalLabel(global),
      submitted_at: now,
      updated_at: now,
    },
    scores: input.scores.map((score, index) => ({
      ...score,
      id: `${input.auditId}:${score.scoreType}:${score.areaId ?? 'global'}:${score.categoryId ?? index}`,
      audit_id: input.auditId,
      created_at: now,
    })),
    responses: responseRows,
    fallbackKey: `${input.metadata.locationId}:${input.metadata.auditDate}:${input.metadata.auditQuarter}`,
  }
}

function normalizeName(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

export async function syncSubmittedAudit(input: SubmittedAuditSyncInput): Promise<{ status: SyncStatus; fallbackKey: string }> {
  const payload = buildSupabaseSyncPayload(input)
  if (isPreviewSyncDisabled()) return { status: 'preview_dry_run', fallbackKey: payload.fallbackKey }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { status: 'pending_sync', fallbackKey: payload.fallbackKey }

  const supabase = createClient(url, key)

  // Sheets stores stable slugs (for example "olivos"), while Supabase locations
  // uses UUID primary keys. Resolve the canonical UUID before writing the audit.
  const { data: locations, error: locationsError } = await supabase.from('locations').select('id, name')
  if (locationsError) throw locationsError
  const requestedName = normalizeName(input.metadata.locationName || input.metadata.locationId)
  const location = locations?.find((candidate) =>
    candidate.id === input.metadata.locationId || normalizeName(candidate.name) === requestedName,
  )
  if (!location) throw new Error(`location_not_found:${input.metadata.locationName || input.metadata.locationId}`)

  payload.audit.location_id = location.id

  const audit = await supabase.from('audits').upsert(payload.audit, { onConflict: 'id' }).select('id').single()
  if (audit.error) throw audit.error
  const scores = await supabase.from('audit_scores').upsert(payload.scores, { onConflict: 'id' })
  if (scores.error) throw scores.error
  const responses = await supabase.from('audit_responses').upsert(payload.responses, { onConflict: 'id' })
  if (responses.error) throw responses.error

  return { status: 'synced', fallbackKey: payload.fallbackKey }
}
