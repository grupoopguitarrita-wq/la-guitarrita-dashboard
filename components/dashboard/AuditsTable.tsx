'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import type { AuditWithLocation } from '@/app/dashboard/page'
import { generateAreaPdf, generateFinalPdf } from '@/lib/pdf-generator'
import type { AuditMetadata, AuditResponses } from '@/types/audit'

type AuditsTableProps = {
  audits: AuditWithLocation[]
}

function getScoreDisplay(score: number | null, source: 'saved' | 'fallback' | null): { 
  text: string
  className: string
  sourceLabel: string | null
} {
  if (score === null) {
    return { text: 'Pendiente', className: 'text-muted-foreground', sourceLabel: null }
  }
  
  let className: string
  if (score >= 90) {
    className = 'text-emerald-600 font-medium'
  } else if (score >= 75) {
    className = 'text-blue-600 font-medium'
  } else if (score >= 60) {
    className = 'text-amber-600 font-medium'
  } else {
    className = 'text-red-600 font-medium'
  }
  
  // Only show label if explicitly from saved DB value
  const sourceLabel = source === 'saved' ? 'DB' : null
  
  return { text: `${score}%`, className, sourceLabel }
}

function formatTime(isoString: string | null): string {
  if (!isoString) return '-'
  const date = new Date(isoString)
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '-'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function AuditsTable({ audits }: AuditsTableProps) {
  const [expanded, setExpanded] = useState(false)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [selectedAudit, setSelectedAudit] = useState<AuditWithLocation | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null)

  const displayedAudits = expanded ? audits : audits.slice(0, 10)

  const [loadingResponses, setLoadingResponses] = useState(false)

  const openPdfDialog = async (audit: AuditWithLocation) => {
    setSelectedAudit(audit)
    setPdfDialogOpen(true)
    
    // If responses are not loaded, fetch them on-demand using ALL audit_ids in the group
    if (audit.responses.length === 0 && audit.totalResponses > 0) {
      setLoadingResponses(true)
      try {
        // Fetch responses for all audit_ids in this grouped audit set
        const { data, error } = await supabase
          .from('google_sheets_audit_export')
          .select('item_id, area_id, area_label, category_label, item_label, rating_value, rating_label, observation, photo_url, custom_label, text_value')
          .in('audit_id', audit.auditIds)
          .not('response_id', 'is', null)

        if (!error && data) {
          // Update the audit with fetched responses
          audit.responses = data.map(r => ({
            item_id: r.item_id || '',
            area_id: r.area_id || '',
            area_label: r.area_label || '',
            category_label: r.category_label || '',
            item_label: r.item_label || '',
            rating_value: r.rating_value,
            rating_label: r.rating_label,
            observation: r.observation,
            photo_url: r.photo_url,
            custom_label: r.custom_label,
            text_value: r.text_value
          }))
          // Force re-render
          setSelectedAudit({ ...audit })
        }
      } catch (err) {
        console.error('Error fetching responses:', err)
      } finally {
        setLoadingResponses(false)
      }
    }
  }

  const handleGeneratePdf = async (type: 'salon' | 'cocina' | 'calidad' | 'final') => {
    if (!selectedAudit) return
    
    setGeneratingPdf(type)

    // Build metadata from audit
    const metadata: AuditMetadata = {
      locationId: selectedAudit.location_id,
      locationName: selectedAudit.location.name,
      auditorName: selectedAudit.auditor_name,
      auditorNames: [selectedAudit.auditor_name],
      auditDate: selectedAudit.audit_date,
      auditQuarter: selectedAudit.audit_quarter || 'N/A'
    }

    // Build responses from audit_responses
    const responses: AuditResponses = {}
    for (const r of selectedAudit.responses) {
      responses[r.item_id] = {
        value: r.rating_value,
        observation: r.observation || '',
        photoUrl: r.photo_url || null,
        photoUrls: r.photo_url ? [r.photo_url] : [],
        customLabel: r.custom_label || '',
        textValue: r.text_value || ''
      }
    }

    try {
      if (type === 'final') {
        await generateFinalPdf(metadata, responses)
      } else {
        await generateAreaPdf(type, metadata, responses)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setGeneratingPdf(null)
    }
  }

  if (audits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auditorias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No hay auditorias para mostrar
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Auditorias ({audits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Local</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Trimestre</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Duracion</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Salon</TableHead>
                  <TableHead className="text-right">Cocina</TableHead>
                  <TableHead className="text-right">Calidad</TableHead>
                  <TableHead className="text-right">Global</TableHead>
                  <TableHead>PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedAudits.map((audit) => {
                  const salonScore = getScoreDisplay(audit.salon_score, audit.salon_score_source)
                  const cocinaScore = getScoreDisplay(audit.cocina_score, audit.cocina_score_source)
                  const calidadScore = getScoreDisplay(audit.calidad_score, audit.calidad_score_source)
                  const globalScore = getScoreDisplay(audit.global_score, audit.global_score_source)

                  return (
                    <TableRow key={audit.id}>
                      <TableCell className="font-medium">{audit.location.name}</TableCell>
                      <TableCell>{audit.auditor_name}</TableCell>
                      <TableCell>{audit.audit_quarter || '-'}</TableCell>
                      <TableCell>{formatDate(audit.audit_date)}</TableCell>
                      <TableCell>{formatTime(audit.startTime)}</TableCell>
                      <TableCell>{formatTime(audit.endTime)}</TableCell>
                      <TableCell>{formatDuration(audit.duration)}</TableCell>
                      <TableCell>
                        <Badge variant={audit.status === 'submitted' ? 'default' : 'secondary'}>
                          {audit.status === 'submitted' ? 'Enviada' : 'En progreso'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={salonScore.className}>{salonScore.text}</div>
                        {salonScore.sourceLabel && (
                          <div className="text-[10px] text-muted-foreground">{salonScore.sourceLabel}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={cocinaScore.className}>{cocinaScore.text}</div>
                        {cocinaScore.sourceLabel && (
                          <div className="text-[10px] text-muted-foreground">{cocinaScore.sourceLabel}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={calidadScore.className}>{calidadScore.text}</div>
                        {calidadScore.sourceLabel && (
                          <div className="text-[10px] text-muted-foreground">{calidadScore.sourceLabel}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={globalScore.className}>{globalScore.text}</div>
                        {globalScore.sourceLabel && (
                          <div className="text-[10px] text-muted-foreground">{globalScore.sourceLabel}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPdfDialog(audit)}
                          disabled={audit.totalResponses === 0 && audit.responses.length === 0}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {displayedAudits.map((audit) => {
              const salonScore = getScoreDisplay(audit.salon_score, audit.salon_score_source)
              const cocinaScore = getScoreDisplay(audit.cocina_score, audit.cocina_score_source)
              const calidadScore = getScoreDisplay(audit.calidad_score, audit.calidad_score_source)
              const globalScore = getScoreDisplay(audit.global_score, audit.global_score_source)

              return (
                <div key={audit.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{audit.location.name}</p>
                      <p className="text-sm text-muted-foreground">{audit.auditor_name}</p>
                    </div>
                    <Badge variant={audit.status === 'submitted' ? 'default' : 'secondary'}>
                      {audit.status === 'submitted' ? 'Enviada' : 'En progreso'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Fecha</p>
                      <p>{formatDate(audit.audit_date)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duracion</p>
                      <p>{formatDuration(audit.duration)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Trimestre</p>
                      <p>{audit.audit_quarter || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Salon</p>
                      <p className={salonScore.className}>{salonScore.text}</p>
                      {salonScore.sourceLabel && (
                        <p className="text-[9px] text-muted-foreground">{salonScore.sourceLabel}</p>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Cocina</p>
                      <p className={cocinaScore.className}>{cocinaScore.text}</p>
                      {cocinaScore.sourceLabel && (
                        <p className="text-[9px] text-muted-foreground">{cocinaScore.sourceLabel}</p>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Calidad</p>
                      <p className={calidadScore.className}>{calidadScore.text}</p>
                      {calidadScore.sourceLabel && (
                        <p className="text-[9px] text-muted-foreground">{calidadScore.sourceLabel}</p>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">Global</p>
                      <p className={globalScore.className}>{globalScore.text}</p>
                      {globalScore.sourceLabel && (
                        <p className="text-[9px] text-muted-foreground">{globalScore.sourceLabel}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => openPdfDialog(audit)}
                    disabled={audit.totalResponses === 0 && audit.responses.length === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver PDFs
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Show More/Less Button */}
          {audits.length > 10 && (
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
                    Ver todas ({audits.length})
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Dialog */}
      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar PDF</DialogTitle>
          </DialogHeader>
          {selectedAudit && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {selectedAudit.location.name} - {selectedAudit.audit_quarter}
              </p>
              {loadingResponses && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                  Cargando respuestas...
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleGeneratePdf('salon')}
                  disabled={generatingPdf !== null || selectedAudit.salon_score === null}
                  className="justify-start"
                >
                  {generatingPdf === 'salon' ? 'Generando...' : 'Ver Salon PDF'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleGeneratePdf('cocina')}
                  disabled={generatingPdf !== null || selectedAudit.cocina_score === null}
                  className="justify-start"
                >
                  {generatingPdf === 'cocina' ? 'Generando...' : 'Ver Cocina PDF'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleGeneratePdf('calidad')}
                  disabled={generatingPdf !== null || selectedAudit.calidad_score === null}
                  className="justify-start"
                >
                  {generatingPdf === 'calidad' ? 'Generando...' : 'Ver Calidad PDF'}
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleGeneratePdf('final')}
                  disabled={generatingPdf !== null || selectedAudit.responses.length === 0}
                  className="justify-start bg-red-600 hover:bg-red-700"
                >
                  {generatingPdf === 'final' ? 'Generando...' : 'Informe Final'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
