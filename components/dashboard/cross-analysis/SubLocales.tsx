"use client"

import { useState } from "react"
import { Star, Clock, CalendarDays, CalendarRange } from "lucide-react"
import { LOCATIONS } from "@/lib/dashboard/cross-analysis/dataset"
import {
  PRIORITY_CLASSES, PRIORITY_LABELS, AGREEMENT_LABELS, TREND_LABELS, CLOSURE_LABELS,
  CONFIDENCE_LABELS, CONFIDENCE_CLASSES, formatVar,
} from "@/lib/dashboard/cross-analysis/format"
import { getReportLink } from "@/lib/report-links"

export default function SubLocales() {
  const [selectedId, setSelectedId] = useState(LOCATIONS[0]?.id ?? "")
  const loc = LOCATIONS.find((l) => l.id === selectedId) ?? LOCATIONS[0]
  if (!loc) return null

  const q = loc.quarterlyAudit
  const f = loc.fillout
  const link = getReportLink(loc.name)

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      {/* Lista */}
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1.5 lg:overflow-visible">
          {LOCATIONS.map((l) => {
            const active = l.id === loc.id
            return (
              <li key={l.id} className="shrink-0 lg:shrink">
                <button
                  onClick={() => setSelectedId(l.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors ${
                    active ? "border-[#B5123F] bg-[#B5123F]/5" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-medium ${active ? "text-[#B5123F]" : "text-gray-900"}`}>{l.name}</p>
                    <p className="text-[10px] text-gray-500">{PRIORITY_LABELS[l.priority]}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-gray-900">{l.quarterlyAudit.global}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* Detalle */}
      <div className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">{loc.name}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_CLASSES[loc.priority]}`}>{PRIORITY_LABELS[loc.priority]}</span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-600 text-pretty">{loc.executiveProfile}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{q.global}</p>
            <p className={`text-xs font-medium ${q.variations.global >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatVar(q.variations.global)} vs Q1</p>
          </div>
        </header>

        {/* Métricas auditoría + Fillout */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: "Salón", v: q.salon, d: q.variations.salon },
            { k: "Cocina", v: q.cocina, d: q.variations.cocina },
            { k: "Calidad", v: q.calidad, d: q.variations.calidad },
          ].map((m) => (
            <div key={m.k} className="rounded-lg border border-gray-200 bg-white p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">{m.k}</p>
              <p className="text-xl font-bold text-gray-900">{m.v}</p>
              <p className={`text-[11px] ${m.d >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatVar(m.d)}</p>
            </div>
          ))}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-amber-700"><Star className="h-3 w-3" /> Fillout</p>
            <p className="text-xl font-bold text-amber-900">{f.averageStars.toFixed(1)}</p>
            <p className="text-[11px] text-amber-700">{f.visits} visitas · {f.productTests} pruebas</p>
          </div>
        </div>

        {/* Lectura de gestión + riesgo dominante */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="text-sm font-semibold text-gray-900">Lectura de gestión</h4>
          <p className="mt-1 text-sm leading-relaxed text-gray-700 text-pretty">{loc.managementReading}</p>
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Riesgo dominante</p>
            <p className="text-sm text-red-800">{loc.dominantRisk}</p>
          </div>
        </section>

        {/* Evidencia cruzada */}
        <div className="grid gap-4 md:grid-cols-3">
          <EvidenceCard title="Hallazgos Q2" items={loc.q2Findings} tone="red" />
          <EvidenceCard title="Evidencia Fillout" items={loc.filloutEvidence} tone="amber" />
          <EvidenceCard title="Post-auditoría" items={loc.postAuditEvidence} tone="blue" />
        </div>

        {/* Plan de acción */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Plan de acción por horizonte</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <ActionColumn icon={Clock} label="Inmediato" items={loc.immediateActions} accent="text-red-600" />
            <ActionColumn icon={CalendarDays} label="7 días" items={loc.sevenDayActions} accent="text-amber-600" />
            <ActionColumn icon={CalendarRange} label="30 días" items={loc.thirtyDayActions} accent="text-emerald-600" />
          </div>
        </section>

        {/* Meta y confianza */}
        <section className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[11px]">
          <span className={`rounded-full border px-2 py-0.5 font-semibold ${CONFIDENCE_CLASSES[loc.confidence]}`}>Confianza: {CONFIDENCE_LABELS[loc.confidence]}</span>
          <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-gray-600">Fuentes: {AGREEMENT_LABELS[loc.sourceAgreement]}</span>
          <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-gray-600">Tendencia: {TREND_LABELS[loc.trend]}</span>
          <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-gray-600">Cierre: {CLOSURE_LABELS[loc.closure]}</span>
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="ml-auto font-medium text-[#B5123F] hover:underline">
              Ver informe en Drive
            </a>
          )}
        </section>
      </div>
    </div>
  )
}

function EvidenceCard({ title, items, tone }: { title: string; items: string[]; tone: "red" | "amber" | "blue" }) {
  const toneClasses: Record<string, string> = {
    red: "border-red-100 text-red-700",
    amber: "border-amber-100 text-amber-700",
    blue: "border-blue-100 text-blue-700",
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className={`mb-2 border-b pb-1.5 text-[11px] font-semibold uppercase tracking-wide ${toneClasses[tone]}`}>{title}</p>
      {items.length === 0 ? (
        <p className="text-[12px] text-gray-400">Sin registros.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it, i) => <li key={i} className="text-[12px] leading-snug text-gray-700">{it}</li>)}
        </ul>
      )}
    </div>
  )
}

function ActionColumn({ icon: Icon, label, items, accent }: { icon: typeof Clock; label: string; items: string[]; accent: string }) {
  return (
    <div>
      <p className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${accent}`}><Icon className="h-3.5 w-3.5" /> {label}</p>
      {items.length === 0 ? (
        <p className="text-[12px] text-gray-400">Sin acciones definidas.</p>
      ) : (
        <ol className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex gap-1.5 text-[12px] leading-snug text-gray-700">
              <span className="font-semibold text-gray-400">{i + 1}.</span> {it}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
