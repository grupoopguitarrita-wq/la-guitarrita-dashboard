'use client'

import { useEffect, useState } from 'react'
import { MapPin, User, Calendar, Loader2, AlertCircle, ClipboardList, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import type { Location } from '@/types/database'
import type { AuditMetadata, AuditQuarter } from '@/types/audit'
import { AUDITOR_OPTIONS, QUARTER_OPTIONS } from '@/types/audit'
import { fetchLocations } from '@/lib/audit-persistence'
import { getLocalDateString } from '@/lib/date-utils'

type MetadataScreenProps = {
  initialMetadata: AuditMetadata
  onContinue: (metadata: AuditMetadata) => void
  onBack: () => void
}

export function MetadataScreen({
  initialMetadata,
  onContinue,
  onBack,
}: MetadataScreenProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [locationId, setLocationId] = useState(initialMetadata.locationId)
  // Support both single and multiple auditors
  const [auditorNames, setAuditorNames] = useState<string[]>(
    initialMetadata.auditorNames?.length > 0
      ? initialMetadata.auditorNames
      : initialMetadata.auditorName
        ? [initialMetadata.auditorName]
        : []
  )
  const [auditDate, setAuditDate] = useState(
    initialMetadata.auditDate || getLocalDateString()
  )
  const [auditQuarter, setAuditQuarter] = useState<AuditQuarter | ''>(
    initialMetadata.auditQuarter || ''
  )

  const handleAddAuditor = (auditor: string) => {
    if (!auditorNames.includes(auditor)) {
      setAuditorNames([...auditorNames, auditor])
    }
  }

  const handleRemoveAuditor = (auditor: string) => {
    setAuditorNames(auditorNames.filter(a => a !== auditor))
  }

  // Get available auditors (those not already selected)
  const availableAuditors = AUDITOR_OPTIONS.filter(a => !auditorNames.includes(a))

  useEffect(() => {
    async function loadLocations() {
      try {
        const data = await fetchLocations()
        setLocations(data)
        setError(null)
      } catch (err) {
        console.error('Error loading locations:', err)
        setError('No se pudieron cargar los locales. Verifica tu conexión a Supabase.')
      } finally {
        setLoading(false)
      }
    }

    loadLocations()
  }, [])

  const selectedLocation = locations.find((l) => l.id === locationId)

  const canContinue = locationId && auditorNames.length > 0 && auditDate && auditQuarter

  const handleContinue = () => {
    if (!canContinue || !selectedLocation || !auditQuarter) return

    onContinue({
      locationId,
      locationName: selectedLocation.name,
      // Keep auditorName for backward compatibility (use first auditor)
      auditorName: auditorNames[0] || '',
      auditorNames,
      auditDate,
      auditQuarter,
    })
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-background">
      <div className="flex-1 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold mb-2">Información de la Auditoría</h1>
        <p className="text-muted-foreground mb-8">
          Complete los datos antes de iniciar la evaluación
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800 font-medium">Error de conexión</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        <FieldGroup className="space-y-6">
          <Field>
            <FieldLabel>
              <MapPin className="w-4 h-4 inline mr-2" />
              Local
            </FieldLabel>
            {loading ? (
              <div className="flex items-center gap-2 h-10 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando locales...
              </div>
            ) : (
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Seleccionar local..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          <Field>
            <FieldLabel>
              <User className="w-4 h-4 inline mr-2" />
              Auditores
            </FieldLabel>
            
            {/* Selected auditors */}
            {auditorNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {auditorNames.map((auditor) => (
                  <Badge
                    key={auditor}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1.5 text-sm"
                  >
                    {auditor}
                    <button
                      type="button"
                      onClick={() => handleRemoveAuditor(auditor)}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Add auditor dropdown */}
            {availableAuditors.length > 0 && (
              <Select value="" onValueChange={handleAddAuditor}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder={auditorNames.length > 0 ? "Agregar otro auditor..." : "Seleccionar auditor..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableAuditors.map((auditor) => (
                    <SelectItem key={auditor} value={auditor}>
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        {auditor}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {auditorNames.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Seleccione al menos un auditor
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>
              <ClipboardList className="w-4 h-4 inline mr-2" />
              Auditoría
            </FieldLabel>
            <Select value={auditQuarter} onValueChange={(v) => setAuditQuarter(v as AuditQuarter)}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Seleccionar trimestre..." />
              </SelectTrigger>
              <SelectContent>
                {QUARTER_OPTIONS.map((quarter) => (
                  <SelectItem key={quarter} value={quarter}>
                    {quarter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>
              <Calendar className="w-4 h-4 inline mr-2" />
              Fecha de Auditoría
            </FieldLabel>
            <Input
              type="date"
              value={auditDate}
              onChange={(e) => setAuditDate(e.target.value)}
              className="h-12"
            />
          </Field>
        </FieldGroup>
      </div>

      <div className="max-w-md mx-auto w-full mt-8 flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12">
          Atrás
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300"
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
