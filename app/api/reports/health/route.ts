import { NextResponse } from "next/server"
import { getGeneratorConfig } from "@/lib/reports/config"
import { checkServiceHealth } from "@/lib/reports/generator-client"

// GET /api/reports/health
// Indica si el microservicio generador está configurado y operativo.
export async function GET() {
  const config = getGeneratorConfig()
  if (!config.configured) {
    return NextResponse.json({ configured: false, healthy: false, message: "Servicio generador no configurado." })
  }
  const health = await checkServiceHealth()
  return NextResponse.json({ configured: true, healthy: health.healthy, message: health.message })
}
