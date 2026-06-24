'use client'

import { ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type BottomNavigationProps = {
  onPrevious: () => void
  onNext: () => void
  canGoPrevious: boolean
  canGoNext: boolean
  isLastStep: boolean
  isSummary: boolean
  onSubmit: () => void
  isSubmitting: boolean
  nextLabel?: string
}

export function BottomNavigation({
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  isLastStep,
  isSummary,
  onSubmit,
  isSubmitting,
  nextLabel,
}: BottomNavigationProps) {
  const getNextButtonLabel = () => {
    if (nextLabel) return nextLabel
    if (isLastStep) return 'Ver Resumen'
    return 'Siguiente'
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50 safe-area-pb">
      <div className="flex items-center justify-between p-4 gap-3">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious || isSubmitting}
          className="flex-1 h-12"
        >
          <ChevronLeft className="w-5 h-5" />
          Anterior
        </Button>

        {isSummary ? (
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
        ) : (
          <Button
            onClick={onNext}
            disabled={!canGoNext || isSubmitting}
            className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300"
          >
            {getNextButtonLabel()}
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>
    </nav>
  )
}
