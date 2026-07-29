import { NextResponse } from "next/server"

/**
 * Proxy server-side hacia la Web App de Google Apps Script que actúa como
 * base de datos (Google Sheets). Mantiene la URL y el token fuera del
 * navegador y evita problemas de CORS.
 *
 * Variables de entorno necesarias (menú "Vars" del proyecto):
 *   - SHEETS_WEBHOOK_URL   : URL .../exec de la Web App publicada
 *   - SHEETS_WEBHOOK_TOKEN : mismo valor que WEBHOOK_TOKEN en el script
 */
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const url = process.env.SHEETS_WEBHOOK_URL
  const token = process.env.SHEETS_WEBHOOK_TOKEN

  if (!url || !token) {
    return NextResponse.json(
      { ok: false, error: "sheets_not_configured" },
      { status: 503 },
    )
  }

  let incoming: { action?: string; payload?: unknown }
  try {
    incoming = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Apps Script requiere seguir el redirect 302 al dominio de contenido.
      redirect: "follow",
      body: JSON.stringify({
        action: incoming.action,
        payload: incoming.payload ?? {},
        token,
      }),
    })

    const text = await res.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      // El script devolvió HTML (típico si la Web App no está bien publicada).
      return NextResponse.json(
        { ok: false, error: "bad_script_response", detail: text.slice(0, 200) },
        { status: 502 },
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "fetch_failed", detail: String(err) },
      { status: 502 },
    )
  }
}
