"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { LOCATIONS, CLOSURE_TABLE } from "@/lib/dashboard/cross-analysis/dataset"
import { CLOSURE_LABELS, TREND_LABELS } from "@/lib/dashboard/cross-analysis/format"
import type { ClosureStatus } from "@/lib/dashboard/cross-analysis/types"

const PALETTE = ["#B5123F", "#D97706", "#2563EB", "#16A34A", "#7C3AED", "#0891B2", "#DC2626", "#65A30D"]

const chartData = (["abril", "mayo", "junio"] as const).map((m) => {
  const row: Record<string, number | string> = { mes: m.charAt(0).toUpperCase() + m.slice(1) }
  LOCATIONS.forEach((l) => {
    row[l.name] = l.monthlySeries[m]
  })
  return row
})

const closureTone: Record<ClosureStatus, string> = {
  confirmed_closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  sustained_improvement: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial_improvement: "bg-amber-50 text-amber-700 border-amber-200",
  persistent: "bg-red-50 text-red-700 border-red-200",
  reappeared: "bg-red-50 text-red-700 border-red-200",
  immediate_persistence_after_q2: "bg-red-50 text-red-700 border-red-200",
  insufficient_post_audit_evidence: "bg-gray-50 text-gray-600 border-gray-200",
  not_evaluable: "bg-gray-50 text-gray-400 border-gray-200",
}

export default function SubSeguimiento() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900">Evolución mensual de incidencias (abril–junio)</h3>
        <p className="mb-3 text-[11px] text-gray-500 text-pretty">
          Serie de incidencia mensual por local en su tema dominante (vencimientos, salvo Tigre: trazabilidad). Menor es mejor.
        </p>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {LOCATIONS.map((l, i) => (
                <Line key={l.id} type="monotone" dataKey={l.name} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white">
        <header className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Estado de cierre por local</h3>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2 font-medium">Local</th>
                <th className="px-4 py-2 font-medium">Foco de seguimiento</th>
                <th className="px-4 py-2 font-medium">Tendencia</th>
                <th className="px-4 py-2 text-right font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {CLOSURE_TABLE.map((row) => {
                const loc = LOCATIONS.find((l) => l.id === row.id)
                return (
                  <tr key={row.id}>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.label}</td>
                    <td className="px-4 py-2.5 text-gray-600">{loc ? TREND_LABELS[loc.trend] : "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      {loc ? (
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${closureTone[loc.closure]}`}>
                          {CLOSURE_LABELS[loc.closure]}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
