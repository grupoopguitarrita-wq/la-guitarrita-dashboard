import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { syncSubmittedAudit } from '@/lib/supabase-sync'

export const runtime = 'nodejs'

const DEBUG_TOKEN_HASH = '5db524022b7fb0169c32b5d035cf4005af78a07eab27439c34edda70e54e6801'

function isAuthorizedForDiagnostics(request: Request) {
  const token = request.headers.get('x-audit-debug-token')
  if (!token) return false
  const actual = Buffer.from(createHash('sha256').update(token).digest('hex'))
  const expected = Buffer.from(DEBUG_TOKEN_HASH)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const candidate = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown }
    return [candidate.code, candidate.message, candidate.details, candidate.hint]
      .filter((value) => typeof value === 'string' && value)
      .join(' | ') || 'sync_failed'
  }
  return 'sync_failed'
}

export async function POST(request: Request) {
  const diagnostics = isAuthorizedForDiagnostics(request)
  try {
    const input = await request.json()
    const result = await syncSubmittedAudit(input)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: 'pending_sync',
        error: diagnostics ? safeErrorMessage(error) : 'sync_failed',
      },
      { status: 502 },
    )
  }
}
