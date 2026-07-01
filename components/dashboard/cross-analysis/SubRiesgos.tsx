"use client"

import { useState } from "react"
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts"
import { NETWORK_THEMES, LOCATIONS } from "@/lib/dashboard/cross-analysis/dataset"
import { THEME_LABELS, PRIORITY_FILL, PRIORITY_LABELS, formatPct } from "@/lib/dashboard/cross-analysis/format"

const points = LOCATIONS.map((l) => ({
  name: l.name,
  x: l.quarterlyAudit.global,
  y: l.topDailyIncidence,
  z: l.quarterlyAudit.critical + l.quarterlyAudit.nonCompliant,
  theme: l.topIncidenceTheme,
  priority: l.priority,
}))

const avgGlobal = points.reduce((s, p) => s + p.x, 0) / (points.length || 1)
const avgIncidence = points.reduce((s, p) => s + p.y, 0) / (points.length || 1)

export default function SubRiesgos() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Matriz de riesgo */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-1 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Matriz de riesgo: puntaje vs incidencia diaria</h3>
          <span className="text-[11px] text-gray-500">Tamaño = hallazgos negativos</span>
        </div>
        <p className="mb-3 text-[11px] text-gray-500 text-pretty">
          Eje X: puntaje global Q2. Eje Y: mayor incidencia diaria observada en Fillout (%). El cuadrante inferior derecho concentra el mayor riesgo latente.
        </p>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" dataKey="x" name="Global Q2" domain={[60, 100]} tick={{ fontSize: 11 }} label={{ value: "Puntaje global Q2", position: "bottom", fontSize: 11, fill: "#64748b" }} />
              <YAxis type="number" dataKey="y" name="Incidencia diaria" unit="%" tick={{ fontSize: 11 }} label={{ value: "Incidencia diaria %", angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748b" }} />
              <ZAxis type="number" dataKey="z" range={[80, 500]} name="Hallazgos" />
              <ReferenceLine x={avgGlobal} stroke="#cbd5e1" strokeDasharray="4 4" />
              <ReferenceLine y={avgIncidence} stroke="#cbd5e1" strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as (typeof points)[number]
                  return (
                    <div className="rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-lg">
                      <p className="font-semibold text-gray-900">{d.name}</p>
                      <p className="text-gray-600">Global Q2: {d.x}</p>
                      <p className="text-gray-600">Incidencia diaria: {d.y}% ({d.theme})</p>
                      <p className="text-gray-600">Hallazgos negativos: {d.z}</p>
                      <p className="text-gray-600">Prioridad: {PRIORITY_LABELS[d.priority]}</p>
                    </div>
                  )
                }}
              />
              <Scatter data={points}>
                {points.map((p, i) => (
                  <Cell key={i} fill={PRIORITY_FILL[p.priority]} fillOpacity={0.75} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Temas transversales */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Temas transversales de red</h3>
        {NETWORK_THEMES.map((t) => {
          const open = expanded === t.theme
          return (
            <div key={t.theme} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <button
                onClick={() => setExpanded(open ? null : t.theme)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{THEME_LABELS[t.theme]}</p>
                  {t.topLocations.length > 0 && (
                    <p className="mt-0.5 truncate text-[11px] text-gray-500">Foco: {t.topLocations.join(", ")}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {t.percentage != null ? (
                    <span className="text-sm font-bold text-[#B5123F]">{formatPct(t.percentage)}</span>
                  ) : (
                    <span className="text-[11px] text-gray-400">Cualitativo</span>
                  )}
                  <span className="text-gray-400">{open ? "−" : "+"}</span>
                </div>
              </button>
              {open && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 text-sm">
                  {t.negativeResponses != null && (
                    <p className="mb-2 text-[12px] text-gray-600">{t.negativeResponses} respuestas negativas asociadas en Fillout.</p>
                  )}
                  {t.note && <p className="mb-2 text-[12px] italic text-gray-500">{t.note}</p>}
                  {t.risks && t.risks.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-red-600">Riesgos</p>
                      <ul className="list-disc space-y-0.5 pl-4 text-[12px] text-gray-700">
                        {t.risks.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {t.actions && t.actions.length > 0 && (
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Acciones sugeridas</p>
                      <ul className="list-disc space-y-0.5 pl-4 text-[12px] text-gray-700">
                        {t.actions.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}
