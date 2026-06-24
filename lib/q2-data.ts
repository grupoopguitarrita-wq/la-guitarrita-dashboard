import { supabase } from "@/lib/supabase"
import type { Location, RiskLevel } from "@/lib/audit-data"

// Locations whose names mark them as test/system data and must NOT be computed.
function isExcludedLocation(name: string): boolean {
  const n = name.toUpperCase()
  return n.includes("PRUEBA") || n.includes("NO COMPUTAR") || n.includes("TEST")
}

const AREA_LABEL_ES: Record<"salon" | "cocina" | "calidad", string> = {
  salon: "Salón",
  cocina: "Cocina",
  calidad: "Calidad",
}

function deriveRiesgo(global: number, salon: number, cocina: number, calidad: number): RiskLevel {
  const min = Math.min(salon, cocina, calidad)
  if (global < 75 || min < 65) return "alto"
  if (global < 85 || min < 75) return "moderado"
  return "bajo"
}

function deriveAccion(global: number, salon: number, cocina: number, calidad: number, riesgo: RiskLevel): string {
  const areas: [string, number][] = [
    [AREA_LABEL_ES.salon, salon],
    [AREA_LABEL_ES.cocina, cocina],
    [AREA_LABEL_ES.calidad, calidad],
  ]
  const weakest = [...areas].sort((a, b) => a[1] - b[1])[0]
  if (riesgo === "alto") return `Intervención urgente: reforzar ${weakest[0]} (${weakest[1]}/100)`
  if (riesgo === "moderado") return `Reforzar ${weakest[0]} (${weakest[1]}/100) y sostener el resto`
  return `Sostener performance; pulir ${weakest[0]} (${weakest[1]}/100)`
}

function formatFecha(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
  } catch {
    return dateStr
  }
}

type AuditRow = {
  id: string
  location_id: string
  auditor_name: string
  audit_date: string
  audit_quarter: string | null
  status: "in_progress" | "submitted"
  salon_score: number | null
  cocina_score: number | null
  calidad_score: number | null
  global_score: number | null
}

/**
 * Reads the Q2 2026 audits straight from Supabase and maps them into the
 * Location shape the dashboard already consumes. No scores are recalculated:
 * salon/cocina/calidad/global come directly from the stored audit row.
 */
export type PendingLocation = { id: string; name: string }

export type Q2Dashboard = {
  audited: Location[]
  universe: number // expected locations (non-test) in the network
  pending: PendingLocation[]
  coverage: number // 0-100
  scope: "Lectura preliminar" | "Lectura parcial" | "Lectura representativa" | "Trimestre completo"
  periodStatus: "En curso" | "Cerrado"
  lastUpdated: string
}

function scopeFor(coverage: number): Q2Dashboard["scope"] {
  if (coverage >= 100) return "Trimestre completo"
  if (coverage >= 70) return "Lectura representativa"
  if (coverage >= 35) return "Lectura parcial"
  return "Lectura preliminar"
}

/**
 * Full dashboard payload: audited locales (real Supabase scores), the expected
 * universe of locations, pending ones, and coverage classification.
 */
export async function getQ2Dashboard(quarter = "Q2"): Promise<Q2Dashboard> {
  const audited = await getQ2Locations(quarter)

  // Universe = all non-test locations in the network.
  const { data: locs } = await supabase.from("locations").select("id, name")
  const universeLocs = (locs ?? []).filter((l) => !isExcludedLocation(l.name))
  const universe = universeLocs.length || audited.length
  const auditedIds = new Set(audited.map((a) => a.id))
  const pending: PendingLocation[] = universeLocs
    .filter((l) => !auditedIds.has(l.id))
    .map((l) => ({ id: l.id, name: l.name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const coverage = universe > 0 ? +((audited.length / universe) * 100).toFixed(1) : 0

  return {
    audited,
    universe,
    pending,
    coverage,
    scope: scopeFor(coverage),
    periodStatus: coverage >= 100 ? "Cerrado" : "En curso",
    lastUpdated: new Date().toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
  }
}

export async function getQ2Locations(quarter = "Q2"): Promise<Location[]> {
  // 1. Locations map (id -> name)
  const { data: locs } = await supabase.from("locations").select("id, name")
  const nameById = new Map<string, string>()
  for (const l of locs ?? []) nameById.set(l.id, l.name)

  // 2. Q2 audits that actually have a global score
  const { data: audits } = await supabase
    .from("audits")
    .select("id, location_id, auditor_name, audit_date, audit_quarter, status, salon_score, cocina_score, calidad_score, global_score")
    .eq("audit_quarter", quarter)
    .not("global_score", "is", null)
    .order("audit_date", { ascending: false })

  // 3. Pick the best audit per location: prefer submitted, then latest date.
  const bestByLocation = new Map<string, AuditRow>()
  for (const a of (audits ?? []) as AuditRow[]) {
    const name = nameById.get(a.location_id)
    if (!name || isExcludedLocation(name)) continue
    const current = bestByLocation.get(a.location_id)
    if (!current) {
      bestByLocation.set(a.location_id, a)
      continue
    }
    const better =
      (a.status === "submitted" && current.status !== "submitted") ||
      (a.status === current.status && a.audit_date > current.audit_date)
    if (better) bestByLocation.set(a.location_id, a)
  }

  const chosen = Array.from(bestByLocation.values())
  if (chosen.length === 0) return []

  // 4. Count strengths / non-compliance / observations from audit_responses.
  const auditIds = chosen.map((a) => a.id)
  const { data: responses } = await supabase
    .from("audit_responses")
    .select("audit_id, rating_value, observation")
    .in("audit_id", auditIds)

  const counts = new Map<string, { fortalezas: number; noCumple: number; observaciones: number }>()
  for (const id of auditIds) counts.set(id, { fortalezas: 0, noCumple: 0, observaciones: 0 })
  for (const r of responses ?? []) {
    const c = counts.get(r.audit_id)
    if (!c) continue
    if (r.rating_value === 2) c.fortalezas++
    if (r.rating_value !== null && r.rating_value < 0) c.noCumple++
    if (r.observation && r.observation.trim() !== "") c.observaciones++
  }

  // 5. Map to Location shape.
  return chosen.map((a) => {
    const salon = Math.round(a.salon_score ?? 0)
    const cocina = Math.round(a.cocina_score ?? 0)
    const calidad = Math.round(a.calidad_score ?? 0)
    const global = Math.round(a.global_score ?? 0)
    const riesgo = deriveRiesgo(global, salon, cocina, calidad)
    const c = counts.get(a.id) ?? { fortalezas: 0, noCumple: 0, observaciones: 0 }
    return {
      id: a.location_id,
      name: nameById.get(a.location_id) ?? "Local",
      file: "",
      pdfUrl: undefined,
      fecha: formatFecha(a.audit_date),
      auditores: a.auditor_name.split(",").map((s) => s.trim()).filter(Boolean),
      global,
      salon,
      cocina,
      calidad,
      fortalezas: c.fortalezas,
      noCumple: c.noCumple,
      observaciones: c.observaciones,
      riesgo,
      accionRequerida: deriveAccion(global, salon, cocina, calidad, riesgo),
    }
  })
}
