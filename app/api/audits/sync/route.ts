import { NextResponse } from 'next/server'
import { syncSubmittedAudit } from '@/lib/supabase-sync'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const input = await request.json()
    const result = await syncSubmittedAudit(input)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ ok: false, status: 'pending_sync', error: error instanceof Error ? error.message : 'sync_failed' }, { status: 502 })
  }
}
