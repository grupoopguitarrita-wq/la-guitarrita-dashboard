import { supabase } from "@/lib/supabase"
import { bandFor } from "@/lib/audit-data"
import { getQ2Dashboard } from "@/lib/q2-data"
import historico from "@/lib/dashboard/historico.json"
import { computeSourceHash } from "./source-hash"
import { TEMPLATE_VERSION, GENERATOR_VERSION, type ReportPayload, type ReportFinding } from "./types"

// ============================================================================
// Construye el payload universal para una auditoría, leyendo datos reales de
// Supabase + contexto de red (dashboard) + histórico. Devuelve también el
// source_hash determinístico para detección de desactualización.
// ============================================================================

type AuditRow = {
  id: string
  location_id: string
  auditor_name: string
  auditor_names: string[] | null
  audit_date: string
  audit_quarter: string | null
  status: string
  salon_score: number | null
  cocina_score: number | null
  calidad_score: number | null
  global_score: number | null
}

type RespRow = {
  area_label: string
  category_label: string
  item_id: string
  item_label: string
  rating_value: number | null
  rating_label: string | null
  observation: string | null
  photo_url: string | null
}

function normalizeName(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")
}

function fmtDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
  } catch {
    return dateStr
  }
}

function toFinding(r: RespRow): ReportFinding {
  return {
    area: r.area_label,
    categoria: r.category_label,
    item: r.item_label,
    resultado: r.rating_label ?? "",
    observacion: r.observation ?? "",
    foto_url: r.photo_url ?? "",
  }
}

export interface BuiltPayload {
  payload: ReportPayload
  sourceHash: string
  locationId: string
  locationName: string
  quarter: string
}

/**
 * Arma el payload completo para una auditoría puntual.
 * Lanza si la auditoría no existe.
 */
export async function buildReportPayload(auditId: string): Promise<BuiltPayload> {
  // 1. Auditoría
  const { data: auditData } = await supabase
    .from("audits")
    .select("id, location_id, auditor_name, auditor_names, audit_date, audit_quarter, status, salon_score, cocina_score, calidad_score, global_score")
    .eq("id", auditId)
    .single()

  const audit = auditData as AuditRow | null
  if (!audit) throw new Error(`Auditoría ${auditId} no encontrada`)

  const quarter = audit.audit_quarter ?? "Q2"

  // 2. Nombre del local
  const { data: locData } = await supabase.from("locations").select("name").eq("id", audit.location_id).single()
  const locationName = (locData as { name: string } | null)?.name ?? "Local"

  // 3. Respuestas
  const { data: respData } = await supabase
    .from("audit_responses")
    .select("area_label, category_label, item_id, item_label, rating_value, rating_label, observation, photo_url")
    .eq("audit_id", auditId)
  const responses = (respData ?? []) as RespRow[]

  // 4. Scores
  const salon = Math.round(audit.salon_score ?? 0)
  const cocina = Math.round(audit.cocina_score ?? 0)
  const calidad = Math.round(audit.calidad_score ?? 0)
  const global = Math.round(audit.global_score ?? 0)
  const band = bandFor(global)
  const riesgo = global < 75 ? "Alto" : global < 85 ? "Moderado" : "Bajo"

  // 5. Auditores
  const auditors = (audit.auditor_names && audit.auditor_names.length
    ? audit.auditor_names
    : audit.auditor_name.split(",").map((s) => s.trim())
  ).filter(Boolean)

  // 6. Hallazgos por tipo
  const fortalezas = responses.filter((r) => r.rating_value === 2).map(toFinding)
  const no_cumple = responses.filter((r) => r.rating_value !== null && r.rating_value < 0).map(toFinding)
  const observaciones = responses.filter((r) => r.observation && r.observation.trim() !== "").map(toFinding)

  // 7. Detalle por área
  const areaKeys = Array.from(new Set(responses.map((r) => r.area_label)))
  const areas = areaKeys.map((areaLabel) => {
    const items = responses.filter((r) => r.area_label === areaLabel)
    const cumple = items.filter((r) => r.rating_value === 1).length
    const nc = items.filter((r) => r.rating_value !== null && r.rating_value < 0).length
    const exc = items.filter((r) => r.rating_value === 2).length
    const obs = items.filter((r) => r.observation && r.observation.trim() !== "").length
    const areaScore = areaLabel.toLowerCase().includes("sal") ? salon
      : areaLabel.toLowerCase().includes("coc") ? cocina
      : areaLabel.toLowerCase().includes("cal") ? calidad : global
    return {
      area: areaLabel,
      puntaje: areaScore,
      banda: bandFor(areaScore).label,
      total_items: items.length,
      cumple,
      no_cumple: nc,
      excepcional: exc,
      observaciones: obs,
    }
  })

  // 8. Contexto de red (desde dashboard)
  const dash = await getQ2Dashboard(quarter)
  const ranked = [...dash.audited].sort((a, b) => b.global - a.global)
  const rankIdx = ranked.findIndex((l) => l.id === audit.location_id)
  const avgRed = dash.audited.length
    ? +(dash.audited.reduce((s, l) => s + l.global, 0) / dash.audited.length).toFixed(1)
    : 0
  const contexto_red = {
    promedio_red: avgRed,
    ranking_posicion: rankIdx >= 0 ? rankIdx + 1 : 0,
    ranking_total: dash.audited.length,
    desviacion_vs_red: +(global - avgRed).toFixed(1),
    mejor_local: ranked[0]?.name ?? "—",
    peor_local: ranked[ranked.length - 1]?.name ?? "—",
  }

  // 9. Evolución histórica del local
  const histEntry = (historico as { name: string; alias: string | null; quarters: { q: string; global: number | null; salon: number | null; cocina: number | null; calidad: number | null }[] }[])
    .find((h) => normalizeName(h.name) === normalizeName(locationName) || (h.alias && normalizeName(h.alias) === normalizeName(locationName)))
  const evolucion = (histEntry?.quarters ?? []).map((q) => ({
    trimestre: q.q,
    global: q.global,
    salon: q.salon,
    cocina: q.cocina,
    calidad: q.calidad,
  }))
  evolucion.push({ trimestre: "Q2 2026", global, salon, cocina, calidad })

  // 10. Diagnóstico textual prudente
  const weakestArea = [["Salón", salon], ["Cocina", cocina], ["Calidad", calidad]].sort((a, b) => (a[1] as number) - (b[1] as number))[0]
  const diagnostico = {
    situacion: [
      `${locationName} obtuvo un puntaje global de ${global}/100 (banda ${band.label}).`,
      `Ubicación ${contexto_red.ranking_posicion} de ${contexto_red.ranking_total} en la red, con una desviación de ${contexto_red.desviacion_vs_red} pts respecto del promedio.`,
    ],
    fortalezas: fortalezas.slice(0, 5).map((f) => `${f.item} (${f.area})`),
    riesgos: no_cumple.slice(0, 5).map((f) => `${f.item} (${f.area})`),
    acciones: [
      `Reforzar ${weakestArea[0]} (${weakestArea[1]}/100), área de menor desempeño.`,
      riesgo === "Alto" ? "Intervención urgente y reauditoría en el corto plazo." : "Sostener controles y monitorear evolución.",
    ],
  }

  // 11. source_hash
  const sourceHash = computeSourceHash({
    auditId: audit.id,
    quarter,
    scores: { global, salon, cocina, calidad },
    responses: responses.map((r) => ({ itemId: r.item_id, rating: r.rating_value, observation: r.observation, photoUrl: r.photo_url })),
    auditDate: audit.audit_date,
    auditors,
  })

  const payload: ReportPayload = {
    meta: {
      template_version: TEMPLATE_VERSION,
      generator_version: GENERATOR_VERSION,
      source_hash: sourceHash,
      generated_for_quarter: quarter,
      generated_at_iso: new Date().toISOString(),
    },
    header: {
      local_nombre: locationName,
      trimestre: quarter,
      fecha_auditoria: fmtDate(audit.audit_date),
      auditores: auditors.join(", "),
      fecha_emision: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
    },
    score: { global, salon, cocina, calidad, banda: band.label, banda_rango: band.range, riesgo },
    areas,
    fortalezas,
    no_cumple,
    observaciones,
    contexto_red,
    evolucion,
    diagnostico,
    accion_requerida: diagnostico.acciones[0],
  }

  return { payload, sourceHash, locationId: audit.location_id, locationName, quarter }
}
