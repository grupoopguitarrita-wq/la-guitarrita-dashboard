import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// GET /api/reports/:auditId/logs
// Devuelve la bitácora de eventos del informe (más recientes primero).
export async function GET(_req: Request, { params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await params
  try {
    const { data, error } = await supabase
      .from("report_events")
      .select("event_type, message, metadata, created_at")
      .eq("audit_id", auditId)
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ events: data ?? [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
