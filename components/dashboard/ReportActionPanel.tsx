"use client"

import { useEffect, useState, useCallback } from "react"
import {
  FileDown, Loader2, CheckCircle2, AlertTriangle, RefreshCw,
  ServerCrash, Settings, Clock, XCircle, ShieldAlert,
} from "lucide-react"
import type { ReportState, ReportStatus, ValidationIssue } from "@/lib/reports/types"

// ============================================================================
// Panel de acción del informe DOCX dentro del detalle del local.
// Refleja el estado real del backend: not_configured / pending / generating /
// available / stale / failed / invalid. Nunca simula descargas.
// ============================================================================

const STATUS_META: Record<ReportStatus, { label: string; tone: string; icon: React.ElementType; desc: string }> = {
  not_configured: { label: "Servicio no configurado", tone: "bg-gray-100 text-gray-600 border-gray-200", icon: Settings, desc: "El servicio generador de informes aún no está desplegado." },
  pending: { label: "Lista para generar", tone: "bg-blue-50 text-blue-700 border-blue-200", icon: FileDown, desc: "Los datos están validados y listos para generar el informe." },
  queued: { label: "En cola", tone: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, desc: "La solicitud está encolada." },
  generating: { label: "Generando…", tone: "bg-amber-50 text-amber-700 border-amber-200", icon: Loader2, desc: "El informe se está generando." },
  available: { label: "Disponible", tone: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, desc: "El informe DOCX está listo para descargar." },
  stale: { label: "Desactualizado", tone: "bg-orange-50 text-orange-700 border-orange-200", icon: RefreshCw, desc: "Los datos cambiaron desde la última generación. Conviene regenerar." },
  failed: { label: "Falló la generación", tone: "bg-red-50 text-red-700 border-red-200", icon: ServerCrash, desc: "Ocurrió un error al generar el informe." },
  invalid: { label: "Datos incompletos", tone: "bg-red-50 text-red-700 border-red-200", icon: ShieldAlert, desc: "Los datos no pasan la validación; corrígelos antes de generar." },
}

export default function ReportActionPanel({ auditId }: { auditId: string | null }) {
  const [state, setState] = useState<ReportState | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const fetchState = useCallback(async () => {
    if (!auditId) return
    try {
      const res = await fetch(`/api/reports/${auditId}/status`)
      if (!res.ok) throw new Error("No se pudo obtener el estado del informe")
      setState(await res.json())
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [auditId])

  useEffect(() => {
    setLoading(true)
    fetchState()
  }, [fetchState])

  // Poll mientras está generando.
  useEffect(() => {
    if (state?.status !== "generating") return
    const t = setInterval(fetchState, 2500)
    return () => clearInterval(t)
  }, [state?.status, fetchState])

  const generate = async (regenerate = false) => {
    if (!auditId) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/reports/${auditId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate }),
      })
      const data = await res.json()
      if (res.status === 503) setMsg("Servicio generador no configurado.")
      else if (res.status === 422) setMsg("Los datos no pasan la validación.")
      else if (!res.ok) setMsg(data.error ?? "No se pudo generar el informe.")
      await fetchState()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
    if (!auditId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/reports/${auditId}/download`)
      const data = await res.json()
      if (res.ok && data.url) window.open(data.url, "_blank")
      else setMsg(data.error ?? "No se pudo descargar.")
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  if (!auditId) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
        Informe DOCX no disponible para datos históricos (sin auditoría en vivo).
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando estado del informe…
      </div>
    )
  }

  if (!state) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{msg ?? "Sin estado."}</div>
  }

  const meta = STATUS_META[state.status]
  const Icon = meta.icon
  const errors = state.validation.issues.filter((i) => i.severity === "error")
  const warnings = state.validation.issues.filter((i) => i.severity === "warning")

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
      {/* Encabezado de estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-600">
          <FileDown className="h-3.5 w-3.5" /> Informe DOCX
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.tone}`}>
          <Icon className={`h-3 w-3 ${state.status === "generating" ? "animate-spin" : ""}`} />
          {meta.label}
        </span>
      </div>
      <p className="text-xs text-gray-500">{meta.desc}</p>

      {/* Validación: errores y warnings */}
      {errors.length > 0 && (
        <ul className="space-y-1 rounded bg-red-50 p-2 text-[11px] text-red-700">
          {errors.map((i: ValidationIssue, idx) => (
            <li key={idx} className="flex gap-1"><XCircle className="mt-0.5 h-3 w-3 shrink-0" />{i.message}</li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && state.status !== "invalid" && (
        <ul className="space-y-1 rounded bg-amber-50 p-2 text-[11px] text-amber-700">
          {warnings.map((i: ValidationIssue, idx) => (
            <li key={idx} className="flex gap-1"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{i.message}</li>
          ))}
        </ul>
      )}

      {/* Acciones según estado */}
      <div className="flex flex-col gap-2 pt-1">
        {state.status === "available" && (
          <>
            <button onClick={download} disabled={busy} className="flex items-center justify-center gap-2 rounded-lg bg-[#B5123F] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Descargar DOCX
            </button>
            <button onClick={() => generate(true)} disabled={busy} className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerar
            </button>
          </>
        )}

        {state.status === "stale" && (
          <>
            <button onClick={() => generate(true)} disabled={busy} className="flex items-center justify-center gap-2 rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Regenerar (datos cambiaron)
            </button>
            <button onClick={download} disabled={busy} className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              <FileDown className="h-3.5 w-3.5" /> Descargar versión anterior
            </button>
          </>
        )}

        {(state.status === "pending" || state.status === "failed") && (
          <button onClick={() => generate(false)} disabled={busy} className="flex items-center justify-center gap-2 rounded-lg bg-[#B5123F] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {state.status === "failed" ? "Reintentar generación" : "Generar informe"}
          </button>
        )}

        {state.status === "generating" && (
          <button disabled className="flex cursor-wait items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white">
            <Loader2 className="h-4 w-4 animate-spin" /> Generando…
          </button>
        )}

        {state.status === "not_configured" && (
          <button disabled title="Requiere desplegar el microservicio generador" className="flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-2.5 text-sm font-medium text-gray-400">
            <Settings className="h-4 w-4" /> Servicio no configurado
          </button>
        )}

        {state.status === "invalid" && (
          <button disabled className="flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-400">
            <ShieldAlert className="h-4 w-4" /> Corregí los datos para generar
          </button>
        )}
      </div>

      {state.errorMessage && state.status === "failed" && (
        <p className="rounded bg-red-50 px-2 py-1 text-[11px] text-red-600">{state.errorMessage}</p>
      )}
      {msg && <p className="text-[11px] text-gray-500">{msg}</p>}
      {state.generationCount > 0 && (
        <p className="text-[10px] text-gray-400">Generado {state.generationCount} vez(es). {state.completedAt ? `Última: ${new Date(state.completedAt).toLocaleString("es-AR")}` : ""}</p>
      )}
    </div>
  )
}
