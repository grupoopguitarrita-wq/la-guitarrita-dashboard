"use client"

import { useMemo, useState } from "react"
import { AlertOctagon, AlertTriangle, ChevronDown, ChevronUp, MapPin } from "lucide-react"
import type { NetworkFinding } from "@/lib/q2-data"
import { suggestAction } from "@/lib/dashboard/actions"

export default function HallazgosTab({ findings }: { findings: NetworkFinding[] }) {
  const [areaFilter, setAreaFilter] = useState<string>("")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const areas = useMemo(() => Array.from(new Set(findings.map((f) => f.areaLabel))).sort(), [findings])
  const filtered = useMemo(
    () => (areaFilter ? findings.filter((f) => f.areaLabel === areaFilter) : findings),
    [findings, areaFilter],
  )

  const totalCriticos = findings.reduce((a, f) => a + f.criticalCount, 0)
  const totalNoCumple = findings.reduce((a, f) => a + f.failCount, 0)

  const toggle = (id: string) => {
    const next = new Set(expanded)
    next.has(id) ? next.delete(id) : next.add(id)
    setExpanded(next)
  }

  if (findings.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-emerald-700 font-medium">No se detectan hallazgos transversales.</p>
        <p className="text-sm text-emerald-600 mt-1">Ningún ítem incumple en dos o más locales del conjunto auditado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Hallazgos de red</h2>
            <p className="text-xs text-gray-600 max-w-xl">
              Ítems que incumplen en 2 o más locales a la vez. Indican un patrón sistémico —no un desvío aislado— y
              concentran el mayor impacto al corregirse de forma transversal.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{findings.length}</div>
              <div className="text-[11px] uppercase text-gray-500">Patrones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-700">{totalCriticos}</div>
              <div className="text-[11px] uppercase text-gray-500">Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{totalNoCumple}</div>
              <div className="text-[11px] uppercase text-gray-500">No cumple</div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setAreaFilter("")}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${areaFilter === "" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            Todas las áreas
          </button>
          {areas.map((a) => (
            <button
              key={a}
              onClick={() => setAreaFilter(a)}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${areaFilter === a ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((f) => {
          const isOpen = expanded.has(f.itemId)
          const action = suggestAction(f.areaLabel, f.categoryLabel, f.criticalCount)
          return (
            <div key={f.itemId} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <button
                onClick={() => toggle(f.itemId)}
                className="flex w-full items-start justify-between gap-4 p-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${f.criticalCount > 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}
                  >
                    {f.criticalCount > 0 ? <AlertOctagon className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{f.itemLabel}</div>
                    <div className="text-xs text-gray-500">
                      {f.areaLabel} · {f.categoryLabel}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700">
                    {f.affectedCount} locales
                  </span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-gray-500 mb-1.5">Locales afectados</div>
                    <div className="flex flex-wrap gap-2">
                      {f.locations.map((l) => (
                        <span
                          key={l.name}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${l.ratingValue === -2 ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                        >
                          <MapPin className="h-3 w-3" />
                          {l.name}
                          <span className="text-[10px] uppercase opacity-70">{l.ratingLabel ?? "No cumple"}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                    <div className="text-[11px] font-semibold uppercase text-blue-700 mb-0.5">Acción sugerida</div>
                    <p className="text-sm text-blue-900">{action}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
