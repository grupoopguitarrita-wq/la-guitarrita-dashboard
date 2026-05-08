'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { AlertTriangle, XCircle, Download, ArrowRight, Image as ImageIcon } from 'lucide-react'
import type { AuditMetadata, AuditResponses, AuditArea } from '@/types/audit'
import { AUDIT_STRUCTURE, getItemById } from '@/data/audit-structure'
import { calculateAreaScore, getAreaCompletion } from '@/lib/audit-scoring'
import { getGlobalLabel } from '@/types/audit'

type NegativeFinding = {
  itemId: string
  categoryLabel: string
  itemLabel: string
  severity: 'no_cumple' | 'critico'
  observation: string
  photoUrl: string | null
}

type AreaSummaryScreenProps = {
  areaId: string
  metadata: AuditMetadata
  responses: AuditResponses
  isLastArea: boolean
  onContinue: () => void
  onViewFinalReport: () => void
  onDownloadPdf: () => void
}

export function AreaSummaryScreen({
  areaId,
  metadata,
  responses,
  isLastArea,
  onContinue,
  onViewFinalReport,
  onDownloadPdf,
}: AreaSummaryScreenProps) {
  const area = useMemo(
    () => AUDIT_STRUCTURE.areas.find((a) => a.id === areaId),
    [areaId]
  )

  const areaScore = useMemo(
    () => (area ? calculateAreaScore(area.id, responses) : null),
    [area, responses]
  )

  const areaCompletion = useMemo(
    () => (area ? getAreaCompletion(area.id, responses) : { answered: 0, total: 0, percentage: 0 }),
    [area, responses]
  )

  const negativeFindings = useMemo((): NegativeFinding[] => {
    if (!area) return []

    const findings: NegativeFinding[] = []

    for (const category of area.categories) {
      for (const item of category.items) {
        const response = responses[item.id]
        if (!response) continue

        if (response.value === -1 || response.value === -2) {
          findings.push({
            itemId: item.id,
            categoryLabel: category.label,
            itemLabel: item.isCustomLabel && response.customLabel ? response.customLabel : item.label,
            severity: response.value === -2 ? 'critico' : 'no_cumple',
            observation: response.observation || '',
            photoUrl: response.photoUrl,
          })
        }
      }
    }

    return findings
  }, [area, responses])

  const scoreLabel = areaScore ? getGlobalLabel(areaScore.percentage) : ''

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-50'
    if (score >= 80) return 'bg-blue-50'
    if (score >= 70) return 'bg-amber-50'
    return 'bg-red-50'
  }

  if (!area || !areaScore) return null

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Resumen: {area.label}</h1>
          <p className="text-muted-foreground">{metadata.locationName}</p>
          <p className="text-sm text-muted-foreground">
            {metadata.auditorName} - {metadata.auditQuarter}
          </p>
        </div>

        {/* Score Card */}
        <Card className={cn('mb-6', getScoreBg(areaScore.percentage))}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                Puntuación del Área
              </p>
              <p className={cn('text-5xl font-bold', getScoreColor(areaScore.percentage))}>
                {areaScore.percentage}%
              </p>
              <p className={cn('text-lg font-semibold mt-1', getScoreColor(areaScore.percentage))}>
                {scoreLabel}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {areaCompletion.answered}/{areaCompletion.total} items evaluados
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Category Scores */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Puntuación por Categoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {areaScore.categoryScores.map((catScore) => (
              <div key={catScore.categoryId}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-foreground">{catScore.label}</span>
                  <span className={cn('font-semibold', getScoreColor(catScore.percentage))}>
                    {catScore.percentage}%
                  </span>
                </div>
                <Progress value={catScore.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-0.5">
                  Peso: {catScore.weight}%
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Negative Findings */}
        {negativeFindings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Hallazgos Negativos ({negativeFindings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {negativeFindings.map((finding) => (
                <div
                  key={finding.itemId}
                  className={cn(
                    'p-4 rounded-lg border',
                    finding.severity === 'critico'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {finding.severity === 'critico' ? (
                      <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">
                          {finding.categoryLabel}
                        </span>
                        <span
                          className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded',
                            finding.severity === 'critico'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-amber-200 text-amber-800'
                          )}
                        >
                          {finding.severity === 'critico' ? 'CRITICO' : 'NO CUMPLE'}
                        </span>
                      </div>
                      <p className="font-medium text-foreground mt-1">{finding.itemLabel}</p>
                      {finding.observation && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {finding.observation}
                        </p>
                      )}
                      {finding.photoUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={finding.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Ver foto
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No findings message */}
        {negativeFindings.length === 0 && (
          <Card className="mb-6 bg-emerald-50 border-emerald-200">
            <CardContent className="pt-6 text-center">
              <p className="text-emerald-700 font-medium">
                No se encontraron hallazgos negativos en esta área
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 safe-area-pb">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            onClick={onDownloadPdf}
            className="h-12"
          >
            <Download className="w-5 h-5" />
            PDF
          </Button>
          {isLastArea ? (
            <Button
              onClick={onViewFinalReport}
              className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Ver Resultado Total
              <ArrowRight className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={onContinue}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white"
            >
              Continuar Auditoría
              <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
