'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type ProgressHeaderProps = {
  currentStep: number
  totalSteps: number
  areaLabel?: string
  categoryLabel?: string
  globalScore: number
  globalLabel: string
}

export function ProgressHeader({
  currentStep,
  totalSteps,
  areaLabel,
  categoryLabel,
  globalScore,
  globalLabel,
}: ProgressHeaderProps) {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 min-w-0">
            {areaLabel && (
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {areaLabel}
              </p>
            )}
            {categoryLabel && (
              <h1 className="text-base font-semibold truncate">{categoryLabel}</h1>
            )}
          </div>
          <div className="flex items-center gap-3 ml-4">
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">{globalScore}%</p>
              <p
                className={cn(
                  'text-xs font-medium',
                  globalScore >= 90
                    ? 'text-emerald-600'
                    : globalScore >= 80
                      ? 'text-blue-600'
                      : globalScore >= 70
                        ? 'text-amber-600'
                        : 'text-red-600'
                )}
              >
                {globalLabel}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {currentStep}/{totalSteps}
          </span>
        </div>
      </div>
    </header>
  )
}
