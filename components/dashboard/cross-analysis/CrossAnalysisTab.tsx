"use client"

import { useState } from "react"
import { Building2, Network, MapPin, CalendarClock, ShieldCheck, Info } from "lucide-react"
import { SNAPSHOT } from "@/lib/dashboard/cross-analysis/dataset"
import SubDireccion from "./SubDireccion"
import SubRiesgos from "./SubRiesgos"
import SubLocales from "./SubLocales"
import SubSeguimiento from "./SubSeguimiento"
import SubCalidad from "./SubCalidad"

type SubView = "direccion" | "riesgos" | "locales" | "seguimiento" | "calidad"

const SUBVIEWS: { key: SubView; label: string; icon: typeof Building2 }[] = [
  { key: "direccion", label: "Dirección", icon: Building2 },
  { key: "riesgos", label: "Riesgos de red", icon: Network },
  { key: "locales", label: "Locales", icon: MapPin },
  { key: "seguimiento", label: "Seguimiento", icon: CalendarClock },
  { key: "calidad", label: "Calidad del control", icon: ShieldCheck },
]

export default function CrossAnalysisTab() {
  const [sub, setSub] = useState<SubView>("direccion")

  return (
    <div className="space-y-5">
      {/* Banner de método y alcance */}
      <div className="flex flex-wrap items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold">
            Análisis cruzado {SNAPSHOT.quarter} {SNAPSHOT.year} — {SNAPSHOT.analyzedReports} de {SNAPSHOT.networkSize} locales
          </p>
          <p className="mt-0.5 text-blue-800/80 text-[13px] leading-relaxed text-pretty">
            Cruza la auditoría trimestral con {SNAPSHOT.filloutVisits.toLocaleString("es-AR")} visitas Fillout ({SNAPSHOT.filloutFrom}–{SNAPSHOT.filloutTo}) y {SNAPSHOT.productTests} pruebas de producto.
            Los valores son una lectura editorial validada; no reemplazan el puntaje oficial de cada auditoría.
          </p>
        </div>
      </div>

      {/* Subnavegación */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {SUBVIEWS.map((v) => {
          const Icon = v.icon
          const active = sub === v.key
          return (
            <button
              key={v.key}
              onClick={() => setSub(v.key)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "border-[#B5123F] text-[#B5123F]" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {v.label}
            </button>
          )
        })}
      </div>

      {sub === "direccion" && <SubDireccion onNavigate={setSub} />}
      {sub === "riesgos" && <SubRiesgos />}
      {sub === "locales" && <SubLocales />}
      {sub === "seguimiento" && <SubSeguimiento />}
      {sub === "calidad" && <SubCalidad />}
    </div>
  )
}
