import { createClient } from '@supabase/supabase-js'
import type { AuditMetadata, AuditResponses } from '@/types/audit'
import { AUDIT_STRUCTURE } from '@/data/audit-structure'
import { calculateAreaScore, calculateGlobalScores } from '@/lib/audit-scoring'
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

export function buildSupabaseSyncPayload(input: SubmittedAuditSyncInput) {
  const now = new Date().toISOString()
  const global = calculateGlobalScores(input.responses)
  const responseRows = Object.entries(input.responses).map(([itemId, response]) => {
    const item = AUDIT_STRUCTURE.areas.flatMap((area) => area.categories.flatMap((category) => category.items.map((item) => ({ item, category, area })))).find((entry) => entry.item.id === itemId)
    if (!item) return null
    const photos = response.photoUrls?.length ? response.photoUrls : response.photoUrl ? [response.photoUrl] : []
    return { id: `${input.auditId}:${itemId}`, audit_id: input.auditId, area_id: item.area.id, area_label: item.area.label, category_id: item.category.id, category_label: item.category.label, item_id: itemId, item_label: item.item.isCustomLabel && response.customLabel ? response.customLabel : item.item.label, item_description: item.item.description ?? null, rating_value: response.value, rating_label: response.value == null ? null : getRatingLabel(response.value), observation: response.observation || null, photo_url: photos[0] ?? null, photo_urls: photos, custom_label: response.customLabel || null, text_value: response.textValue || null, is_text_field: item.item.isTextField ?? false, is_custom_label: item.item.isCustomLabel ?? false, created_at: now, updated_at: now }
  }).filter(Boolean)
  return {
    audit: { id: input.auditId, location_id: input.metadata.locationId, auditor_name: input.metadata.auditorName || input.metadata.auditorNames.join(', '), auditor_names: input.metadata.auditorNames, audit_date: input.metadata.auditDate, audit_quarter: input.metadata.auditQuarter, status: 'submitted', salon_score: global.salon, cocina_score: global.cocina, calidad_score: global.calidad, global_score: global.global, global_label: getGlobalLabel(global.global), submitted_at: now, updated_at: now },
    scores: input.scores.map((score, index) => ({ ...score, id: `${input.auditId}:${score.scoreType}:${score.areaId ?? 'global'}:${score.categoryId ?? index}`, audit_id: input.auditId, created_at: now })),
    responses: responseRows,
    fallbackKey: `${input.metadata.locationId}:${input.metadata.auditDate}:${input.metadata.auditQuarter}`,
  }
}

export async function syncSubmittedAudit(input: SubmittedAuditSyncInput): Promise<{ status: SyncStatus; fallbackKey: string }> {
  const payload = buildSupabaseSyncPayload(input)
  if (isPreviewSyncDisabled()) return { status: 'preview_dry_run', fallbackKey: payload.fallbackKey }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { status: 'pending_sync', fallbackKey: payload.fallbackKey }
  const supabase = createClient(url, key)
  const audit = await supabase.from('audits').upsert(payload.audit, { onConflict: 'id' }).select('id').single()
  if (audit.error) throw audit.error
  const scores = await supabase.from('audit_scores').upsert(payload.scores, { onConflict: 'id' })
  if (scores.error) throw scores.error
  const responses = await supabase.from('audit_responses').upsert(payload.responses, { onConflict: 'id' })
  if (responses.error) throw responses.error
  return { status: 'synced', fallbackKey: payload.fallbackKey }
}
