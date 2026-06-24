"use client"

import { useMemo, useState } from "react"
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react"
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts"
import type { EvolutionRow } from "@/lib/q2-data"
import { bandFor } from "@/lib/audit-data"

const QUARTER_ORDER = ["Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026"]

const trendMeta = {
  sube: { icon: TrendingUp, tone: "text-emerald-700 bg-emerald-50 border-emerald-200", label: "Mejora" },
  baja: { icon: TrendingDown, tone: "text-red-700 bg-red-50 border-red-200", label: "Baja" },
  estable: { icon: Minus, tone: "text-gray-700 bg-gray-50 border-gray-200", label: "Estable" },
  nuevo: { icon: Sparkles, tone: "text-blue-700 bg-blue-50 border-blue-200", label: "Nuevo" },
} as const

export default function EvolucionTab({ evolution }: { evolution: EvolutionRow[] }) {
  const [selected, setSelected] = useState<string>(evolution[0]?.name ?? "")

  // Network average per quarter (only quarters with data).
  const networkSeries = useMemo(() => {
    return QUARTER_ORDER.map((q) => {
      const vals = evolution
        .map((r) => r.points.find((p) => p.quarter === q)?.global)
        .filter((v): v is number => v !== null && v !== undefined)
      const avg = vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null
      return { quarter: q.replace(" 20", "'"), Red: avg }
    }).filter((p) => p.Red !== null)
  }, [evolution])

  const selectedRow = evolution.find((r) => r.name === selected)
  const selectedSeries = useMemo(() => {
    if (!selectedRow) return []
    return QUARTER_ORDER.map((q) => {
      const p = selectedRow.points.find((pt) => pt.quarter === q)
      const net = networkSeries.find((n) => n.quarter === q.replace(" 20", "'"))?.Red ?? null
      return { quarter: q.replace(" 20", "'"), Local: p?.global ?? null, Red: net }
    }).filter((p) => p.Local !== null || p.Red !== null)
  }, [selectedRow, networkSeries])

  const mejoras = evolution.filter((r) => r.trend === "sube").length
  const bajas = evolution.filter((r) => r.trend === "baja").length

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Evolución trimestral</h2>
        <p className="text-xs text-gray-600 max-w-2xl">
          Recorrido histórico desde Q3 2025. Los puntos sin dato (p. ej. locales sin auditoría en un trimestre) no se
          interpolan: se omiten para no inventar valores.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <div className="text-lg font-bold text-emerald-600">{mejoras}</div>
            <div className="text-[11px] uppercase text-gray-500">En mejora</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{bajas}</div>
            <div className="text-[11px] uppercase text-gray-500">En baja</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{networkSeries[networkSeries.length - 1]?.Red ?? "—"}</div>
            <div className="text-[11px] uppercase text-gray-500">Promedio red actual</div>
          </div>
        </div>
      </div>

      {/* Network trend */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Promedio de la red por trimestre</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={networkSeries} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip />
              <Line type="monotone" dataKey="Red" stroke="#B5123F" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-local trend */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Trayectoria por local</h3>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs"
          >
            {evolution.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={selectedSeries} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Local" stroke="#1D4ED8" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
              <Line type="monotone" dataKey="Red" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Resumen por local</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Local</th>
                {QUARTER_ORDER.map((q) => (
                  <th key={q} className="px-2 py-3 text-center">
                    {q.replace(" 20", "'")}
                  </th>
                ))}
                <th className="px-4 py-3 text-center">Tendencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {evolution.map((r) => {
                const meta = trendMeta[r.trend]
                const Icon = meta.icon
                return (
                  <tr key={r.name} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{r.name}</td>
                    {QUARTER_ORDER.map((q) => {
                      const v = r.points.find((p) => p.quarter === q)?.global ?? null
                      const band = v !== null ? bandFor(v) : null
                      return (
                        <td key={q} className="px-2 py-2.5 text-center">
                          {v !== null && band ? (
                            <span
                              className="inline-flex h-7 w-9 items-center justify-center rounded-md text-xs font-semibold"
                              style={{ backgroundColor: band.bg, color: band.text }}
                            >
                              {v}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.tone}`}>
                        <Icon className="h-3 w-3" />
                        {r.delta !== null ? `${r.delta > 0 ? "+" : ""}${r.delta}` : meta.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
