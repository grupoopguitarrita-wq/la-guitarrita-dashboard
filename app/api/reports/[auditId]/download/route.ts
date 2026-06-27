import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { REPORTS_BUCKET } from "@/lib/reports/config"
import { getReportRow, logEvent } from "@/lib/reports/store"

// GET /api/reports/:auditId/download
// Devuelve una URL firmada temporal al DOCX en el bucket privado.
export async function GET(_req: Request, { params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await params
  try {
    const row = await getReportRow(auditId)
    if (!row || row.status !== "available" || !row.storage_path) {
      return NextResponse.json({ error: "No hay informe disponible para descargar." }, { status: 404 })
    }

    const { data, error } = await supabase.storage
      .from(REPORTS_BUCKET)
      .createSignedUrl(row.storage_path, 300) // 5 minutos

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "No se pudo firmar la URL de descarga." }, { status: 500 })
    }

    await logEvent({ reportId: row.id, auditId, eventType: "downloaded", message: "Descarga solicitada" })
    return NextResponse.json({ url: data.signedUrl, fileName: row.file_name })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
