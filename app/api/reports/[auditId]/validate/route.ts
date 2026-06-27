import { NextResponse } from "next/server"
import { buildReportPayload } from "@/lib/reports/payload-builder"
import { validatePayload } from "@/lib/reports/validation"
import { logEvent } from "@/lib/reports/store"

// GET /api/reports/:auditId/validate
// Construye el payload y devuelve el resultado de validación (errores/warnings).
export async function GET(_req: Request, { params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await params
  try {
    const built = await buildReportPayload(auditId)
    const validation = validatePayload(built.payload)
    await logEvent({
      auditId,
      eventType: validation.ok ? "validated" : "validation_failed",
      message: validation.ok ? "Payload válido" : `Validación con ${validation.errorCount} error(es)`,
      metadata: { errorCount: validation.errorCount, warningCount: validation.warningCount },
    })
    return NextResponse.json({ validation, sourceHash: built.sourceHash, preview: built.payload.header })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
