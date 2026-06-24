"use client"

import { Fragment, useMemo, useState } from "react"
import {
  AlertTriangle, TrendingDown, TrendingUp, Search, X, Target, Trophy, 
  Activity, ArrowLeft, FileText, Users, CheckCircle2, AlertOctagon,
  ChevronDown, ChevronUp, BarChart3, Grid3X3,
} from "lucide-react"
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell,
} from "recharts"
import {
  computeNetwork, computeDerived, AREA_LABEL, bandFor, BANDS,
  type Derived, type Tier, type AreaKey,
} from "@/lib/audit-data"
import type { Q2Dashboard } from "@/lib/q2-data"
import { buildDiagnosis } from "@/lib/dashboard/diagnosis"
import HallazgosTab from "@/components/dashboard/tabs/HallazgosTab"
import AuditoresTab from "@/components/dashboard/tabs/AuditoresTab"
import EvolucionTab from "@/components/dashboard/tabs/EvolucionTab"
import EstadoDatosTab from "@/components/dashboard/tabs/EstadoDatosTab"
import Link from "next/link"

const tierClass: Record<Tier, string> = {
  EXCELENTE: "text-emerald-700 border-emerald-500/40 bg-emerald-50",
  "ÓPTIMO": "text-green-700 border-green-500/40 bg-green-50",
  SATISFACTORIO: "text-amber-700 border-amber-500/40 bg-amber-50",
  "EN DESARROLLO": "text-orange-700 border-orange-500/40 bg-orange-50",
  "CRÍTICO": "text-red-700 border-red-500/40 bg-red-50",
}

const tierDesc: Record<Tier, string> = {
  EXCELENTE: "Benchmark de la red",
  "ÓPTIMO": "Por encima del objetivo",
  SATISFACTORIO: "En objetivo, sostener",
  "EN DESARROLLO": "Por debajo del objetivo, requiere plan",
  "CRÍTICO": "Intervención urgente requerida",
}

const riskBadge: Record<string, string> = {
  bajo: "text-emerald-700 bg-emerald-50 border-emerald-200",
  moderado: "text-amber-700 bg-amber-50 border-amber-200",
  alto: "text-red-700 bg-red-50 border-red-200",
}

// Official bands: <=75 crítico · 76-84 alerta · 85-93 satisfactorio · 94+ excelencia
function scoreColor(v: number) {
  return bandFor(v).color
}

function heatCell(v: number) {
  const b = bandFor(v)
  return { bg: b.bg, text: b.text }
}

export default function Q2DashboardView({ dashboard }: { dashboard: Q2Dashboard }) {
  const ALL = dashboard.audited
  const [mainTab, setMainTab] = useState<"resumen" | "hallazgos" | "evolucion" | "auditores" | "datos">("resumen")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<"heatmap" | "ranking">("heatmap")
  const [auditorFilter, setAuditorFilter] = useState<string>("")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [compareA, setCompareA] = useState<string>("")
  const [compareB, setCompareB] = useState<string>("")
  const [showCompare, setShowCompare] = useState(false)

  const network = useMemo(() => computeNetwork(ALL), [ALL])
  const derivedAll = useMemo(() => computeDerived(ALL, network), [ALL, network])
  const AUDITORS = useMemo(
    () => Array.from(new Set(ALL.flatMap((l) => l.auditores))).sort(),
    [ALL],
  )
  const totalLocales = ALL.length

  const filtered = useMemo(() => {
    let result = derivedAll
    if (search) result = result.filter((d) => d.loc.name.toLowerCase().includes(search.toLowerCase()))
    if (auditorFilter) result = result.filter((d) => d.loc.auditores.includes(auditorFilter))
    return result
  }, [derivedAll, search, auditorFilter])

  const selected = selectedId ? derivedAll.find((d) => d.loc.id === selectedId) ?? null : null

  if (ALL.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Volver</span>
            </Link>
            <div className="h-5 w-px bg-gray-300" />
            <h1 className="text-lg font-bold text-red-600">Pizarra - Dashboard Q2 2026</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <Activity className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-gray-600">Aún no hay auditorías Q2 2026 con resultados cargados.</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculations for KPIs
  const localesEnObjetivo = derivedAll.filter(d => d.loc.global >= 80).length
  const requierenIntervencion = derivedAll.filter(d => d.loc.riesgo === "alto" || d.loc.salon < 65 || d.loc.cocina < 65 || d.loc.calidad < 65)
  const benchmarks = derivedAll.filter(d => d.loc.global >= 90)
  
  const avgSalon = network.avgSalon
  const avgCocina = network.avgCocina
  const avgCalidad = network.avgCalidad
  const weakestArea: { area: string; avg: number } = 
    avgSalon <= avgCocina && avgSalon <= avgCalidad ? { area: "Salón", avg: avgSalon } :
    avgCocina <= avgCalidad ? { area: "Cocina", avg: avgCocina } : { area: "Calidad", avg: avgCalidad }

  const sorted = [...derivedAll].sort((a, b) => b.loc.global - a.loc.global)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  const gap = best.loc.global - worst.loc.global

  // Band distribution using official bands (audited only; no empty/pending segments)
  const bandData = BANDS.map((b) => ({
    name: b.label,
    range: b.range,
    count: derivedAll.filter((d) => bandFor(d.loc.global).key === b.key).length,
    color: b.color,
  })).filter((b) => b.count > 0)

  // Deterministic executive diagnosis
  const diagnosis = buildDiagnosis(derivedAll, network, dashboard.coverage, dashboard.scope)

  const toggleExpand = (id: string) => {
    const next = new Set(expandedRows)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedRows(next)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Volver</span>
            </Link>
            <div className="h-5 w-px bg-gray-300" />
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#B5123F" }}>Pizarra de Auditorías Trimestrales</h1>
              <p className="text-[11px] text-gray-500">Q2 2026 · Actualizado {dashboard.lastUpdated}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${dashboard.periodStatus === "Cerrado" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
              {dashboard.periodStatus}
            </span>
            <span className="text-xs text-gray-500 hidden sm:inline">{totalLocales} de {dashboard.universe} auditados</span>
          </div>
        </div>
      </header>

      {/* NAVEGACIÓN PRINCIPAL POR PESTAÑAS */}
      <div className="sticky top-[57px] z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
          {([
            { key: "resumen", label: "Resumen" },
            { key: "hallazgos", label: "Hallazgos", badge: dashboard.networkFindings.length },
            { key: "evolucion", label: "Evolución" },
            { key: "auditores", label: "Auditores", badge: dashboard.auditors.length },
            { key: "datos", label: "Estado de datos" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setMainTab(t.key)}
              className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                mainTab === t.key
                  ? "border-[#B5123F] text-[#B5123F]"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
              {"badge" in t && t.badge ? (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${mainTab === t.key ? "bg-[#B5123F] text-white" : "bg-gray-100 text-gray-600"}`}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">

        {mainTab === "hallazgos" && <HallazgosTab findings={dashboard.networkFindings} />}
        {mainTab === "evolucion" && <EvolucionTab evolution={dashboard.evolution} />}
        {mainTab === "auditores" && <AuditoresTab auditors={dashboard.auditors} />}
        {mainTab === "datos" && <EstadoDatosTab integrity={dashboard.integrity} dashboard={dashboard} />}

        {mainTab === "resumen" && (
        <>
        {/* COBERTURA DEL TRIMESTRE */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Cobertura del trimestre</h2>
              <p className="text-xs text-gray-600">
                {totalLocales} de {dashboard.universe} locales auditados · {dashboard.coverage}% de cobertura
              </p>
            </div>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
              {dashboard.scope}
            </span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full" style={{ width: `${dashboard.coverage}%`, backgroundColor: "#B5123F" }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><div className="text-lg font-bold text-gray-900">{dashboard.universe}</div><div className="text-[11px] uppercase text-gray-500">Universo esperado</div></div>
            <div><div className="text-lg font-bold text-emerald-600">{totalLocales}</div><div className="text-[11px] uppercase text-gray-500">Auditados válidos</div></div>
            <div><div className="text-lg font-bold text-amber-600">{dashboard.pending.length}</div><div className="text-[11px] uppercase text-gray-500">Pendientes</div></div>
            <div><div className="text-lg font-bold" style={{ color: "#B5123F" }}>{dashboard.coverage}%</div><div className="text-[11px] uppercase text-gray-500">Cobertura</div></div>
          </div>
          {dashboard.coverage < 100 && (
            <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              Los resultados representan a los locales auditados y no constituyen todavía una lectura definitiva de toda la red.
            </p>
          )}
        </div>

        {/* KPIs con lenguaje humano */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Promedio de red */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase">
              <Activity className="h-4 w-4" /> Promedio de red
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-red-600">{network.avgGlobal}</span>
              <span className="text-sm text-gray-400">/ 100</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">{localesEnObjetivo} de {totalLocales} locales en objetivo (80+)</p>
          </div>

          {/* Requieren intervención */}
          <div className={`rounded-xl border p-4 ${requierenIntervencion.length > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Requieren intervención
            </div>
            <div className="mt-2">
              <span className={`text-3xl font-bold ${requierenIntervencion.length > 0 ? "text-red-600" : "text-gray-400"}`}>
                {requierenIntervencion.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-600 truncate">
              {requierenIntervencion.length > 0 
                ? requierenIntervencion.map(d => d.loc.name).join(", ")
                : "Todos los locales estables"}
            </p>
          </div>

          {/* Área más débil */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase">
              <TrendingDown className="h-4 w-4 text-orange-500" /> Área más débil
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-orange-600">{weakestArea.area}</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">Promedio red: {weakestArea.avg} pts</p>
          </div>

          {/* Benchmarks */}
          <div className={`rounded-xl border p-4 ${benchmarks.length > 0 ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase">
              <Trophy className="h-4 w-4 text-emerald-500" /> Benchmarks (90+)
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold text-emerald-600">{benchmarks.length}</span>
            </div>
            <p className="mt-1 text-xs text-gray-600 truncate">
              {benchmarks.length > 0 ? benchmarks.map(d => d.loc.name).join(", ") : "Ninguno aún"}
            </p>
          </div>
        </div>

        {/* Dispersión de la red */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-gray-500 uppercase">Brecha de la red:</span>
              <span className="ml-2 text-lg font-bold text-gray-900">{gap} pts</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div><span className="text-gray-500">Mejor:</span> <span className="font-semibold text-emerald-600">{best.loc.name} ({best.loc.global})</span></div>
              <div><span className="text-gray-500">Mayor oportunidad:</span> <span className="font-semibold text-red-600">{worst.loc.name} ({worst.loc.global})</span></div>
            </div>
            <button onClick={() => setShowCompare(!showCompare)} 
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
              Comparar locales
            </button>
          </div>
        </div>

        {/* Comparador */}
        {showCompare && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <select value={compareA} onChange={e => setCompareA(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
                <option value="">Seleccionar Local A</option>
                {ALL.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <span className="text-gray-500 font-medium">vs</span>
              <select value={compareB} onChange={e => setCompareB(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
                <option value="">Seleccionar Local B</option>
                {ALL.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            {compareA && compareB && <CompareView a={derivedAll.find(d => d.loc.id === compareA)!} b={derivedAll.find(d => d.loc.id === compareB)!} />}
          </div>
        )}

        {/* Distribución por banda + Diagnóstico ejecutivo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dona distribución */}
          <div className="lg:col-span-4 rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Distribución por banda</h3>
            <div className="relative h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bandData} dataKey="count" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {bandData.map((b) => <Cell key={b.name} fill={b.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{totalLocales}</span>
                <span className="text-[11px] text-gray-500">locales auditados</span>
              </div>
            </div>
            <div className="mt-2 space-y-1.5">
              {bandData.map((b) => (
                <div key={b.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: b.color }} />
                    <span className="text-gray-700">{b.name}</span>
                    <span className="text-gray-400">({b.range})</span>
                  </span>
                  <span className="text-gray-600">{b.count} · {Math.round((b.count / totalLocales) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnóstico ejecutivo */}
          <div className="lg:col-span-8 rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">Diagnóstico ejecutivo</h3>
            <p className="text-xs text-gray-500 mb-3">{diagnosis.scope}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DiagBlock title="Situación general" items={diagnosis.generalSituation} color="#374151" />
              <DiagBlock title="Fortalezas" items={diagnosis.strengths} color="#2E7D32" />
              <DiagBlock title="Riesgos" items={diagnosis.risks} color="#C62828" />
              <DiagBlock title="Implicancia operativa" items={diagnosis.operationalImplications} color="#D97706" />
            </div>
            {diagnosis.priorities.length > 0 && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="text-[11px] font-semibold uppercase text-gray-500 mb-1.5">Prioridades</div>
                <ul className="space-y-1 text-sm text-gray-700">
                  {diagnosis.priorities.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Intervenciones urgentes */}
        {requierenIntervencion.length > 0 && (
          <div className="rounded-xl border-2 border-red-300 bg-white overflow-hidden">
            <div className="bg-red-600 px-4 py-2">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <AlertOctagon className="h-5 w-5" /> Intervenciones requeridas esta semana
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {requierenIntervencion.map(d => (
                <div key={d.loc.id} className="p-4 border-l-4 border-l-red-500 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedId(d.loc.id)}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{d.loc.name}</div>
                      <div className="text-xs text-red-600 mt-1">
                        {d.loc.riesgo === "alto" && "Riesgo ALTO"}
                        {d.loc.salon < 65 && ` | Salón: ${d.loc.salon}`}
                        {d.loc.cocina < 65 && ` | Cocina: ${d.loc.cocina}`}
                        {d.loc.calidad < 65 && ` | Calidad: ${d.loc.calidad}`}
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{d.loc.accionRequerida}</p>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: scoreColor(d.loc.global) }}>{d.loc.global}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {requierenIntervencion.length === 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <span className="text-emerald-700 font-medium">Sin intervenciones urgentes esta semana</span>
          </div>
        )}

        {/* Benchmarks de la red */}
        {benchmarks.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 overflow-hidden">
            <div className="bg-emerald-100 px-4 py-2 border-b border-emerald-200">
              <h3 className="text-emerald-800 font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5" /> Benchmarks de la red
                <span className="text-xs font-normal text-emerald-600 ml-2">Sus prácticas pueden replicarse</span>
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {benchmarks.slice(0, 3).map(d => (
                <div key={d.loc.id} onClick={() => setSelectedId(d.loc.id)}
                  className="bg-white rounded-lg border border-emerald-200 p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{d.loc.name}</span>
                    <span className="text-2xl font-bold text-emerald-600">{d.loc.global}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Área más fuerte: <span className="font-medium text-emerald-600">{AREA_LABEL[d.strongest]} ({d.loc[d.strongest]})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs + Filtros */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-3">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setTab("heatmap")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 ${tab === "heatmap" ? "bg-white shadow-sm" : "text-gray-500"}`}>
                <Grid3X3 className="h-3.5 w-3.5" /> Mapa de Calor
              </button>
              <button onClick={() => setTab("ranking")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 ${tab === "ranking" ? "bg-white shadow-sm" : "text-gray-500"}`}>
                <BarChart3 className="h-3.5 w-3.5" /> Ranking
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar local..."
                  className="h-8 w-36 pl-8 pr-3 text-xs border border-gray-200 rounded-md" />
              </div>
              <select value={auditorFilter} onChange={e => setAuditorFilter(e.target.value)}
                className="h-8 px-2 text-xs border border-gray-200 rounded-md bg-white">
                <option value="">Todos los auditores</option>
                {AUDITORS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {(search || auditorFilter) && (
                <button onClick={() => { setSearch(""); setAuditorFilter("") }}
                  className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 rounded-md border border-red-200">
                  Limpiar
                </button>
              )}
              <span className="text-xs text-gray-500">Mostrando {filtered.length} de {totalLocales}</span>
            </div>
          </div>

          <div className="p-4">
            {tab === "heatmap" && <HeatmapView filtered={filtered} onSelect={setSelectedId} />}
            {tab === "ranking" && <RankingView filtered={filtered} onSelect={setSelectedId} />}
          </div>
        </div>

        {/* Tabla completa simplificada */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-8">
          <div className="border-b border-gray-200 px-4 py-3">
            <h3 className="font-semibold">Todos los Locales</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-4 py-3">#</th>
                  <th className="py-3">Local</th>
                  <th className="py-3 text-center">Global</th>
                  <th className="py-3 text-center">Áreas</th>
                  <th className="py-3">Riesgo</th>
                  <th className="py-3">Acción requerida</th>
                  <th className="py-3 text-center">PDF</th>
                  <th className="py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...filtered].sort((a,b) => b.loc.global - a.loc.global).map((d) => (
                  <Fragment key={d.loc.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">#{d.rank}</td>
                      <td className="py-3 font-medium cursor-pointer hover:text-red-600" onClick={() => setSelectedId(d.loc.id)}>
                        {d.loc.name}
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-lg font-bold" style={{ color: scoreColor(d.loc.global) }}>{d.loc.global}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-center gap-1">
                          {(["salon", "cocina", "calidad"] as AreaKey[]).map(a => {
                            const style = heatCell(d.loc[a])
                            return (
                              <span key={a} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                                style={{ background: style.bg, color: style.text }}
                                title={`${AREA_LABEL[a]}: ${d.loc[a]}`}>
                                {d.loc[a]}
                              </span>
                            )
                          })}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`rounded border px-2 py-0.5 text-xs ${riskBadge[d.loc.riesgo]}`}>{d.loc.riesgo}</span>
                      </td>
                      <td className="py-3 max-w-[200px]">
                        <span className="text-xs text-gray-600 truncate block" title={d.loc.accionRequerida}>
                          {d.loc.accionRequerida.length > 40 ? d.loc.accionRequerida.slice(0, 40) + "..." : d.loc.accionRequerida}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <a href={d.loc.pdfUrl || "#"} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 inline-flex">
                          <FileText className="h-4 w-4" />
                        </a>
                      </td>
                      <td className="py-3">
                        <button onClick={() => toggleExpand(d.loc.id)} className="p-1 hover:bg-gray-100 rounded">
                          {expandedRows.has(d.loc.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(d.loc.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div><span className="text-gray-500">Salón:</span> <span className="font-semibold">{d.loc.salon}</span></div>
                            <div><span className="text-gray-500">Cocina:</span> <span className="font-semibold">{d.loc.cocina}</span></div>
                            <div><span className="text-gray-500">Calidad:</span> <span className="font-semibold">{d.loc.calidad}</span></div>
                            <div><span className="text-gray-500">Auditores:</span> <span className="font-semibold">{d.loc.auditores.join(", ")}</span></div>
                            <div><span className="text-gray-500">Fecha:</span> <span className="font-semibold">{d.loc.fecha}</span></div>
                            <div><span className="text-gray-500">Fortalezas:</span> <span className="font-semibold text-emerald-600">{d.loc.fortalezas}</span></div>
                            <div><span className="text-gray-500">No cumple:</span> <span className="font-semibold text-red-600">{d.loc.noCumple}</span></div>
                            <div><span className="text-gray-500">Observaciones:</span> <span className="font-semibold">{d.loc.observaciones}</span></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOCALES PENDIENTES DE AUDITORÍA */}
        {dashboard.pending.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">Locales pendientes de auditoría ({dashboard.pending.length})</h3>
            <p className="text-xs text-gray-500 mb-3">Forman parte del universo del trimestre pero aún no registran auditoría Q2 2026.</p>
            <div className="flex flex-wrap gap-2">
              {dashboard.pending.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {p.name}
                  <span className="text-[10px] uppercase text-amber-600">Pendiente Q2</span>
                </span>
              ))}
            </div>
          </div>
        )}
        </>
        )}
      </main>

      {selected && <Detail d={selected} network={network} onClose={() => setSelectedId(null)} dashboard={dashboard} />}
    </div>
  )
}

function DiagBlock({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase mb-1.5" style={{ color }}>{title}</div>
      <ul className="space-y-1 text-sm text-gray-700">
        {items.map((t, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CompareView({ a, b }: { a: Derived; b: Derived }) {
  const metrics = [
    { label: "Global", va: a.loc.global, vb: b.loc.global },
    { label: "Salón", va: a.loc.salon, vb: b.loc.salon },
    { label: "Cocina", va: a.loc.cocina, vb: b.loc.cocina },
    { label: "Calidad", va: a.loc.calidad, vb: b.loc.calidad },
    { label: "Fortalezas", va: a.loc.fortalezas, vb: b.loc.fortalezas },
    { label: "No cumple", va: a.loc.noCumple, vb: b.loc.noCumple, invert: true },
  ]
  const globalGap = Math.abs(a.loc.global - b.loc.global)
  const areaGaps = [
    { area: "Salón", gap: Math.abs(a.loc.salon - b.loc.salon) },
    { area: "Cocina", gap: Math.abs(a.loc.cocina - b.loc.cocina) },
    { area: "Calidad", gap: Math.abs(a.loc.calidad - b.loc.calidad) },
  ].sort((x, y) => y.gap - x.gap)

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div className="font-semibold text-lg">{a.loc.name}</div>
        <div className="text-gray-500">vs</div>
        <div className="font-semibold text-lg">{b.loc.name}</div>
      </div>
      <div className="space-y-2">
        {metrics.map(m => {
          const better = m.invert ? (m.va < m.vb ? "a" : m.vb < m.va ? "b" : null) : (m.va > m.vb ? "a" : m.vb > m.va ? "b" : null)
          return (
            <div key={m.label} className="grid grid-cols-3 gap-4 text-center py-1 border-b border-blue-100">
              <div className={`font-semibold ${better === "a" ? "text-emerald-600" : ""}`}>{m.va}</div>
              <div className="text-xs text-gray-500">{m.label}</div>
              <div className={`font-semibold ${better === "b" ? "text-emerald-600" : ""}`}>{m.vb}</div>
            </div>
          )
        })}
      </div>
      <p className="mt-4 text-sm text-gray-700">
        <strong>Brecha global:</strong> {globalGap} puntos. <strong>Área con mayor diferencia:</strong> {areaGaps[0].area} ({areaGaps[0].gap} pts)
      </p>
    </div>
  )
}

function HeatmapView({ filtered, onSelect }: { filtered: Derived[]; onSelect: (id: string) => void }) {
  const ranked = [...filtered].sort((a, b) => b.loc.global - a.loc.global)
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-xs uppercase text-gray-500">
            <th className="text-left pb-3 pr-4">Local</th>
            <th className="text-center pb-3 px-2">Salón</th>
            <th className="text-center pb-3 px-2">Cocina</th>
            <th className="text-center pb-3 px-2">Calidad</th>
            <th className="text-center pb-3 pl-4">Global</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((d) => (
            <tr key={d.loc.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelect(d.loc.id)}>
              <td className="py-2 pr-4 font-medium">{d.loc.name}</td>
              {(["salon", "cocina", "calidad"] as AreaKey[]).map((a) => {
                const s = heatCell(d.loc[a])
                return (
                  <td key={a} className="py-2 px-2">
                    <div className="rounded-lg py-2 text-center text-sm font-semibold flex items-center justify-center gap-1"
                      style={{ background: s.bg, color: s.text }}>
                      {d.loc[a] < 65 && <AlertTriangle className="h-3.5 w-3.5" />}
                      {d.loc[a]}
                    </div>
                  </td>
                )
              })}
              <td className="py-2 pl-4">
                <div className="rounded-lg py-2 text-center text-base font-bold"
                  style={{ background: heatCell(d.loc.global).bg, color: heatCell(d.loc.global).text }}>
                  {d.loc.global}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RankingView({ filtered, onSelect }: { filtered: Derived[]; onSelect: (id: string) => void }) {
  const ranked = [...filtered].sort((a, b) => b.loc.global - a.loc.global)
  return (
    <div className="space-y-2">
      {ranked.map((d) => (
        <button key={d.loc.id} onClick={() => onSelect(d.loc.id)}
          className="flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-white p-3 hover:border-red-200 hover:bg-gray-50 text-left">
          <span className="w-8 text-center text-sm text-gray-400 font-medium">#{d.rank}</span>
          <span className="flex-1 font-medium">{d.loc.name}</span>
          <div className="flex gap-1">
            {(["salon", "cocina", "calidad"] as AreaKey[]).map(a => {
              const s = heatCell(d.loc[a])
              return (
                <span key={a} className="w-8 h-8 rounded flex items-center justify-center text-xs font-semibold"
                  style={{ background: s.bg, color: s.text }}>
                  {d.loc[a]}
                </span>
              )
            })}
          </div>
          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${d.loc.global}%`, background: scoreColor(d.loc.global) }} />
          </div>
          <span className="w-10 text-right text-lg font-bold" style={{ color: scoreColor(d.loc.global) }}>{d.loc.global}</span>
        </button>
      ))}
    </div>
  )
}

function Detail({ d, network, onClose, dashboard }: { d: Derived; network: ReturnType<typeof computeNetwork>; onClose: () => void; dashboard: Q2Dashboard }) {
  const radarData = [
    { area: "Salón", v: d.loc.salon, avg: network.avgSalon },
    { area: "Cocina", v: d.loc.cocina, avg: network.avgCocina },
    { area: "Calidad", v: d.loc.calidad, avg: network.avgCalidad },
  ]
  const findings = dashboard.findingsByLocation[d.loc.id] ?? []
  const noCumple = findings.filter((f) => f.ratingValue !== null && f.ratingValue < 0)
  const conObs = findings.filter((f) => f.observation && f.observation.trim() !== "")
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <aside className="w-full max-w-md bg-white border-l border-gray-200 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{d.loc.name}</h2>
            <p className="text-xs text-gray-500">{d.loc.fecha} - Auditores: {d.loc.auditores.join(", ")}</p>
            <div className="flex gap-2 mt-2">
              <span className={`rounded border px-2 py-0.5 text-xs ${tierClass[d.tier]}`} title={tierDesc[d.tier]}>{d.tier}</span>
              <span className={`rounded border px-2 py-0.5 text-xs ${riskBadge[d.loc.riesgo]}`}>{d.loc.riesgo}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {[
              { l: "Global", v: d.loc.global, r: network.avgGlobal },
              { l: "Salón", v: d.loc.salon, r: network.avgSalon },
              { l: "Cocina", v: d.loc.cocina, r: network.avgCocina },
              { l: "Calidad", v: d.loc.calidad, r: network.avgCalidad },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border border-gray-200 p-2 text-center">
                <div className="text-[9px] uppercase text-gray-500">{s.l}</div>
                <div className="text-lg font-bold" style={{ color: scoreColor(s.v) }}>{s.v}</div>
                <div className="text-[10px]" style={{ color: s.v >= s.r ? "#16a34a" : "#dc2626" }}>
                  {s.v >= s.r ? "+" : ""}{(s.v - s.r).toFixed(1)} vs red
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs font-semibold uppercase text-gray-500 mb-1">Diagnóstico</div>
            <p className="text-sm">{d.insight}</p>
          </div>

          <div className="h-48">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#9ca3af" }} />
                <Radar name="Local" dataKey="v" stroke="#dc2626" fill="#dc2626" fillOpacity={0.4} />
                <Radar name="Red" dataKey="avg" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
              <div className="flex items-center gap-1 text-[10px] uppercase text-emerald-600"><TrendingUp className="h-3 w-3" /> Fortaleza</div>
              <div className="font-semibold">{AREA_LABEL[d.strongest]}</div>
              <div className="text-xl font-bold text-emerald-600">{d.loc[d.strongest]}</div>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <div className="flex items-center gap-1 text-[10px] uppercase text-red-600"><TrendingDown className="h-3 w-3" /> Debilidad</div>
              <div className="font-semibold">{AREA_LABEL[d.weakest]}</div>
              <div className="text-xl font-bold text-red-600">{d.loc[d.weakest]}</div>
            </div>
          </div>

          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <div className="flex items-center gap-1 text-[10px] uppercase text-red-600"><Target className="h-3 w-3" /> Acción Requerida</div>
            <p className="text-sm font-medium text-red-700 mt-1">{d.loc.accionRequerida}</p>
          </div>

          {/* HALLAZGOS POR ÍTEM */}
          <div className="rounded-lg border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-600">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Hallazgos del local
              </div>
              <div className="flex gap-2 text-[11px]">
                <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600">{noCumple.length} no cumple</span>
                <span className="rounded bg-gray-50 px-1.5 py-0.5 text-gray-600">{conObs.length} obs.</span>
              </div>
            </div>
            {findings.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-gray-500">Sin hallazgos ni observaciones registradas por ítem.</p>
            ) : (
              <ul className="max-h-64 divide-y divide-gray-50 overflow-y-auto">
                {findings.map((f, i) => {
                  const tone = ratingTone(f.ratingValue)
                  return (
                    <li key={`${f.itemId}-${i}`} className="px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{f.itemLabel}</div>
                          <div className="text-[11px] text-gray-500">{f.areaLabel} · {f.categoryLabel}</div>
                        </div>
                        <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${tone.bg} ${tone.text} ${tone.border}`}>
                          {f.ratingLabel ?? tone.label}
                        </span>
                      </div>
                      {f.observation && f.observation.trim() !== "" && (
                        <p className="mt-1 rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">{f.observation}</p>
                      )}
                      {f.photoUrl && (
                        <a href={f.photoUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                          <ImageIcon className="h-3 w-3" /> Ver foto adjunta
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* DESCARGAS */}
          <div className="space-y-2">
            <a href={d.loc.pdfUrl || "#"} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#B5123F] hover:opacity-90 text-white font-semibold rounded-lg transition-opacity">
              <FileText className="h-5 w-5" />
              Descargar Informe PDF
            </a>
            <ReportActionPlaceholder />
          </div>
        </div>
      </aside>
    </div>
  )
}

// Disabled DOCX export. The generation pipeline is not wired yet; this keeps the
// affordance visible without faking a download.
function ReportActionPlaceholder() {
  return (
    <button
      type="button"
      disabled
      title="La exportación a Word estará disponible próximamente"
      className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-3 text-sm font-medium text-gray-400"
    >
      <FileDown className="h-4 w-4" />
      Exportar a Word (DOCX)
      <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] uppercase text-gray-500">Próximamente</span>
    </button>
  )
}
