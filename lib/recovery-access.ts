import 'server-only'

export function isAuditRecoveryEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_AUDIT_RECOVERY === 'true'
}

export function assertAuditRecoveryEnabled() {
  if (!isAuditRecoveryEnabled()) {
    throw new Error('AUDIT_RECOVERY_DISABLED')
  }
}
