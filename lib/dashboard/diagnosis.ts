import type { Derived } from "@/lib/audit-data"
import type { NetworkStats } from "@/lib/audit-data"

export type ExecutiveDiagnosis = {
  scope: string
  generalSituation: string[]
  strengths: string[]
  risks: string[]
  operationalImplications: string[]
  priorities: string[]
}

const AREA_ES: Record<string, string> = { salon: "Salón", cocina: "Cocina", calidad: "Calidad" }

/**
 * Deterministic executive diagnosis. No AI, no fixed text: every sentence is
 * derived from the real metrics passed in. Uses prudent language.
 */
export function buildDiagnosis(
  derived: Derived[],
  net: NetworkStats,
  coverage: number,
  scopeLabel: string,
): ExecutiveDiagnosis {
  const n = derived.length
  const generalSituation: string[] = []
  const strengths: string[] = []
  const risks: string[] = []
  const operationalImplications: string[] = []
  const priorities: string[] = []

  // ---- Scope ----
  const scope =
    coverage < 35
      ? `Lectura preliminar: ${n} de ${net.count >= n ? Math.round((n / (coverage / 100)) || n) : n} locales auditados (${coverage}% de cobertura). Los resultados representan solo a los locales relevados.`
      : `${scopeLabel}: ${coverage}% de cobertura sobre la red.`

  // ---- General situation ----
  generalSituation.push(`El promedio global de los locales auditados es ${net.avgGlobal}.`)
  const areaAverages: [string, number][] = [
    ["Salón", net.avgSalon],
    ["Cocina", net.avgCocina],
    ["Calidad", net.avgCalidad],
  ]
  const sortedAreas = [...areaAverages].sort((a, b) => a[1] - b[1])
  const weakestArea = sortedAreas[0]
  const strongestArea = sortedAreas[2]
  generalSituation.push(`El área más fuerte es ${strongestArea[0]} (${strongestArea[1]}) y la más débil es ${weakestArea[0]} (${weakestArea[1]}).`)
  if (coverage < 35) {
    generalSituation.push(`La cobertura es baja; el patrón sugiere prudencia antes de extrapolar a toda la red.`)
  }
  const globals = derived.map((d) => d.loc.global)
  const maxG = Math.max(...globals)
  const minG = Math.min(...globals)
  if (maxG - minG >= 12) {
    generalSituation.push(`Los datos muestran dispersión entre locales (brecha de ${maxG - minG} puntos entre el mejor y el peor).`)
  }

  // ---- Strengths ----
  const excelentes = derived.filter((d) => d.loc.global >= 88).sort((a, b) => b.loc.global - a.loc.global)
  if (excelentes.length) {
    strengths.push(`${excelentes.map((d) => `${d.loc.name} (${d.loc.global})`).join(", ")} sostiene${excelentes.length > 1 ? "n" : ""} performance de excelencia.`)
  }
  if (strongestArea[1] >= 85) {
    strengths.push(`${strongestArea[0]} se mantiene por encima del inicio de operación sólida (85).`)
  }
  const totalFort = derived.reduce((a, d) => a + d.loc.fortalezas, 0)
  if (totalFort > 0) strengths.push(`Se registraron ${totalFort} fortalezas en los locales auditados.`)
  if (strengths.length === 0) strengths.push(`No se identifican fortalezas destacadas en el conjunto auditado.`)

  // ---- Risks ----
  const criticosArea = derived.filter((d) => Math.min(d.loc.salon, d.loc.cocina, d.loc.calidad) < 65)
  for (const d of criticosArea) {
    const min = Math.min(d.loc.salon, d.loc.cocina, d.loc.calidad)
    const areaKey = (["salon", "cocina", "calidad"] as const).find((k) => d.loc[k] === min)!
    risks.push(`${d.loc.name} presenta ${AREA_ES[areaKey]} en ${min}, por debajo del umbral crítico (65). Debe verificarse la ejecución del estándar.`)
  }
  const desbalanceados = derived.filter((d) => d.spread >= 15)
  for (const d of desbalanceados) {
    risks.push(`${d.loc.name} muestra un desbalance de ${d.spread} puntos entre áreas; podría estar asociado a una ejecución dispar entre turnos.`)
  }
  const totalNoCumple = derived.reduce((a, d) => a + d.loc.noCumple, 0)
  if (totalNoCumple > 0) risks.push(`Se contabilizan ${totalNoCumple} ítems en No cumple en el conjunto auditado.`)
  if (risks.length === 0) risks.push(`No se detectan riesgos relevantes en los locales auditados.`)

  // ---- Operational implications ----
  if (weakestArea[1] < 85) {
    operationalImplications.push(`El refuerzo de ${weakestArea[0]} (${weakestArea[1]}) tendría el mayor impacto sobre el promedio de la red.`)
  }
  if (criticosArea.length) {
    operationalImplications.push(`Los desvíos críticos requieren plan de acción con responsable, plazo y evidencia.`)
  }
  if (coverage < 70) {
    operationalImplications.push(`Completar las auditorías pendientes permitirá una lectura más representativa del trimestre.`)
  }
  if (operationalImplications.length === 0) {
    operationalImplications.push(`Mantener los controles vigentes para sostener la consistencia observada.`)
  }

  // ---- Priorities ----
  const ranked = [...derived].sort((a, b) => {
    const sevA = (a.loc.riesgo === "alto" ? 2 : a.loc.riesgo === "moderado" ? 1 : 0)
    const sevB = (b.loc.riesgo === "alto" ? 2 : b.loc.riesgo === "moderado" ? 1 : 0)
    if (sevB !== sevA) return sevB - sevA
    return a.loc.global - b.loc.global
  })
  ranked.slice(0, 3).forEach((d, i) => {
    const min = Math.min(d.loc.salon, d.loc.cocina, d.loc.calidad)
    const areaKey = (["salon", "cocina", "calidad"] as const).find((k) => d.loc[k] === min)!
    priorities.push(`${i + 1}. ${d.loc.name}: reforzar ${AREA_ES[areaKey]} (${min}) — riesgo ${d.loc.riesgo}.`)
  })

  return { scope, generalSituation, strengths, risks, operationalImplications, priorities }
}
