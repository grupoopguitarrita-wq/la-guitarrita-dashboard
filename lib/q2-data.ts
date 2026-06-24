import { supabase } from "@/lib/supabase"
import type { Location, RiskLevel } from "@/lib/audit-data"
import historico from "@/lib/dashboard/historico.json"

type HistoricoEntry = {
  orden: number
  name: string
  alias: string | null
  quarters: { q: string; cocina: number | null; calidad: number | null; salon: number | null; global: number | null }[]
}

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

// A single item response within an audit (used for findings & local detail).
export type ItemFinding = {
  locationId: string
  locationName: string
  areaLabel: string
  categoryLabel: string
  itemId: string
  itemLabel: string
  ratingValue: number | null
  ratingLabel: string | null
  observation: string | null
  photoUrl: string | null
}

// Transversal network finding: same item failing across multiple locations.
export type NetworkFinding = {
  itemId: string
  itemLabel: string
  areaLabel: string
  categoryLabel: string
  affectedCount: number
  criticalCount: number // rating -2
  failCount: number // rating < 0
  locations: { name: string; ratingValue: number | null; ratingLabel: string | null }[]
}

export type AuditorStat = {
  name: string
  participations: number // distinct locations audited
  coaudits: number // audits done with a co-auditor
  solo: number
  totalItems: number
  exceptional: number // rating 2
  compliant: number // rating 1
  fails: number // rating < 0
  criticals: number // rating -2
  exceptionalRate: number // %
  complianceRate: number // %
  severityRate: number // %
  locations: string[]
}

export type QuarterPoint = {
  quarter: string
  global: number | null
  salon: number | null
  cocina: number | null
  calidad: number | null
  derived: boolean // true when not an official audit (e.g. historical/preliminary)
}

export type EvolutionRow = {
  name: string
  points: QuarterPoint[]
  delta: number | null // last vs previous global
  trend: "sube" | "baja" | "estable" | "nuevo"
}

export type DataIntegrity = {
  totalQ2Audits: number
  withGlobalScore: number
  missingScore: number
  inProgress: number
  submitted: number
  excludedTest: number
  withResponses: number
  duplicateLocations: number
  issues: string[]
}

export type Q2Dashboard = {
  audited: Location[]
  universe: number // expected locations (non-test) in the network
  pending: PendingLocation[]
  coverage: number // 0-100
  scope: "Lectura preliminar" | "Lectura parcial" | "Lectura representativa" | "Trimestre completo"
  periodStatus: "En curso" | "Cerrado"
  lastUpdated: string
  findingsByLocation: Record<string, ItemFinding[]>
  networkFindings: NetworkFinding[]
  auditors: AuditorStat[]
  evolution: EvolutionRow[]
  integrity: DataIntegrity
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
// Fixed network universe per spec (18 locales). Used when the DB count differs.
const NETWORK_UNIVERSE = 18

export async function getQ2Dashboard(quarter = "Q2"): Promise<Q2Dashboard> {
  // 1. Locations map
  const { data: locsData } = await supabase.from("locations").select("id, name")
  const locs = (locsData ?? []) as { id: string; name: string }[]
  const nameById = new Map<string, string>()
  for (const l of locs) nameById.set(l.id, l.name)

  // 2. All Q2 audits (for integrity + auditor analysis), and the curated list.
  const { data: rawAudits } = await supabase
    .from("audits")
    .select("id, location_id, auditor_name, auditor_names, audit_date, audit_quarter, status, salon_score, cocina_score, calidad_score, global_score")
    .eq("audit_quarter", quarter)
    .order("audit_date", { ascending: false })

  const allAudits = (rawAudits ?? []) as (AuditRow & { auditor_names: string[] | null })[]
  const validAudits = allAudits.filter((a) => {
    const name = nameById.get(a.location_id)
    return name && !isExcludedLocation(name)
  })

  const audited = await getQ2Locations(quarter)

  // 3. Universe & coverage (non-test locations; floor at fixed network size).
  const universeLocs = locs.filter((l) => !isExcludedLocation(l.name))
  const universe = Math.max(universeLocs.length, NETWORK_UNIVERSE, audited.length)
  const auditedIds = new Set(audited.map((a) => a.id))
  const pending: PendingLocation[] = universeLocs
    .filter((l) => !auditedIds.has(l.id))
    .map((l) => ({ id: l.id, name: l.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const coverage = universe > 0 ? +((audited.length / universe) * 100).toFixed(1) : 0

  // 4. Responses for the chosen (best) audits -> findings + auditor stats.
  const chosenAudits = validAudits.filter((a) => auditedIds.has(a.location_id) && a.global_score !== null)
  // dedupe to one best audit per location (same rule as getQ2Locations)
  const bestByLoc = new Map<string, typeof chosenAudits[number]>()
  for (const a of chosenAudits) {
    const cur = bestByLoc.get(a.location_id)
    if (!cur || (a.status === "submitted" && cur.status !== "submitted") || (a.status === cur.status && a.audit_date > cur.audit_date)) {
      bestByLoc.set(a.location_id, a)
    }
  }
  const bestAudits = Array.from(bestByLoc.values())
  const bestIds = bestAudits.map((a) => a.id)

  const { data: respData } = await supabase
    .from("audit_responses")
    .select("audit_id, area_label, category_label, item_id, item_label, rating_value, rating_label, observation, photo_url")
    .in("audit_id", bestIds.length ? bestIds : ["none"])

  const resp = (respData ?? []) as Omit<RespRow, "locationId" | "locationName">[]
  const auditToLoc = new Map(bestAudits.map((a) => [a.id, a.location_id]))
  const responses: RespRow[] = resp.map((r) => ({
    ...r,
    locationId: auditToLoc.get(r.audit_id) ?? "",
    locationName: nameById.get(auditToLoc.get(r.audit_id) ?? "") ?? "Local",
  }))

  const findingsByLocation = buildFindingsByLocation(responses)
  const networkFindings = buildNetworkFindings(responses)
  const auditors = buildAuditorStats(bestAudits, responses, nameById)
  const evolution = buildEvolution(audited)
  const integrity = buildIntegrity(allAudits, validAudits, bestIds, nameById)

  return {
    audited,
    universe,
    pending,
    coverage,
    scope: scopeFor(coverage),
    periodStatus: coverage >= 100 ? "Cerrado" : "En curso",
    lastUpdated: new Date().toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    findingsByLocation,
    networkFindings,
    auditors,
    evolution,
    integrity,
  }
}

type RespRow = {
  audit_id: string
  area_label: string
  category_label: string
  item_id: string
  item_label: string
  rating_value: number | null
  rating_label: string | null
  observation: string | null
  photo_url: string | null
  locationId: string
  locationName: string
}

function buildFindingsByLocation(responses: RespRow[]): Record<string, ItemFinding[]> {
  const out: Record<string, ItemFinding[]> = {}
  for (const r of responses) {
    // Only keep evaluated items with a non-positive rating OR an observation/photo.
    const isFinding = (r.rating_value !== null && r.rating_value < 0) || (r.observation && r.observation.trim() !== "")
    if (!isFinding) continue
    const f: ItemFinding = {
      locationId: r.locationId,
      locationName: r.locationName,
      areaLabel: r.area_label,
      categoryLabel: r.category_label,
      itemId: r.item_id,
      itemLabel: r.item_label,
      ratingValue: r.rating_value,
      ratingLabel: r.rating_label,
      observation: r.observation,
      photoUrl: r.photo_url,
    }
    ;(out[r.locationId] ||= []).push(f)
  }
  // Sort each location's findings: most severe first.
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => (a.ratingValue ?? 0) - (b.ratingValue ?? 0))
  }
  return out
}

function buildNetworkFindings(responses: RespRow[]): NetworkFinding[] {
  const byItem = new Map<string, NetworkFinding>()
  for (const r of responses) {
    if (r.rating_value === null || r.rating_value >= 0) continue // only failures
    let nf = byItem.get(r.item_id)
    if (!nf) {
      nf = {
        itemId: r.item_id,
        itemLabel: r.item_label,
        areaLabel: r.area_label,
        categoryLabel: r.category_label,
        affectedCount: 0,
        criticalCount: 0,
        failCount: 0,
        locations: [],
      }
      byItem.set(r.item_id, nf)
    }
    nf.failCount++
    if (r.rating_value === -2) nf.criticalCount++
    if (!nf.locations.some((l) => l.name === r.locationName)) {
      nf.affectedCount++
      nf.locations.push({ name: r.locationName, ratingValue: r.rating_value, ratingLabel: r.rating_label })
    }
  }
  // Transversal = affects 2+ locations. Sort by reach then severity.
  return Array.from(byItem.values())
    .filter((nf) => nf.affectedCount >= 2)
    .sort((a, b) => b.affectedCount - a.affectedCount || b.criticalCount - a.criticalCount)
}

function buildAuditorStats(
  audits: { id: string; location_id: string; auditor_name: string; auditor_names: string[] | null }[],
  responses: RespRow[],
  nameById: Map<string, string>,
): AuditorStat[] {
  const respByAudit = new Map<string, RespRow[]>()
  for (const r of responses) {
    const arr = respByAudit.get(r.audit_id)
    if (arr) arr.push(r)
    else respByAudit.set(r.audit_id, [r])
  }

  const stats = new Map<string, AuditorStat>()
  const ensure = (name: string): AuditorStat => {
    let s = stats.get(name)
    if (!s) {
      s = { name, participations: 0, coaudits: 0, solo: 0, totalItems: 0, exceptional: 0, compliant: 0, fails: 0, criticals: 0, exceptionalRate: 0, complianceRate: 0, severityRate: 0, locations: [] }
      stats.set(name, s)
    }
    return s
  }

  for (const a of audits) {
    const names = (a.auditor_names && a.auditor_names.length ? a.auditor_names : a.auditor_name.split(",").map((s) => s.trim())).filter(Boolean)
    const locName = nameById.get(a.location_id) ?? "Local"
    const isCo = names.length > 1
    const rs = respByAudit.get(a.id) ?? []
    for (const name of names) {
      const s = ensure(name)
      if (!s.locations.includes(locName)) {
        s.locations.push(locName)
        s.participations++
      }
      if (isCo) s.coaudits++
      else s.solo++
      for (const r of rs) {
        if (r.rating_value === null) continue
        s.totalItems++
        if (r.rating_value === 2) s.exceptional++
        else if (r.rating_value === 1) s.compliant++
        else if (r.rating_value < 0) s.fails++
        if (r.rating_value === -2) s.criticals++
      }
    }
  }

  for (const s of stats.values()) {
    if (s.totalItems > 0) {
      s.exceptionalRate = +((s.exceptional / s.totalItems) * 100).toFixed(1)
      s.complianceRate = +(((s.exceptional + s.compliant) / s.totalItems) * 100).toFixed(1)
      s.severityRate = +((s.fails / s.totalItems) * 100).toFixed(1)
    }
  }
  return Array.from(stats.values()).sort((a, b) => b.participations - a.participations)
}

function buildEvolution(audited: Location[]): EvolutionRow[] {
  const byName = new Map(audited.map((l) => [normalizeName(l.name), l]))
  const rows: EvolutionRow[] = []

  for (const h of historico as HistoricoEntry[]) {
    const points: QuarterPoint[] = h.quarters.map((q) => ({
      quarter: q.q,
      global: q.global,
      salon: q.salon,
      cocina: q.cocina,
      calidad: q.calidad,
      derived: false,
    }))
    // Append Q2 2026 from live audit if available.
    const live = byName.get(normalizeName(h.name)) ?? (h.alias ? byName.get(normalizeName(h.alias)) : undefined)
    if (live) {
      points.push({ quarter: "Q2 2026", global: live.global, salon: live.salon, cocina: live.cocina, calidad: live.calidad, derived: false })
    }
    const withData = points.filter((p) => p.global !== null)
    let delta: number | null = null
    let trend: EvolutionRow["trend"] = "nuevo"
    if (withData.length >= 2) {
      const last = withData[withData.length - 1].global!
      const prev = withData[withData.length - 2].global!
      delta = +(last - prev).toFixed(1)
      trend = delta > 1.5 ? "sube" : delta < -1.5 ? "baja" : "estable"
    }
    rows.push({ name: h.name, points, delta, trend })
  }
  return rows.sort((a, b) => {
    const lastA = a.points.filter((p) => p.global !== null).pop()?.global ?? 0
    const lastB = b.points.filter((p) => p.global !== null).pop()?.global ?? 0
    return lastB - lastA
  })
}

function buildIntegrity(
  allAudits: AuditRow[],
  validAudits: AuditRow[],
  bestIds: string[],
  nameById: Map<string, string>,
): DataIntegrity {
  const withGlobalScore = validAudits.filter((a) => a.global_score !== null).length
  const missingScore = validAudits.length - withGlobalScore
  const inProgress = validAudits.filter((a) => a.status === "in_progress").length
  const submitted = validAudits.filter((a) => a.status === "submitted").length
  const excludedTest = allAudits.length - validAudits.length

  // Duplicate locations: same location with multiple scored audits.
  const locCounts = new Map<string, number>()
  for (const a of validAudits) {
    if (a.global_score !== null) locCounts.set(a.location_id, (locCounts.get(a.location_id) ?? 0) + 1)
  }
  const duplicateLocations = Array.from(locCounts.values()).filter((c) => c > 1).length

  const issues: string[] = []
  if (missingScore > 0) issues.push(`${missingScore} auditoría(s) Q2 sin puntaje global cargado.`)
  if (inProgress > 0) issues.push(`${inProgress} auditoría(s) aún en progreso (no enviadas).`)
  if (excludedTest > 0) issues.push(`${excludedTest} registro(s) de prueba/sistema excluidos del cálculo.`)
  if (duplicateLocations > 0) issues.push(`${duplicateLocations} local(es) con más de una auditoría puntuada; se tomó la más reciente/enviada.`)
  if (issues.length === 0) issues.push("Sin inconsistencias detectadas en los datos del trimestre.")

  return {
    totalQ2Audits: allAudits.length,
    withGlobalScore,
    missingScore,
    inProgress,
    submitted,
    excludedTest,
    withResponses: bestIds.length,
    duplicateLocations,
    issues,
  }
}

function normalizeName(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")
}

export async function getQ2Locations(quarter = "Q2"): Promise<Location[]> {
  // 1. Locations map (id -> name)
  const { data: locsData } = await supabase.from("locations").select("id, name")
  const locs = (locsData ?? []) as { id: string; name: string }[]
  const nameById = new Map<string, string>()
  for (const l of locs) nameById.set(l.id, l.name)

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
  const { data: responsesData } = await supabase
    .from("audit_responses")
    .select("audit_id, rating_value, observation")
    .in("audit_id", auditIds)

  const responses = (responsesData ?? []) as { audit_id: string; rating_value: number | null; observation: string | null }[]
  const counts = new Map<string, { fortalezas: number; noCumple: number; observaciones: number }>()
  for (const id of auditIds) counts.set(id, { fortalezas: 0, noCumple: 0, observaciones: 0 })
  for (const r of responses) {
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
