"use client"

import { useState } from "react"
import { ShieldCheck, BookOpen } from "lucide-react"
import { LOCATIONS, BENCHMARKS, SNAPSHOT } from "@/lib/dashboard/cross-analysis/dataset"
import {
  AGREEMENT_LABELS, CONFIDENCE_LABELS, CONFIDENCE_CLASSES,
} from "@/lib/dashboard/cross-analysis/format"

export default function SubCalidad() {
  const [openNotes, setOpenNotes] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Ficha de método */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#B5123F]" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-gray-900">Ficha metodológica del cruce</h3>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Meta label="Versión método" value={SNAPSHOT.methodologyVersion} />
          <Meta label="Corte de datos" value={SNAPSHOT.cutoffDate} />
          <Meta label="Ventana Fillout" value={`${SNAPSHOT.filloutFrom}–${SNAPSHOT.filloutTo}`} />
          <Meta label="Visitas puntuadas" value={`${SNAPSHOT.scoredVisits} / ${SNAPSHOT.filloutVisits}`} />
        </div>
      </section>

      {/* Concordancia y confianza por local */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <header className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Concordancia de fuentes y confianza</h3>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2 font-medium">Local</th>
                <th className="px-4 py-2 font-medium">Auditoría vs Fillout</th>
                <th className="px-4 py-2 font-medium">Confianza</th>
                <th className="px-4 py-2 text-right font-medium">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {LOCATIONS.map((l) => (
                <tr key={l.id} className="align-top">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{l.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{AGREEMENT_LABELS[l.sourceAgreement]}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CONFIDENCE_CLASSES[l.confidence]}`}>
                      {CONFIDENCE_LABELS[l.confidence]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {l.methodologyNotes.length > 0 ? (
                      <button onClick={() => setOpenNotes(openNotes === l.id ? null : l.id)} className="text-[11px] font-medium text-[#B5123F] hover:underline">
                        {openNotes === l.id ? "Ocultar" : `Ver (${l.methodologyNotes.length})`}
                      </button>
                    ) : <span className="text-[11px] text-gray-400">—</span>}
                    {openNotes === l.id && (
                      <ul className="mt-2 space-y-1 text-left text-[11px] text-gray-600">
                        {l.methodologyNotes.map((n, i) => <li key={i} className="rounded bg-gray-50 px-2 py-1">{n}</li>)}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Benchmarks / buenas prácticas */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-gray-900">Referencias y buenas prácticas</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {BENCHMARKS.map((b) => (
            <div key={b.name} className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
              <p className="text-sm font-semibold text-emerald-800">{b.name}</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12px] text-gray-700">
                {b.points.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 font-medium text-gray-900">{value}</p>
    </div>
  )
}
