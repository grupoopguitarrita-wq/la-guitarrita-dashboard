'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, RefreshCw } from 'lucide-react'
import type { AuditDraft } from '@/lib/draft-persistence'
import { formatDateForDisplay } from '@/lib/date-utils'

type IntroScreenProps = {
  onStart: () => void
  existingDraft?: AuditDraft | null
  onRestoreDraft?: () => void
  onDiscardDraft?: () => void
}

export function IntroScreen({ 
  onStart, 
  existingDraft, 
  onRestoreDraft, 
  onDiscardDraft 
}: IntroScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6">
          <Image
            src="/images/logo-guitarrita.png"
            alt="La Guitarrita"
            width={200}
            height={100}
            className="mx-auto"
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
        </div>

        <p className="text-lg text-muted-foreground mb-2">Auditoría Operacional</p>

        <p className="text-sm text-muted-foreground mb-8">
          Sistema de evaluación de estándares operativos para franquicias
        </p>

        <div className="space-y-4 text-left mb-8 bg-muted p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-sm">Información básica</p>
              <p className="text-xs text-muted-foreground">Local, auditor y fecha</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-sm">Evaluación por áreas</p>
              <p className="text-xs text-muted-foreground">Salón, Cocina y Calidad</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-sm">Resumen y envío</p>
              <p className="text-xs text-muted-foreground">Revisar y confirmar auditoría</p>
            </div>
          </div>
        </div>

        {/* Draft recovery prompt */}
        {existingDraft && onRestoreDraft && onDiscardDraft && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-800 text-sm">
                  Auditoría en curso encontrada
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  {existingDraft.metadata.locationName} - {formatDateForDisplay(existingDraft.metadata.auditDate)}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Auditores: {existingDraft.metadata.auditorNames.join(', ')}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    onClick={onRestoreDraft} 
                    size="sm" 
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Continuar auditoría
                  </Button>
                  <Button 
                    onClick={onDiscardDraft} 
                    variant="outline" 
                    size="sm"
                    className="border-amber-600 text-amber-700 hover:bg-amber-50"
                  >
                    Descartar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Button onClick={onStart} size="lg" className="w-full h-12 bg-red-600 hover:bg-red-700 text-white">
          {existingDraft ? 'Nueva Auditoría' : 'Iniciar Auditoría'}
        </Button>

        <Link href="/dashboard" className="w-full">
          <Button variant="outline" size="lg" className="w-full h-12 mt-3 border-red-600 text-red-600 hover:bg-red-50">
            <LayoutDashboard className="h-5 w-5 mr-2" />
            Acceder a Pizzarra
          </Button>
        </Link>
      </div>
    </div>
  )
}
