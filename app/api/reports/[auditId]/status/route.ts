import { NextResponse } from "next/server"
import { getReportState } from "@/lib/reports/store"

// GET /api/reports/:auditId/status
// Devuelve el estado consolidado del informe (incluye validación y stale).
export async function GET(_req: Request, { params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await params
  try {
    const state = await getReportState(auditId)
    return NextResponse.json(state)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
