'use client'

import { useMemo } from 'react'
import { AuditItem } from './audit-item'
import type { AuditCategory, AuditResponses, ItemResponse } from '@/types/audit'
import { calculateCategoryScore, getCategoryCompletion } from '@/lib/audit-scoring'
import { cn } from '@/lib/utils'

type CategoryBlockProps = {
  category: AuditCategory
  areaId: string
  responses: AuditResponses
  onItemResponseChange: (itemId: string, response: Partial<ItemResponse>) => void
  onPhotoUpload: (itemId: string, file: File) => Promise<string>
  itemErrors?: Record<string, string[]>
}

export function CategoryBlock({
  category,
  areaId,
  responses,
  onItemResponseChange,
  onPhotoUpload,
  itemErrors = {},
}: CategoryBlockProps) {
  const categoryScore = useMemo(
    () => calculateCategoryScore(category.id, areaId, responses),
    [category.id, areaId, responses]
  )

  const completion = useMemo(
    () => getCategoryCompletion(category.id, areaId, responses),
    [category.id, areaId, responses]
  )

  const handleResponseChange = (itemId: string) => (response: Partial<ItemResponse>) => {
    onItemResponseChange(itemId, response)
  }

  const handlePhotoUpload = (itemId: string) => (file: File) => {
    return onPhotoUpload(itemId, file)
  }

  return (
    <div className="space-y-4">
      {/* Category Header with Score */}
      <div className="sticky top-[73px] z-40 bg-background/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">{category.label}</h2>
            <p className="text-xs text-muted-foreground">
              {completion.answered}/{completion.total} items - Peso: {category.weight}%
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                'text-xl font-bold tabular-nums',
                categoryScore && categoryScore.percentage >= 90
                  ? 'text-emerald-600'
                  : categoryScore && categoryScore.percentage >= 80
                    ? 'text-blue-600'
                    : categoryScore && categoryScore.percentage >= 70
                      ? 'text-amber-600'
                      : 'text-red-600'
              )}
            >
              {categoryScore?.percentage ?? 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {category.items.map((item) => {
          const response = responses[item.id] ?? {
            value: null,
            observation: '',
            photoUrl: null,
            customLabel: '',
            textValue: '',
          }

          return (
            <AuditItem
              key={item.id}
              item={item}
              response={response}
              onResponseChange={handleResponseChange(item.id)}
              onPhotoUpload={handlePhotoUpload(item.id)}
              errors={itemErrors[item.id]}
            />
          )
        })}
      </div>
    </div>
  )
}
