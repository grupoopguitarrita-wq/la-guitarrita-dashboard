'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { IntroScreen } from '@/components/audit/intro-screen'
import { MetadataScreen } from '@/components/audit/metadata-screen'
import { AreaSelectorScreen } from '@/components/audit/area-selector-screen'
import { AreaSummaryScreen } from '@/components/audit/area-summary-screen'
import { SectionStep } from '@/components/audit/section-step'
import { FinalReportScreen } from '@/components/audit/final-report-screen'
import { SuccessScreen } from '@/components/audit/success-screen'
import { ProgressHeader } from '@/components/audit/progress-header'
import { BottomNavigation } from '@/components/audit/bottom-navigation'
import type { AuditMetadata, AuditResponses, ItemResponse, GlobalScores } from '@/types/audit'
import { AUDIT_STRUCTURE } from '@/data/audit-structure'
import {
  calculateGlobalScores,
  calculateAreaScore,
  validateCategory,
  getAreaCompletion,
} from '@/lib/audit-scoring'
import {
  createAudit,
  uploadPhoto,
  debouncedSaveResponse,
  flushPendingSaves,
  submitAudit,
  saveAreaScore,
} from '@/lib/audit-persistence'
import { generateAreaPdf, generateFinalPdf } from '@/lib/pdf-generator'
import { getLocalDateString } from '@/lib/date-utils'
import { 
  saveDraft, 
  findExistingDraft, 
  deleteDraftByMetadata,
  hasUnsavedData,
  type AuditDraft 
} from '@/lib/draft-persistence'

type AppStep = 
  | 'intro' 
  | 'metadata' 
  | 'area-selector' 
  | 'area-audit' 
  | 'area-summary' 
  | 'final-report' 
  | 'success'

export default function AuditPage() {
  // Navigation state
  const [appStep, setAppStep] = useState<AppStep>('intro')
  const [currentAreaId, setCurrentAreaId] = useState<string | null>(null)
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [completedAreas, setCompletedAreas] = useState<string[]>([])

  // Audit state
  const [auditId, setAuditId] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<AuditMetadata>({
    locationId: '',
    locationName: '',
    auditorName: '',
    auditorNames: [],
    auditDate: getLocalDateString(),
    auditQuarter: 'Q1',
  })
  const [responses, setResponses] = useState<AuditResponses>({})
  const [finalScores, setFinalScores] = useState<GlobalScores | null>(null)
  
  // Draft recovery state
  const [existingDraft, setExistingDraft] = useState<AuditDraft | null>(null)
  const [showDraftPrompt, setShowDraftPrompt] = useState(false)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<
    Record<string, Record<string, string[]>>
  >({})

  // Check for existing draft on mount
  useEffect(() => {
    const draft = findExistingDraft()
    if (draft) {
      setExistingDraft(draft)
      setShowDraftPrompt(true)
    }
  }, [])

  // Save draft on every state change (debounced effect)
  useEffect(() => {
    // Only save if we're past intro and have meaningful data
    if (appStep === 'intro' || appStep === 'success') return
    if (!metadata.locationId) return

    const draft: AuditDraft = {
      metadata,
      auditId,
      responses,
      appStep,
      currentAreaId,
      categoryIndex,
      completedAreas,
      savedAt: new Date().toISOString(),
    }

    saveDraft(draft)
  }, [metadata, auditId, responses, appStep, currentAreaId, categoryIndex, completedAreas])

  // Warn user before leaving if there's unsaved data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedData(appStep, responses, auditId)) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [appStep, responses, auditId])

  // Handle restoring draft
  const handleRestoreDraft = () => {
    if (!existingDraft) return

    setMetadata(existingDraft.metadata)
    setAuditId(existingDraft.auditId)
    setResponses(existingDraft.responses)
    setAppStep(existingDraft.appStep)
    setCurrentAreaId(existingDraft.currentAreaId)
    setCategoryIndex(existingDraft.categoryIndex)
    setCompletedAreas(existingDraft.completedAreas)
    setShowDraftPrompt(false)
    setExistingDraft(null)
  }

  // Handle discarding draft
  const handleDiscardDraft = () => {
    if (existingDraft) {
      deleteDraftByMetadata(existingDraft.metadata)
    }
    setShowDraftPrompt(false)
    setExistingDraft(null)
  }

  // Current area and category
  const currentArea = useMemo(
    () => (currentAreaId ? AUDIT_STRUCTURE.areas.find((a) => a.id === currentAreaId) : null),
    [currentAreaId]
  )
  const currentCategory = currentArea?.categories[categoryIndex]

  // Scores
  const globalScores = useMemo(
    () => calculateGlobalScores(responses),
    [responses]
  )

  const currentAreaScore = useMemo(
    () => (currentAreaId ? calculateAreaScore(currentAreaId, responses) : null),
    [currentAreaId, responses]
  )

  // Calculate step progress within current area
  const areaStepInfo = useMemo(() => {
    if (!currentArea) return { current: 0, total: 0 }
    return {
      current: categoryIndex + 1,
      total: currentArea.categories.length,
    }
  }, [currentArea, categoryIndex])

  // Navigation handlers
  const handleStartFromIntro = () => {
    setAppStep('metadata')
  }

  const handleBackToIntro = () => {
    setAppStep('intro')
  }

  const handleMetadataComplete = async (newMetadata: AuditMetadata) => {
    setMetadata(newMetadata)

    try {
      const id = await createAudit(newMetadata)
      setAuditId(id)
      setAppStep('area-selector')
    } catch (error) {
      console.error('Error creating audit:', error)
      alert('Error al crear la auditoría. Por favor intente de nuevo.')
    }
  }

  const handleSelectArea = (areaId: string) => {
    setCurrentAreaId(areaId)
    setCategoryIndex(0)
    setAppStep('area-audit')
  }

  const handleItemResponseChange = useCallback(
    (itemId: string, partialResponse: Partial<ItemResponse>) => {
      setResponses((prev) => {
        const existing = prev[itemId] ?? {
          value: null,
          observation: '',
          photoUrl: null,
          photoUrls: [],
          customLabel: '',
          textValue: '',
        }

        const updated = { ...existing, ...partialResponse }

        // Debounced save to Supabase
        if (auditId) {
          debouncedSaveResponse(auditId, itemId, updated)
        }

        return { ...prev, [itemId]: updated }
      })

      // Clear validation errors for this item
      setValidationErrors((prev) => {
        if (!currentArea || !currentCategory) return prev

        const areaErrors = { ...prev[currentArea.id] }
        if (areaErrors[currentCategory.id]) {
          const categoryErrors = { ...areaErrors[currentCategory.id] }
          delete categoryErrors[itemId]
          areaErrors[currentCategory.id] = categoryErrors
        }

        return { ...prev, [currentArea.id]: areaErrors }
      })
    },
    [auditId, currentArea, currentCategory]
  )

  const handlePhotoUpload = useCallback(
    async (itemId: string, file: File): Promise<string> => {
      if (!auditId) throw new Error('No audit ID')
      return uploadPhoto(auditId, itemId, file)
    },
    [auditId]
  )

  const navigateNextInArea = async () => {
    if (!currentArea || !currentCategory) return

    // Validate current category
    const validation = validateCategory(
      currentCategory.id,
      currentArea.id,
      responses
    )

    if (!validation.valid) {
      setValidationErrors((prev) => ({
        ...prev,
        [currentArea.id]: {
          ...prev[currentArea.id],
          [currentCategory.id]: validation.itemErrors,
        },
      }))
      return
    }

    // Flush any pending saves
    await flushPendingSaves()

    // Move to next category or area summary
    if (categoryIndex < currentArea.categories.length - 1) {
      setCategoryIndex(categoryIndex + 1)
    } else {
      // Area complete - mark as completed and show area summary
      if (!completedAreas.includes(currentArea.id)) {
        setCompletedAreas((prev) => [...prev, currentArea.id])
      }

      // Save area score immediately (don't wait for full submission)
      if (auditId) {
        try {
          await saveAreaScore(auditId, currentArea.id, responses)
        } catch (error) {
          console.error('Error saving area score:', error)
          // Non-blocking - continue to summary even if score save fails
        }
      }

      setAppStep('area-summary')
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigatePreviousInArea = () => {
    if (categoryIndex > 0) {
      setCategoryIndex(categoryIndex - 1)
    } else {
      // Back to area selector
      setAppStep('area-selector')
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleContinueFromAreaSummary = () => {
    setCurrentAreaId(null)
    setCategoryIndex(0)
    setAppStep('area-selector')
  }

  const handleViewFinalReport = () => {
    setAppStep('final-report')
  }

  const handleBackToAreaSelector = () => {
    setAppStep('area-selector')
  }

  const handleSubmit = async () => {
    if (!auditId) return

    setIsSubmitting(true)
    try {
      // Flush any pending saves first
      await flushPendingSaves()

      // Submit the audit
      await submitAudit(auditId, responses)

      // Delete the draft since audit was successfully submitted
      if (metadata.locationId) {
        deleteDraftByMetadata(metadata)
      }

      // Store final scores for success screen
      setFinalScores(globalScores)

      // Go to success screen
      setAppStep('success')
    } catch (error) {
      console.error('Error submitting audit:', error)
      alert('Error al enviar la auditoría. Por favor intente de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewAudit = () => {
    // Delete the current draft since we're starting fresh
    if (metadata.locationId) {
      deleteDraftByMetadata(metadata)
    }
    
    // Reset all state
    setAppStep('intro')
    setCurrentAreaId(null)
    setCategoryIndex(0)
    setCompletedAreas([])
    setAuditId(null)
    setMetadata({
      locationId: '',
      locationName: '',
      auditorName: '',
      auditorNames: [],
      auditDate: getLocalDateString(),
      auditQuarter: 'Q1',
    })
    setResponses({})
    setFinalScores(null)
    setValidationErrors({})
  }

  const handleDownloadAreaPdf = async () => {
    if (!currentAreaId) return
    await generateAreaPdf(currentAreaId, metadata, responses)
  }

  const handleDownloadFinalPdf = async () => {
    await generateFinalPdf(metadata, responses)
  }

  // Check if current area is the last one to be completed
  const isLastAreaToComplete = useMemo(() => {
    const remainingAreas = AUDIT_STRUCTURE.areas.filter(
      (a) => !completedAreas.includes(a.id)
    )
    return remainingAreas.length === 1 && remainingAreas[0].id === currentAreaId
  }, [completedAreas, currentAreaId])

  // Render based on current app step
  if (appStep === 'intro') {
    return (
      <IntroScreen 
        onStart={handleStartFromIntro}
        existingDraft={showDraftPrompt ? existingDraft : null}
        onRestoreDraft={handleRestoreDraft}
        onDiscardDraft={handleDiscardDraft}
      />
    )
  }

  if (appStep === 'metadata') {
    return (
      <MetadataScreen
        initialMetadata={metadata}
        onContinue={handleMetadataComplete}
        onBack={handleBackToIntro}
      />
    )
  }

  if (appStep === 'area-selector') {
    return (
      <AreaSelectorScreen
        metadata={metadata}
        responses={responses}
        completedAreas={completedAreas}
        onSelectArea={handleSelectArea}
        onViewFinalReport={handleViewFinalReport}
      />
    )
  }

  if (appStep === 'area-summary' && currentAreaId) {
    const allCompleted = completedAreas.length === AUDIT_STRUCTURE.areas.length
    return (
      <AreaSummaryScreen
        areaId={currentAreaId}
        metadata={metadata}
        responses={responses}
        isLastArea={allCompleted}
        onContinue={handleContinueFromAreaSummary}
        onViewFinalReport={handleViewFinalReport}
        onDownloadPdf={handleDownloadAreaPdf}
      />
    )
  }

  if (appStep === 'final-report') {
    return (
      <FinalReportScreen
        metadata={metadata}
        responses={responses}
        onBack={handleBackToAreaSelector}
        onSubmit={handleSubmit}
        onDownloadPdf={handleDownloadFinalPdf}
        isSubmitting={isSubmitting}
      />
    )
  }

  if (appStep === 'success' && finalScores) {
    return (
      <SuccessScreen
        metadata={metadata}
        scores={finalScores}
        onNewAudit={handleNewAudit}
      />
    )
  }

  // Area audit step
  if (appStep === 'area-audit' && currentArea && currentCategory) {
    const isLastCategoryInArea = categoryIndex === currentArea.categories.length - 1

    return (
      <main className="min-h-screen bg-background">
        <ProgressHeader
          currentStep={areaStepInfo.current}
          totalSteps={areaStepInfo.total}
          areaLabel={currentArea.label}
          categoryLabel={currentCategory.label}
          globalScore={currentAreaScore?.percentage ?? 0}
          globalLabel={currentAreaScore ? (currentAreaScore.percentage >= 90 ? 'Excelente' : currentAreaScore.percentage >= 80 ? 'Óptimo' : currentAreaScore.percentage >= 70 ? 'Aceptable' : 'Requiere acción') : ''}
        />

        <SectionStep
          area={currentArea}
          responses={responses}
          onItemResponseChange={handleItemResponseChange}
          onPhotoUpload={handlePhotoUpload}
          categoryErrors={validationErrors[currentArea.id]}
          currentCategoryIndex={categoryIndex}
        />

        <BottomNavigation
          onPrevious={navigatePreviousInArea}
          onNext={navigateNextInArea}
          canGoPrevious={true}
          canGoNext={true}
          isLastStep={isLastCategoryInArea}
          isSummary={false}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          nextLabel={isLastCategoryInArea ? 'Finalizar Área' : undefined}
        />
      </main>
    )
  }

  return null
}
