"use client"

import { CheckCircle2, AlertTriangle, Database, FileText, Clock, Send, ShieldX, Copy } from "lucide-react"
import type { DataIntegrity, Q2Dashboard } from "@/lib/q2-data"

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof Database; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs uppercase text-gray-500">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  )
}

export default function EstadoDatosTab({ integrity, dashboard }: { integrity: DataIntegrity; dashboard: Q2Dashboard }) {
  const completeness =
    integrity.totalQ2Audits > 0 ? Math.round((integrity.withGlobalScore / integrity.totalQ2Audits) * 100) : 0
  const hasIssues = integrity.missingScore > 0 || integrity.inProgress > 0 || integrity.duplicateLocations > 0

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Estado de los datos</h2>
        <p className="text-xs text-gray-600 max-w-2xl">
          Transparencia sobre qué se está midiendo. La pizarra solo computa auditorías válidas (no de prueba) con
          puntaje cargado; acá se ve todo lo que quedó dentro y fuera del cálculo.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full" style={{ width: `${completeness}%`, backgroundColor: completeness >= 80 ? "#16A34A" : completeness >= 50 ? "#D97706" : "#DC2626" }} />
          </div>
          <span className="text-sm font-semibold text-gray-900">{completeness}% completo</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Database} label="Auditorías Q2" value={integrity.totalQ2Audits} tone="text-gray-900" />
        <StatCard icon={FileText} label="Con puntaje" value={integrity.withGlobalScore} tone="text-emerald-600" />
        <StatCard icon={Send} label="Enviadas" value={integrity.submitted} tone="text-blue-600" />
        <StatCard icon={Clock} label="En progreso" value={integrity.inProgress} tone="text-amber-600" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={AlertTriangle} label="Sin puntaje" value={integrity.missingScore} tone={integrity.missingScore > 0 ? "text-red-600" : "text-gray-400"} />
        <StatCard icon={ShieldX} label="Excluidas (test)" value={integrity.excludedTest} tone={integrity.excludedTest > 0 ? "text-gray-600" : "text-gray-400"} />
        <StatCard icon={Copy} label="Locales duplicados" value={integrity.duplicateLocations} tone={integrity.duplicateLocations > 0 ? "text-amber-600" : "text-gray-400"} />
        <StatCard icon={CheckCircle2} label="Pendientes red" value={dashboard.pending.length} tone={dashboard.pending.length > 0 ? "text-amber-600" : "text-gray-400"} />
      </div>

      <div className={`rounded-xl border p-4 ${hasIssues ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
        <div className="flex items-center gap-2 mb-2">
          {hasIssues ? (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          )}
          <h3 className={`text-sm font-semibold ${hasIssues ? "text-amber-800" : "text-emerald-800"}`}>
            {hasIssues ? "Observaciones sobre los datos" : "Datos consistentes"}
          </h3>
        </div>
        <ul className="space-y-1.5">
          {integrity.issues.map((issue, i) => (
            <li key={i} className={`flex gap-2 text-sm ${hasIssues ? "text-amber-900" : "text-emerald-900"}`}>
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Metodología de cobertura</h3>
        <p className="text-xs text-gray-600">
          Universo esperado: <span className="font-semibold">{dashboard.universe}</span> locales. Auditados válidos:{" "}
          <span className="font-semibold">{dashboard.audited.length}</span>. Cobertura:{" "}
          <span className="font-semibold">{dashboard.coverage}%</span> ({dashboard.scope}). El estado del período es{" "}
          <span className="font-semibold">{dashboard.periodStatus}</span> y se cierra automáticamente al alcanzar el
          100% de cobertura.
        </p>
      </div>
    </div>
  )
}
