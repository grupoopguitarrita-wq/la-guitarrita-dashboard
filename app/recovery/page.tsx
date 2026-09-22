import { notFound } from 'next/navigation'
import RecoveryPreview from '@/components/recovery/RecoveryPreview'
import { isAuditRecoveryEnabled } from '@/lib/recovery-access'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Recuperación manual | La Guitarrita',
  description: 'Vista previa segura para recuperar una auditoría desde datos extraídos de PDF.',
  robots: { index: false, follow: false },
}

export default function RecoveryPage() {
  if (!isAuditRecoveryEnabled()) notFound()
  return <RecoveryPreview />
}
