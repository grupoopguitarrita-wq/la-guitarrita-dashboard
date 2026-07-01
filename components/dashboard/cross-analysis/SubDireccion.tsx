"use client"

import { AlertOctagon, TrendingUp, Layers, Activity, ArrowRight } from "lucide-react"
import { METRICS, SUGGESTED_ORDER, NETWORK_THEMES, FILLOUT_SIGNALS, LOCATIONS } from "@/lib/dashboard/cross-analysis/dataset"
import { THEME_LABELS, PRIORITY_CLASSES, PRIORITY_LABELS, formatPct } from "@/lib/dashboard/cross-analysis/format"

export default function SubDireccion({ onNavigate }: { onNavigate?: (v: "riesgos" | "locales" | "seguimiento" | "calidad") => void }) {
  const c = METRICS.coverage
  const a = METRICS.q2Averages
  const comp = METRICS.q2Composition
  const byId = new Map(LOCATIONS.map((l) => [l.id, l]))

  const kpis = [
    { label: "Informes analizados", value: `${c.analyzedReports}/${c.networkTotal}`, sub: `${c.auditedQ2} auditados en Q2`, icon: Layers, tone: "text-blue-600" },
    { label: "Promedio global Q2", value: a.global.toFixed(1), sub: `Salón ${a.salon.toFixed(1)} · Cocina ${a.cocina.toFixed(1)} · Calidad ${a.calidad.toFixed(1)}`, icon: TrendingUp, tone: "text-emerald-600" },
    { label: "Hallazgos negativos", value: `${comp.totalNegative}`, sub: `${comp.critical} críticos · ${comp.nonCompliant} no cumple`, icon: AlertOctagon, tone: "text-red-600" },
    { label: "Visitas Fillout", value: c.filloutVisits.toLocaleString("es-AR"), sub: `${c.productTestVisits} pruebas de producto`, icon: Activity, tone: "text-amber-600" },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs de red */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div key={k.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{k.label}</span>
                <Icon className={`h-4 w-4 ${k.tone}`} aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{k.value}</p>
              <p className="mt-1 text-[11px] leading-snug text-gray-500">{k.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orden sugerido de intervención */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Orden sugerido de intervención</h3>
            {onNavigate && (
              <button onClick={() => onNavigate("locales")} className="flex items-center gap-1 text-xs font-medium text-[#B5123F] hover:underline">
                Ver locales <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </header>
          <ol className="divide-y divide-gray-50">
            {SUGGESTED_ORDER.map((id, i) => {
              const loc = byId.get(id)
              if (!loc) return null
              return (
                <li key={id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{loc.name}</p>
                    <p className="truncate text-[11px] text-gray-500">{loc.dominantRisk}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_CLASSES[loc.priority]}`}>
                    {PRIORITY_LABELS[loc.priority]}
                  </span>
                  <span className="w-9 shrink-0 text-right text-sm font-bold text-gray-900">{loc.quarterlyAudit.global}</span>
                </li>
              )
            })}
          </ol>
        </section>

        {/* Temas críticos de red */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Temas críticos de red</h3>
            {onNavigate && (
              <button onClick={() => onNavigate("riesgos")} className="flex items-center gap-1 text-xs font-medium text-[#B5123F] hover:underline">
                Ver riesgos <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </header>
          <ul className="divide-y divide-gray-50">
            {NETWORK_THEMES.slice(0, 5).map((t) => (
              <li key={t.theme} className="px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{THEME_LABELS[t.theme]}</span>
                  {t.percentage != null ? (
                    <span className="text-sm font-bold text-[#B5123F]">{formatPct(t.percentage)}</span>
                  ) : (
                    <span className="text-[11px] text-gray-400">Sin dato cuantificado</span>
                  )}
                </div>
                {t.topLocations.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-gray-500">Foco: {t.topLocations.join(", ")}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Señales Fillout */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Señales Fillout más frecuentes</h3>
        <div className="space-y-2.5">
          {FILLOUT_SIGNALS.map((s) => (
            <div key={s.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-gray-700">{s.label}</span>
                <span className="font-semibold text-gray-900">{s.responses} · {formatPct(s.percentage)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-[#B5123F]" style={{ width: `${Math.min(100, s.percentage)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
