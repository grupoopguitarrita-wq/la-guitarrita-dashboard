'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { AlertTriangle, XCircle, Download, Send, Loader2, ArrowLeft } from 'lucide-react'
import type { AuditMetadata, AuditResponses } from '@/types/audit'
import { AUDIT_STRUCTURE } from '@/data/audit-structure'
import { calculateGlobalScores, calculateAreaScore } from '@/lib/audit-scoring'

type NegativeFinding = {
  areaLabel: string
  categoryLabel: string
  itemLabel: string
  severity: 'no_cumple' | 'critico'
  observation: string
  photoUrl: string | null
}

type FinalReportScreenProps = {
  metadata: AuditMetadata
  responses: AuditResponses
  onBack: () => void
  onSubmit: () => void
  onDownloadPdf: () => void
  isSubmitting: boolean
}

export function FinalReportScreen({
  metadata,
  responses,
  onBack,
  onSubmit,
  onDownloadPdf,
  isSubmitting,
}: FinalReportScreenProps) {
  const globalScores = useMemo(
    () => calculateGlobalScores(responses),
    [responses]
  )

  const areaDetails = useMemo(() => {
    return AUDIT_STRUCTURE.areas.map((area) => ({
      area,
      score: calculateAreaScore(area.id, responses),
    }))
  }, [responses])

  const allNegativeFindings = useMemo((): NegativeFinding[] => {
    const findings: NegativeFinding[] = []

    for (const area of AUDIT_STRUCTURE.areas) {
      for (const category of area.categories) {
        for (const item of category.items) {
          const response = responses[item.id]
          if (!response) continue

          if (response.value === -1 || response.value === -2) {
            findings.push({
              areaLabel: area.label,
              categoryLabel: category.label,
              itemLabel: item.isCustomLabel && response.customLabel ? response.customLabel : item.label,
              severity: response.value === -2 ? 'critico' : 'no_cumple',
              observation: response.observation || '',
              photoUrl: response.photoUrl,
            })
          }
        }
      }
    }

    return findings
  }, [responses])

  const findingsByArea = useMemo(() => {
    const grouped: Record<string, NegativeFinding[]> = {}
    for (const finding of allNegativeFindings) {
      if (!grouped[finding.areaLabel]) {
        grouped[finding.areaLabel] = []
      }
      grouped[finding.areaLabel].push(finding)
    }
    return grouped
  }, [allNegativeFindings])

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

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Reporte Final</h1>
            <p className="text-muted-foreground">{metadata.locationName}</p>
          </div>
        </div>

        {/* Metadata */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Local</p>
                <p className="font-medium">{metadata.locationName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Auditor</p>
                <p className="font-medium">{metadata.auditorName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Auditoría</p>
                <p className="font-medium">{metadata.auditQuarter}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha</p>
                <p className="font-medium">
                  {new Date(metadata.auditDate).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Score Card */}
        <Card className={cn('mb-6', getScoreBg(globalScores.global))}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                Puntuación Global
              </p>
              <p className={cn('text-5xl font-bold', getScoreColor(globalScores.global))}>
                {globalScores.global}%
              </p>
              <p className={cn('text-lg font-semibold mt-1', getScoreColor(globalScores.global))}>
                {globalScores.globalLabel}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Area Scores Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Salón</p>
              <p className={cn('text-2xl font-bold', getScoreColor(globalScores.salon))}>
                {globalScores.salon}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Cocina</p>
              <p className={cn('text-2xl font-bold', getScoreColor(globalScores.cocina))}>
                {globalScores.cocina}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Calidad</p>
              <p className={cn('text-2xl font-bold', getScoreColor(globalScores.calidad))}>
                {globalScores.calidad}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Area Breakdown */}
        <div className="space-y-4 mb-6">
          {areaDetails.map(({ area, score }) => (
            <Card key={area.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{area.label}</CardTitle>
                  <span className={cn('text-lg font-bold', getScoreColor(score?.percentage ?? 0))}>
                    {score?.percentage ?? 0}%
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {score?.categoryScores.map((catScore) => (
                  <div key={catScore.categoryId}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{catScore.label}</span>
                      <span className="font-medium">{catScore.percentage}%</span>
                    </div>
                    <Progress value={catScore.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Peso: {catScore.weight}%
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Negative Findings by Area */}
        {allNegativeFindings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Hallazgos Negativos ({allNegativeFindings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(findingsByArea).map(([areaLabel, findings]) => (
                <div key={areaLabel}>
                  <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                    {areaLabel} ({findings.length})
                  </h4>
                  <div className="space-y-3">
                    {findings.map((finding, idx) => (
                      <div
                        key={`${finding.categoryLabel}-${idx}`}
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No findings message */}
        {allNegativeFindings.length === 0 && (
          <Card className="mb-6 bg-emerald-50 border-emerald-200">
            <CardContent className="pt-6 text-center">
              <p className="text-emerald-700 font-medium">
                No se encontraron hallazgos negativos en esta auditoría
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
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar Auditoría
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
