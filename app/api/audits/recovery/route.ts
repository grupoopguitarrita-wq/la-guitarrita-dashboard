import { NextResponse } from 'next/server'
import { isAuditRecoveryEnabled } from '@/lib/recovery-access'

export const dynamic = 'force-dynamic'

export async function POST() {
  if (!isAuditRecoveryEnabled()) {
    return NextResponse.json({ ok: false, error: 'audit_recovery_disabled' }, { status: 403 })
  }

  return NextResponse.json(
    { ok: false, error: 'recovery_not_implemented', message: 'Recovery remains disabled until its server-side write workflow is explicitly enabled.' },
    { status: 501 },
  )
}

export async function GET() {
  if (!isAuditRecoveryEnabled()) {
    return NextResponse.json({ ok: false, error: 'audit_recovery_disabled' }, { status: 403 })
  }

  return NextResponse.json({ ok: true, mode: 'preview-only' })
}
