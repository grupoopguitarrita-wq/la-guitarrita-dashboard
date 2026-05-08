'use client'

import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GlobalScores, AuditMetadata } from '@/types/audit'

type SuccessScreenProps = {
  metadata: AuditMetadata
  scores: GlobalScores
  onNewAudit: () => void
}

export function SuccessScreen({ metadata, scores, onNewAudit }: SuccessScreenProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Auditoría Enviada</h1>
        <p className="text-muted-foreground mb-6">
          La auditoría ha sido registrada exitosamente
        </p>

        <div className="bg-muted rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-muted-foreground">Local</p>
          <p className="font-medium mb-3">{metadata.locationName}</p>

          <p className="text-sm text-muted-foreground">Fecha</p>
          <p className="font-medium mb-3">
            {new Date(metadata.auditDate).toLocaleDateString('es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <p className="text-sm text-muted-foreground">Auditor</p>
          <p className="font-medium mb-3">{metadata.auditorName}</p>

          <p className="text-sm text-muted-foreground">Auditoría</p>
          <p className="font-medium">{metadata.auditQuarter}</p>
        </div>

        <div className="bg-card border rounded-lg p-6 mb-8">
          <p className="text-sm text-muted-foreground mb-1">Puntuación Final</p>
          <p className={cn('text-5xl font-bold', getScoreColor(scores.global))}>
            {scores.global}%
          </p>
          <p className={cn('text-lg font-semibold', getScoreColor(scores.global))}>
            {scores.globalLabel}
          </p>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Salón</p>
              <p className={cn('text-lg font-bold', getScoreColor(scores.salon))}>
                {scores.salon}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cocina</p>
              <p className={cn('text-lg font-bold', getScoreColor(scores.cocina))}>
                {scores.cocina}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Calidad</p>
              <p className={cn('text-lg font-bold', getScoreColor(scores.calidad))}>
                {scores.calidad}%
              </p>
            </div>
          </div>
        </div>

        <Button onClick={onNewAudit} size="lg" className="w-full h-12">
          Nueva Auditoría
        </Button>
      </div>
    </div>
  )
}
