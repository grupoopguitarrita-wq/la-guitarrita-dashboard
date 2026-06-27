import { supabase } from "@/lib/supabase"
import { getGeneratorConfig } from "./config"
// Las tablas del sistema de informes no están en los tipos generados del
// cliente Supabase, por eso usamos un acceso sin tipar para escribir en ellas.
const db = supabase as unknown as {
  from: (table: string) => any
}
import { buildReportPayload } from "./payload-builder"
import { validatePayload } from "./validation"
import type { ReportState, ReportStatus } from "./types"

// ============================================================================
// Persistencia y consolidación de estado de informes.
// Lee audit_generated_reports + recalcula el hash actual para detectar "stale",
// y arma el ReportState que consume la UI de Pizarra.
// ============================================================================

type ReportRow = {
  id: string
  audit_id: string
  location_id: string | null
  quarter: string
  status: string
  source_hash: string | null
  storage_path: string | null
  file_name: string | null
  file_size: number | null
  error_message: string | null
  generation_count: number
  completed_at: string | null
  updated_at: string | null
}

export async function logEvent(input: {
  reportId?: string | null
  auditId: string
  eventType: string
  message?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  await db.from("report_events").insert({
    report_id: input.reportId ?? null,
    audit_id: input.auditId,
    event_type: input.eventType,
    message: input.message ?? null,
    metadata: input.metadata ?? null,
  })
}

export async function getReportRow(auditId: string): Promise<ReportRow | null> {
  const { data } = await db
    .from("audit_generated_reports")
    .select("*")
    .eq("audit_id", auditId)
    .maybeSingle()
  return (data as ReportRow | null) ?? null
}

/**
 * Consolida el estado de un informe para la UI:
 * - Si el servicio no está configurado => not_configured.
 * - Recalcula el hash actual y, si difiere del guardado en un informe
 *   "available", lo reporta como "stale".
 * - Corre validación sobre el payload actual.
 */
export async function getReportState(auditId: string): Promise<ReportState> {
  const config = getGeneratorConfig()

  // Construir payload actual (para hash + validación).
  const built = await buildReportPayload(auditId)
  const validation = validatePayload(built.payload)
  const row = await getReportRow(auditId)

  let status: ReportStatus
  if (!config.configured) {
    status = "not_configured"
  } else if (!validation.ok) {
    status = "invalid"
  } else if (!row) {
    status = "pending"
  } else if (row.status === "available") {
    status = row.source_hash && row.source_hash !== built.sourceHash ? "stale" : "available"
  } else {
    status = (row.status as ReportStatus) ?? "pending"
  }

  return {
    auditId,
    locationId: built.locationId,
    locationName: built.locationName,
    quarter: built.quarter,
    status,
    sourceHash: row?.source_hash ?? "",
    currentHash: built.sourceHash,
    storagePath: row?.storage_path ?? null,
    fileName: row?.file_name ?? null,
    fileSize: row?.file_size ?? null,
    errorMessage: row?.error_message ?? null,
    generationCount: row?.generation_count ?? 0,
    completedAt: row?.completed_at ?? null,
    updatedAt: row?.updated_at ?? null,
    validation,
  }
}

/**
 * Crea o actualiza la fila de informe a un estado dado (upsert por audit_id).
 */
export async function upsertReportStatus(input: {
  auditId: string
  locationId: string
  quarter: string
  status: ReportStatus
  sourceHash?: string
  errorMessage?: string | null
  incrementCount?: boolean
}): Promise<string | null> {
  const existing = await getReportRow(input.auditId)
  const payload: Record<string, unknown> = {
    audit_id: input.auditId,
    location_id: input.locationId,
    quarter: input.quarter,
    status: input.status,
    error_message: input.errorMessage ?? null,
  }
  if (input.sourceHash) payload.source_hash = input.sourceHash
  if (input.status === "generating") payload.requested_at = new Date().toISOString()
  if (input.incrementCount) payload.generation_count = (existing?.generation_count ?? 0) + 1

  const { data } = await db
    .from("audit_generated_reports")
    .upsert(payload, { onConflict: "audit_id" })
    .select("id")
    .single()
  return (data as { id: string } | null)?.id ?? null
}
