"use client"

import { Users, UserCheck, AlertTriangle } from "lucide-react"
import type { AuditorStat } from "@/lib/q2-data"

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

export default function AuditoresTab({ auditors }: { auditors: AuditorStat[] }) {
  if (auditors.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
        Aún no hay datos de auditores en el trimestre.
      </div>
    )
  }

  // Network calibration reference: average exceptional rate across auditors.
  const avgExcep = +(auditors.reduce((a, s) => a + s.exceptionalRate, 0) / auditors.length).toFixed(1)
  const avgSever = +(auditors.reduce((a, s) => a + s.severityRate, 0) / auditors.length).toFixed(1)
  const maxParticip = Math.max(...auditors.map((a) => a.participations))

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Control de auditores</h2>
        <p className="text-xs text-gray-600 max-w-2xl">
          Participaciones, coauditorías y tasas de criterio por auditor. La calibración compara la severidad y
          excepcionalidad de cada uno contra el promedio de la red, para detectar criterios demasiado laxos o
          estrictos.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <div className="text-lg font-bold text-gray-900">{auditors.length}</div>
            <div className="text-[11px] uppercase text-gray-500">Auditores activos</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{auditors.reduce((a, s) => a + s.participations, 0)}</div>
            <div className="text-[11px] uppercase text-gray-500">Participaciones</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{avgExcep}%</div>
            <div className="text-[11px] uppercase text-gray-500">Excepcional (red)</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{avgSever}%</div>
            <div className="text-[11px] uppercase text-gray-500">Severidad (red)</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {auditors.map((a) => {
          const excepDelta = +(a.exceptionalRate - avgExcep).toFixed(1)
          const severDelta = +(a.severityRate - avgSever).toFixed(1)
          const calibration =
            Math.abs(excepDelta) <= 5 && Math.abs(severDelta) <= 5
              ? { label: "Calibrado", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" }
              : excepDelta > 5 && severDelta < -5
                ? { label: "Criterio laxo", tone: "text-amber-700 bg-amber-50 border-amber-200" }
                : severDelta > 5
                  ? { label: "Criterio estricto", tone: "text-blue-700 bg-blue-50 border-blue-200" }
                  : { label: "Revisar calibración", tone: "text-gray-700 bg-gray-50 border-gray-200" }

          return (
            <div key={a.name} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                    {a.name.charAt(0)}
                  </span>
                  <div>
                    <div className="font-semibold text-gray-900">{a.name}</div>
                    <div className="text-xs text-gray-500">{a.participations} locales auditados</div>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${calibration.tone}`}>
                  {calibration.label}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="flex items-center justify-center gap-1 text-[10px] uppercase text-gray-500">
                    <Users className="h-3 w-3" /> Coaudit.
                  </div>
                  <div className="text-base font-bold text-gray-900">{a.coaudits}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="flex items-center justify-center gap-1 text-[10px] uppercase text-gray-500">
                    <UserCheck className="h-3 w-3" /> Solo
                  </div>
                  <div className="text-base font-bold text-gray-900">{a.solo}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <div className="flex items-center justify-center gap-1 text-[10px] uppercase text-gray-500">
                    <AlertTriangle className="h-3 w-3" /> Ítems
                  </div>
                  <div className="text-base font-bold text-gray-900">{a.totalItems}</div>
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                <Rate label="Excepcionalidad" value={a.exceptionalRate} delta={excepDelta} color="#1D4ED8" max={100} />
                <Rate label="Cumplimiento" value={a.complianceRate} delta={null} color="#16A34A" max={100} />
                <Rate label="Severidad" value={a.severityRate} delta={severDelta} color="#DC2626" max={100} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Rate({ label, value, delta, color, max }: { label: string; value: number; delta: number | null; color: string; max: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900">{value}%</span>
          {delta !== null && (
            <span className={delta > 0 ? "text-blue-600" : delta < 0 ? "text-red-600" : "text-gray-400"}>
              {delta > 0 ? "+" : ""}
              {delta} vs red
            </span>
          )}
        </span>
      </div>
      <Bar value={value} max={max} color={color} />
    </div>
  )
}
