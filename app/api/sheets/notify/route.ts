import { NextResponse } from "next/server"

/**
 * Avisa al Google Sheet (Apps Script) que una auditoría se completó, para que
 * sincronice al instante. Es seguro llamarla siempre: si el Sheet todavía no
 * está configurado (faltan las env vars), responde 200 sin hacer nada y el
 * disparador automático de 10 minutos del Sheet igual levantará los datos.
 *
 * Configurar en el proyecto (Vars) cuando el Sheet esté listo:
 *   SHEETS_WEBHOOK_URL   -> URL del despliegue web del Apps Script (/exec)
 *   SHEETS_WEBHOOK_TOKEN -> el mismo token definido en el script (SHEET_TOKEN)
 */
export async function POST(req: Request) {
  const url = process.env.SHEETS_WEBHOOK_URL
  const token = process.env.SHEETS_WEBHOOK_TOKEN

  if (!url || !token) {
    // El Sheet aún no está enlazado: no es un error, simplemente no hacemos nada.
    return NextResponse.json({ ok: true, notified: false, reason: "sheet_not_configured" })
  }

  let auditId: string | null = null
  try {
    const body = await req.json()
    auditId = typeof body?.auditId === "string" ? body.auditId : null
  } catch {
    auditId = null
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, event: "audit_submitted", auditId }),
    })
    return NextResponse.json({ ok: res.ok, notified: res.ok })
  } catch (err) {
    // No propagamos el error: el envío de la auditoría no debe fallar por esto.
    console.error("[v0] Error avisando al Google Sheet:", err)
    return NextResponse.json({ ok: false, notified: false }, { status: 200 })
  }
}
