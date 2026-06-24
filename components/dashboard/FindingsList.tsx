'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronDown, ChevronUp, AlertTriangle, XCircle, ImageIcon } from 'lucide-react'
import type { NegativeFinding } from '@/app/dashboard/page'

type FindingsListProps = {
  findings: NegativeFinding[]
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function FindingsList({ findings }: FindingsListProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const criticalCount = findings.filter(f => f.ratingValue === -2).length
  const noCumpleCount = findings.filter(f => f.ratingValue === -1).length

  const displayedFindings = expanded ? findings : findings.slice(0, 10)

  if (findings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hallazgos Negativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No hay hallazgos negativos
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base">
              Hallazgos Negativos ({findings.length})
            </CardTitle>
            <div className="flex gap-2">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  {criticalCount} Criticos
                </Badge>
              )}
              {noCumpleCount > 0 && (
                <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
                  <AlertTriangle className="h-3 w-3" />
                  {noCumpleCount} No cumple
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayedFindings.map((finding, index) => (
              <div
                key={`${finding.auditId}-${finding.itemLabel}-${index}`}
                className={`rounded-lg p-4 ${
                  finding.ratingValue === -2
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-amber-50 border border-amber-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={finding.ratingValue === -2 ? 'destructive' : 'secondary'}
                        className={finding.ratingValue === -1 ? 'bg-amber-500 text-white hover:bg-amber-500' : ''}
                      >
                        {finding.ratingLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {finding.areaLabel} / {finding.categoryLabel}
                      </span>
                    </div>
                    <p className="font-medium mt-2">{finding.itemLabel}</p>
                    {finding.observation && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {finding.observation}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-right text-sm">
                      <p className="font-medium">{finding.locationName}</p>
                      <p className="text-muted-foreground">{finding.auditorName}</p>
                      <p className="text-muted-foreground">{formatDate(finding.auditDate)}</p>
                    </div>
                    {finding.photoUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => setSelectedImage(finding.photoUrl)}
                      >
                        <ImageIcon className="h-4 w-4" />
                        Ver foto
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {findings.length > 10 && (
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => setExpanded(!expanded)}
                className="gap-2"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Ver todos ({findings.length})
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foto del hallazgo</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full aspect-video">
              <Image
                src={selectedImage}
                alt="Foto del hallazgo"
                fill
                className="object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
