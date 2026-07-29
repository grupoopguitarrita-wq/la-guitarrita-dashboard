/**
 * Cliente de la base de datos en Google Sheets.
 *
 * Todas las escrituras de auditorías pasan por acá. Llama al proxy interno
 * (/api/sheets/db), que a su vez reenvía a la Web App de Apps Script.
 *
 * Reemplaza a Supabase para GUARDAR auditorías (crear, respuestas, puntajes,
 * envío y fotos).
 */

export type SheetsResult<T = unknown> = {
  ok: boolean
  error?: string
  detail?: string
} & T

async function callSheets<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown>,
): Promise<SheetsResult<T>> {
  const res = await fetch("/api/sheets/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  })

  let data: SheetsResult<T>
  try {
    data = (await res.json()) as SheetsResult<T>
  } catch {
    throw new Error("Respuesta inválida del servicio de Google Sheets")
  }

  if (!res.ok || !data.ok) {
    const reason = data?.error ?? `HTTP ${res.status}`
    if (reason === "sheets_not_configured") {
      throw new Error(
        "Google Sheets no está configurado. Cargá SHEETS_WEBHOOK_URL y SHEETS_WEBHOOK_TOKEN en las variables del proyecto.",
      )
    }
    throw new Error(`Error de Google Sheets: ${reason}`)
  }

  return data
}

// --- Acciones ---------------------------------------------------------------

export function sheetsCreateAudit(payload: {
  id: string
  locationId: string
  locationName: string
  auditorName: string
  auditorNames: string[]
  auditDate: string
  auditQuarter: string
}) {
  return callSheets<{ id: string }>("createAudit", payload)
}

export function sheetsSaveResponse(payload: Record<string, unknown>) {
  return callSheets<{ id: string }>("saveResponse", payload)
}

export function sheetsSaveAreaScore(payload: {
  auditId: string
  areaId: string
  areaScore: number
  globalLabel: string
}) {
  return callSheets<{ areaScore: number; globalScore: number }>(
    "saveAreaScore",
    payload,
  )
}

export function sheetsSubmitAudit(payload: {
  auditId: string
  salonScore: number | null
  cocinaScore: number | null
  calidadScore: number | null
  globalScore: number
  globalLabel: string
  scores: Array<{
    scoreType: string
    areaId: string | null
    categoryId: string | null
    weight: number | null
    scoreValue: number
    scoreLabel: string
  }>
}) {
  return callSheets("submitAudit", payload)
}

export function sheetsUploadPhoto(payload: {
  base64: string
  mimeType: string
  filename: string
}) {
  return callSheets<{ url: string }>("uploadPhoto", payload)
}

export function sheetsListLocations() {
  return callSheets<{ data: Array<{ id: string; name: string }> }>(
    "listLocations",
    {},
  )
}
