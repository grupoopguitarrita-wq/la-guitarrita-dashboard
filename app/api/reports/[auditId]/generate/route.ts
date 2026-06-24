import { NextResponse } from "next/server"
import { buildReportPayload } from "@/lib/reports/payload-builder"
import { validatePayload } from "@/lib/reports/validation"
import { requestGeneration } from "@/lib/reports/generator-client"
import { getGeneratorConfig } from "@/lib/reports/config"
import { upsertReportStatus, logEvent } from "@/lib/reports/store"

// POST /api/reports/:auditId/generate
// Orquesta la generación: valida -> marca generating -> llama al servicio ->
// marca available o failed. Si el servicio no está configurado, responde 503.
export async function POST(req: Request, { params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await params
  const body = await req.json().catch(() => ({}))
  const isRegenerate = Boolean(body?.regenerate)

  try {
    const config = getGeneratorConfig()
    const built = await buildReportPayload(auditId)

    // 1. Validación previa.
    const validation = validatePayload(built.payload)
    if (!validation.ok) {
      await logEvent({ auditId, eventType: "validation_failed", message: "Bloqueado por validación", metadata: { errorCount: validation.errorCount } })
      return NextResponse.json({ ok: false, status: "invalid", validation }, { status: 422 })
    }

    // 2. Servicio configurado?
    if (!config.configured) {
      return NextResponse.json(
        { ok: false, status: "not_configured", message: "Servicio generador no configurado." },
        { status: 503 },
      )
    }

    // 3. Marcar en proceso.
    const reportId = await upsertReportStatus({
      auditId,
      locationId: built.locationId,
      quarter: built.quarter,
      status: "generating",
      sourceHash: built.sourceHash,
      incrementCount: isRegenerate,
    })
    await logEvent({
      reportId,
      auditId,
      eventType: isRegenerate ? "regenerated" : "generation_started",
      message: isRegenerate ? "Regeneración solicitada" : "Generación iniciada",
    })

    // 4. Llamada al microservicio.
    const result = await requestGeneration(built.payload, auditId)

    // 5. Persistir desenlace.
    if (result.ok) {
      await upsertReportStatus({
        auditId,
        locationId: built.locationId,
        quarter: built.quarter,
        status: "available",
        sourceHash: built.sourceHash,
        errorMessage: null,
      })
      await logEvent({ reportId, auditId, eventType: "generation_succeeded", message: "DOCX generado", metadata: { fileName: result.fileName } })
      return NextResponse.json({ ok: true, status: "available", fileName: result.fileName })
    }

    await upsertReportStatus({
      auditId,
      locationId: built.locationId,
      quarter: built.quarter,
      status: "failed",
      sourceHash: built.sourceHash,
      errorMessage: result.error ?? "Fallo desconocido",
    })
    await logEvent({ reportId, auditId, eventType: "generation_failed", message: result.error ?? "Fallo", metadata: { detail: result.errorDetail } })
    return NextResponse.json({ ok: false, status: "failed", error: result.error }, { status: 502 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
