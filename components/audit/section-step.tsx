'use client'

import { useMemo } from 'react'
import { CategoryBlock } from './category-block'
import type { AuditArea, AuditResponses, ItemResponse } from '@/types/audit'
import { calculateAreaScore, getAreaCompletion } from '@/lib/audit-scoring'
import { cn } from '@/lib/utils'

type SectionStepProps = {
  area: AuditArea
  responses: AuditResponses
  onItemResponseChange: (itemId: string, response: Partial<ItemResponse>) => void
  onPhotoUpload: (itemId: string, file: File) => Promise<string>
  categoryErrors?: Record<string, Record<string, string[]>>
  currentCategoryIndex: number
}

export function SectionStep({
  area,
  responses,
  onItemResponseChange,
  onPhotoUpload,
  categoryErrors = {},
  currentCategoryIndex,
}: SectionStepProps) {
  const areaScore = useMemo(
    () => calculateAreaScore(area.id, responses),
    [area.id, responses]
  )

  const areaCompletion = useMemo(
    () => getAreaCompletion(area.id, responses),
    [area.id, responses]
  )

  const currentCategory = area.categories[currentCategoryIndex]

  if (!currentCategory) return null

  return (
    <div className="px-4 pb-24">
      {/* Area Overview */}
      <div className="py-4 mb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">{area.label}</h1>
            <p className="text-sm text-muted-foreground">
              {areaCompletion.answered}/{areaCompletion.total} items completados
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                'text-2xl font-bold tabular-nums',
                areaScore && areaScore.percentage >= 90
                  ? 'text-emerald-600'
                  : areaScore && areaScore.percentage >= 80
                    ? 'text-blue-600'
                    : areaScore && areaScore.percentage >= 70
                      ? 'text-amber-600'
                      : 'text-red-600'
              )}
            >
              {areaScore?.percentage ?? 0}%
            </p>
            <p className="text-xs text-muted-foreground">Puntuación del área</p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4">
          {area.categories.map((cat, idx) => (
            <div
              key={cat.id}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap',
                idx === currentCategoryIndex
                  ? 'bg-primary text-primary-foreground'
                  : idx < currentCategoryIndex
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {cat.label}
            </div>
          ))}
        </div>
      </div>

      {/* Current Category */}
      <CategoryBlock
        category={currentCategory}
        areaId={area.id}
        responses={responses}
        onItemResponseChange={onItemResponseChange}
        onPhotoUpload={onPhotoUpload}
        itemErrors={categoryErrors[currentCategory.id]}
      />
    </div>
  )
}
