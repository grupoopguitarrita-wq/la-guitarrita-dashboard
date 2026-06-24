'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Utensils, ChefHat, Award, Check, Clock, Circle } from 'lucide-react'
import type { AuditMetadata, AuditResponses, AreaStatus } from '@/types/audit'
import { AUDIT_STRUCTURE } from '@/data/audit-structure'
import { calculateAreaScore, getAreaCompletion } from '@/lib/audit-scoring'

type AreaSelectorScreenProps = {
  metadata: AuditMetadata
  responses: AuditResponses
  completedAreas: string[]
  onSelectArea: (areaId: string) => void
  onViewFinalReport: () => void
}

const AREA_ICONS: Record<string, React.ElementType> = {
  salon: Utensils,
  cocina: ChefHat,
  calidad: Award,
}

const AREA_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  salon: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  cocina: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  calidad: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
}

export function AreaSelectorScreen({
  metadata,
  responses,
  completedAreas,
  onSelectArea,
  onViewFinalReport,
}: AreaSelectorScreenProps) {
  const areaStatuses = useMemo(() => {
    return AUDIT_STRUCTURE.areas.map((area) => {
      const completion = getAreaCompletion(area.id, responses)
      const score = calculateAreaScore(area.id, responses)
      const isCompleted = completedAreas.includes(area.id)

      let status: AreaStatus = 'pendiente'
      if (isCompleted) {
        status = 'completada'
      } else if (completion.answered > 0) {
        status = 'en_progreso'
      }

      return {
        area,
        status,
        score: score?.percentage ?? null,
        completion,
      }
    })
  }, [responses, completedAreas])

  const allCompleted = completedAreas.length === AUDIT_STRUCTURE.areas.length

  const getStatusLabel = (status: AreaStatus) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente'
      case 'en_progreso':
        return 'En progreso'
      case 'completada':
        return 'Completada'
    }
  }

  const getStatusIcon = (status: AreaStatus) => {
    switch (status) {
      case 'pendiente':
        return Circle
      case 'en_progreso':
        return Clock
      case 'completada':
        return Check
    }
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground'
    if (score >= 90) return 'text-emerald-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-background">
      <div className="flex-1 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Seleccionar Área</h1>
          <p className="text-muted-foreground">
            {metadata.locationName}
          </p>
          <p className="text-sm text-muted-foreground">
            {metadata.auditorName} - {metadata.auditQuarter}
          </p>
        </div>

        {/* Area Cards */}
        <div className="space-y-4">
          {areaStatuses.map(({ area, status, score, completion }) => {
            const Icon = AREA_ICONS[area.id] ?? Circle
            const StatusIcon = getStatusIcon(status)
            const colors = AREA_COLORS[area.id] ?? AREA_COLORS.salon

            return (
              <Card
                key={area.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  status === 'completada' && 'border-emerald-300 bg-emerald-50/50'
                )}
                onClick={() => onSelectArea(area.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
                        colors.bg
                      )}
                    >
                      <Icon className={cn('w-6 h-6', colors.text)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-semibold">{area.label}</h3>
                        {status === 'completada' && score !== null && (
                          <span className={cn('text-xl font-bold', getScoreColor(score))}>
                            {score}%
                          </span>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          className={cn(
                            'w-4 h-4',
                            status === 'completada'
                              ? 'text-emerald-600'
                              : status === 'en_progreso'
                                ? 'text-amber-600'
                                : 'text-muted-foreground'
                          )}
                        />
                        <span
                          className={cn(
                            'text-sm',
                            status === 'completada'
                              ? 'text-emerald-600'
                              : status === 'en_progreso'
                                ? 'text-amber-600'
                                : 'text-muted-foreground'
                          )}
                        >
                          {getStatusLabel(status)}
                        </span>
                        {status !== 'pendiente' && (
                          <span className="text-sm text-muted-foreground">
                            ({completion.answered}/{completion.total} items)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Progress indicator */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {completedAreas.length} de {AUDIT_STRUCTURE.areas.length} áreas completadas
          </p>
        </div>
      </div>

      {/* Bottom button */}
      {allCompleted && (
        <div className="max-w-md mx-auto w-full mt-8">
          <Button
            onClick={onViewFinalReport}
            className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Ver Resultado Total
          </Button>
        </div>
      )}
    </div>
  )
}
