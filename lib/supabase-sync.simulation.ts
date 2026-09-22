import { buildSupabaseSyncPayload, isPreviewSyncDisabled } from './supabase-sync'

const input = {
  auditId: 'simulation-olivos-2026-09-20',
  metadata: { locationId: 'olivos', locationName: 'Olivos', auditorName: 'AUDITOR 1', auditorNames: ['AUDITOR 1'], auditDate: '2026-09-20', auditQuarter: 'Q3' as const },
  responses: {},
  scores: [{ scoreType: 'global', areaId: null, categoryId: null, weight: null, scoreValue: 63, scoreLabel: 'Requiere acción' }],
}

export function runSupabaseSyncSimulation() {
  const payload = buildSupabaseSyncPayload(input)
  return { previewDisabled: isPreviewSyncDisabled(), stableId: payload.audit.id, fallbackKey: payload.fallbackKey, responseCount: payload.responses.length, scoreCount: payload.scores.length, writesPerformed: false }
}
