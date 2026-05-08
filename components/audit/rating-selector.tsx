'use client'

import { cn } from '@/lib/utils'
import type { RatingValue } from '@/types/audit'
import { RATING_OPTIONS } from '@/types/audit'

type RatingSelectorProps = {
  value: RatingValue | null
  onChange: (value: RatingValue) => void
  disabled?: boolean
}

export function RatingSelector({ value, onChange, disabled }: RatingSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {RATING_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
            'active:scale-95 touch-manipulation',
            'min-h-[44px]',
            value === option.value
              ? option.value === 2
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                : option.value === 1
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : option.value === 0
                    ? 'bg-gray-100 border-gray-400 text-gray-600'
                    : option.value === -1
                      ? 'bg-amber-50 border-amber-500 text-amber-700'
                      : 'bg-red-50 border-red-500 text-red-700'
              : 'bg-background border-border hover:bg-muted',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="text-base">{option.icon}</span>
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

export function RatingSelectorCompact({
  value,
  onChange,
  disabled,
}: RatingSelectorProps) {
  return (
    <div className="flex gap-1">
      {RATING_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg border text-base transition-all',
            'active:scale-95 touch-manipulation',
            value === option.value
              ? option.value === 2
                ? 'bg-emerald-50 border-emerald-500'
                : option.value === 1
                  ? 'bg-blue-50 border-blue-500'
                  : option.value === 0
                    ? 'bg-gray-100 border-gray-400'
                    : option.value === -1
                      ? 'bg-amber-50 border-amber-500'
                      : 'bg-red-50 border-red-500'
              : 'bg-background border-border hover:bg-muted',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={option.label}
        >
          {option.icon}
        </button>
      ))}
    </div>
  )
}
