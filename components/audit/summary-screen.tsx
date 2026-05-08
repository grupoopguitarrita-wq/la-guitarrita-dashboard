'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { AuditResponses, AuditMetadata } from '@/types/audit'
import { AUDIT_STRUCTURE } from '@/data/audit-structure'
import {
  calculateGlobalScores,
  calculateAreaScore,
  getAreaCompletion,
} from '@/lib/audit-scoring'

type SummaryScreenProps = {
  metadata: AuditMetadata
  responses: AuditResponses
}

export function SummaryScreen({ metadata, responses }: SummaryScreenProps) {
  const globalScores = useMemo(
    () => calculateGlobalScores(responses),
    [responses]
  )

  const areaDetails = useMemo(() => {
    return AUDIT_STRUCTURE.areas.map((area) => ({
      area,
      score: calculateAreaScore(area.id, responses),
      completion: getAreaCompletion(area.id, responses),
    }))
  }, [responses])

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
    <div className="px-4 py-6 pb-32">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Resumen de Auditoría</h1>
        <p className="text-muted-foreground">{metadata.locationName}</p>
        <p className="text-sm text-muted-foreground">
          {new Date(metadata.auditDate).toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <p className="text-sm text-muted-foreground">Auditor: {metadata.auditorName}</p>
      </div>

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
      <div className="space-y-4">
        {areaDetails.map(({ area, score, completion }) => (
          <Card key={area.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{area.label}</CardTitle>
                <span className={cn('text-lg font-bold', getScoreColor(score?.percentage ?? 0))}>
                  {score?.percentage ?? 0}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {completion.answered}/{completion.total} items completados
              </p>
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
    </div>
  )
}
