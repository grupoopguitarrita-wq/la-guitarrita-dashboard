'use client'

import { useRef, useState } from 'react'
import { Camera, Copy, X, AlertCircle, Loader2, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { RatingSelector } from './rating-selector'
import type { AuditItem as AuditItemType, ItemResponse, RatingValue } from '@/types/audit'
import { RATING_OPTIONS, getResponsePhotos } from '@/types/audit'

type AuditItemProps = {
  item: AuditItemType
  response: ItemResponse
  onResponseChange: (response: Partial<ItemResponse>) => void
  onPhotoUpload: (file: File) => Promise<string>
  errors?: string[]
}

export function AuditItem({
  item,
  response,
  onResponseChange,
  onPhotoUpload,
  errors = [],
}: AuditItemProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleRatingChange = (value: RatingValue) => {
    onResponseChange({ value })
  }

  const handleObservationChange = (observation: string) => {
    onResponseChange({ observation })
  }

  const handleCustomLabelChange = (customLabel: string) => {
    onResponseChange({ customLabel })
  }

  const handleTextValueChange = (textValue: string) => {
    onResponseChange({ textValue })
  }

  // Get current photos using helper for backward compatibility
  const currentPhotos = getResponsePhotos(response)

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const newPhotoUrl = await onPhotoUpload(file)
      // Add to existing photos array
      const updatedPhotos = [...currentPhotos, newPhotoUrl]
      onResponseChange({ 
        photoUrls: updatedPhotos,
        // Keep photoUrl in sync (use first photo for backward compatibility)
        photoUrl: updatedPhotos[0] || null
      })
    } catch (error) {
      console.error('Error uploading photo:', error)
    } finally {
      setIsUploading(false)
      // Clear both inputs
      if (cameraInputRef.current) {
        cameraInputRef.current.value = ''
      }
      if (galleryInputRef.current) {
        galleryInputRef.current.value = ''
      }
    }
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  const handleGalleryClick = () => {
    galleryInputRef.current?.click()
  }

  const handleRemovePhoto = (indexToRemove: number) => {
    const updatedPhotos = currentPhotos.filter((_, index) => index !== indexToRemove)
    onResponseChange({ 
      photoUrls: updatedPhotos,
      photoUrl: updatedPhotos[0] || null
    })
  }

  const handleCopySuggestion = (suggestion: string) => {
    onResponseChange({ observation: suggestion })
  }

  // Get suggestion for current rating
  const currentSuggestion =
    response.value !== null && response.value !== 0 && item.suggestions
      ? item.suggestions[response.value]
      : null

  // Check if observation/photo is required
  const ratingOption = RATING_OPTIONS.find((o) => o.value === response.value)
  const requiresObservation = ratingOption?.requiresObservation ?? false
  const requiresPhoto = ratingOption?.requiresPhoto ?? false

  const hasErrors = errors.length > 0

  // Text-only field
  if (item.isTextField) {
    return (
      <div className={cn('p-4 rounded-lg border bg-card', hasErrors && 'border-red-300')}>
        <div className="mb-3">
          <h3 className="font-medium text-foreground">{item.label}</h3>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          )}
        </div>
        <Input
          placeholder="Ingrese valor..."
          value={response.textValue}
          onChange={(e) => handleTextValueChange(e.target.value)}
          className="w-full"
        />
        {hasErrors && (
          <div className="mt-2 flex items-start gap-1.5 text-red-600">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm">{errors.join(', ')}</p>
          </div>
        )}
      </div>
    )
  }

  // Custom label field
  if (item.isCustomLabel) {
    return (
      <div className={cn('p-4 rounded-lg border bg-card', hasErrors && 'border-red-300')}>
        <div className="mb-3">
          <Input
            placeholder="Nombre del item (opcional)"
            value={response.customLabel}
            onChange={(e) => handleCustomLabelChange(e.target.value)}
            className="font-medium"
          />
          {item.description && (
            <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
          )}
        </div>

        {response.customLabel && (
          <>
            <RatingSelector value={response.value} onChange={handleRatingChange} />

            {currentSuggestion && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-muted-foreground flex-1">{currentSuggestion}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopySuggestion(currentSuggestion)}
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-3">
              <Textarea
                placeholder={
                  requiresObservation ? 'Observación requerida...' : 'Observación (opcional)...'
                }
                value={response.observation}
                onChange={(e) => handleObservationChange(e.target.value)}
                className={cn('min-h-[80px]', requiresObservation && !response.observation && 'border-amber-400')}
              />
            </div>

            {/* Photo upload section - improved UX for mobile */}
            <div className="mt-3">
              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              
              {/* Photo action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={requiresPhoto && currentPhotos.length === 0 ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={handleCameraClick}
                  disabled={isUploading}
                  className="flex-1 min-w-[120px]"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  Sacar foto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGalleryClick}
                  disabled={isUploading}
                  className="flex-1 min-w-[120px]"
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  Elegir de galería
                </Button>
              </div>
              
              {requiresPhoto && currentPhotos.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Foto requerida para esta calificación</p>
              )}

              {/* Photo thumbnails */}
              {currentPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentPhotos.map((photoUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photoUrl}
                        alt={`Evidencia ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {hasErrors && (
          <div className="mt-2 flex items-start gap-1.5 text-red-600">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm">{errors.join(', ')}</p>
          </div>
        )}
      </div>
    )
  }

  // Standard rating item
  return (
    <div className={cn('p-4 rounded-lg border bg-card', hasErrors && 'border-red-300')}>
      <div className="mb-3">
        <h3 className="font-medium text-foreground">{item.label}</h3>
        {item.description && (
          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        )}
      </div>

      <RatingSelector value={response.value} onChange={handleRatingChange} />

      {currentSuggestion && (
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-muted-foreground flex-1">{currentSuggestion}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleCopySuggestion(currentSuggestion)}
              className="shrink-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {response.value !== null && response.value !== 0 && (
        <>
          <div className="mt-3">
            <Textarea
              placeholder={
                requiresObservation ? 'Observación requerida...' : 'Observación (opcional)...'
              }
              value={response.observation}
              onChange={(e) => handleObservationChange(e.target.value)}
              className={cn('min-h-[80px]', requiresObservation && !response.observation && 'border-amber-400')}
            />
          </div>

          {/* Photo upload section - improved UX for mobile */}
          <div className="mt-3">
            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            
            {/* Photo action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={requiresPhoto && currentPhotos.length === 0 ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleCameraClick}
                disabled={isUploading}
                className="flex-1 min-w-[120px]"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                Sacar foto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGalleryClick}
                disabled={isUploading}
                className="flex-1 min-w-[120px]"
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                Elegir de galería
              </Button>
            </div>
            
            {requiresPhoto && currentPhotos.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Foto requerida para esta calificación</p>
            )}

            {/* Photo thumbnails */}
            {currentPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {currentPhotos.map((photoUrl, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photoUrl}
                      alt={`Evidencia ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {hasErrors && (
        <div className="mt-2 flex items-start gap-1.5 text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">{errors.join(', ')}</p>
        </div>
      )}
    </div>
  )
}
