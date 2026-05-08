import type { AuditMetadata, AuditResponses, AuditQuarter } from '@/types/audit'

type AppStep = 
  | 'intro' 
  | 'metadata' 
  | 'area-selector' 
  | 'area-audit' 
  | 'area-summary' 
  | 'final-report' 
  | 'success'

export type AuditDraft = {
  // Metadata
  metadata: AuditMetadata
  // Supabase audit ID (if already created)
  auditId: string | null
  // All responses
  responses: AuditResponses
  // Navigation state
  appStep: AppStep
  currentAreaId: string | null
  categoryIndex: number
  completedAreas: string[]
  // Timestamp for draft management
  savedAt: string
}

const DRAFT_KEY_PREFIX = 'audit_draft_'

/**
 * Generate a unique key for the draft based on location, auditors, date, and quarter.
 * This allows multiple drafts for different audits.
 */
export function getDraftKey(
  locationId: string,
  auditorNames: string[],
  auditDate: string,
  auditQuarter: AuditQuarter | ''
): string {
  const auditorKey = auditorNames.sort().join('_') || 'unknown'
  return `${DRAFT_KEY_PREFIX}${locationId}_${auditorKey}_${auditDate}_${auditQuarter}`
}

/**
 * Get a simpler draft key for finding any existing draft for a location
 */
export function getLocationDraftPrefix(locationId: string): string {
  return `${DRAFT_KEY_PREFIX}${locationId}_`
}

/**
 * Save draft to localStorage immediately
 */
export function saveDraft(draft: AuditDraft): void {
  if (typeof window === 'undefined') return
  
  const key = getDraftKey(
    draft.metadata.locationId,
    draft.metadata.auditorNames,
    draft.metadata.auditDate,
    draft.metadata.auditQuarter
  )
  
  const draftToSave: AuditDraft = {
    ...draft,
    savedAt: new Date().toISOString(),
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(draftToSave))
  } catch (error) {
    console.error('Error saving draft to localStorage:', error)
  }
}

/**
 * Load draft from localStorage
 */
export function loadDraft(
  locationId: string,
  auditorNames: string[],
  auditDate: string,
  auditQuarter: AuditQuarter | ''
): AuditDraft | null {
  if (typeof window === 'undefined') return null
  
  const key = getDraftKey(locationId, auditorNames, auditDate, auditQuarter)
  
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return null
    
    const draft = JSON.parse(stored) as AuditDraft
    return draft
  } catch (error) {
    console.error('Error loading draft from localStorage:', error)
    return null
  }
}

/**
 * Find any existing draft (for showing "continue audit" prompt)
 */
export function findExistingDraft(): AuditDraft | null {
  if (typeof window === 'undefined') return null
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
        const stored = localStorage.getItem(key)
        if (stored) {
          const draft = JSON.parse(stored) as AuditDraft
          // Only return drafts that are actually in progress (not at intro or success)
          if (draft.appStep !== 'intro' && draft.appStep !== 'success') {
            return draft
          }
        }
      }
    }
  } catch (error) {
    console.error('Error finding existing draft:', error)
  }
  
  return null
}

/**
 * Delete a specific draft
 */
export function deleteDraft(
  locationId: string,
  auditorNames: string[],
  auditDate: string,
  auditQuarter: AuditQuarter | ''
): void {
  if (typeof window === 'undefined') return
  
  const key = getDraftKey(locationId, auditorNames, auditDate, auditQuarter)
  
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error deleting draft from localStorage:', error)
  }
}

/**
 * Delete draft by metadata
 */
export function deleteDraftByMetadata(metadata: AuditMetadata): void {
  deleteDraft(
    metadata.locationId,
    metadata.auditorNames,
    metadata.auditDate,
    metadata.auditQuarter
  )
}

/**
 * Clear all drafts (use with caution)
 */
export function clearAllDrafts(): void {
  if (typeof window === 'undefined') return
  
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(DRAFT_KEY_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.error('Error clearing all drafts:', error)
  }
}

/**
 * Check if there's unsaved data (for beforeunload warning)
 */
export function hasUnsavedData(
  appStep: AppStep,
  responses: AuditResponses,
  auditId: string | null
): boolean {
  // If we're past intro and have an audit in progress
  if (appStep === 'intro' || appStep === 'success') {
    return false
  }
  
  // If we have any responses or an audit ID, there's data to protect
  return Object.keys(responses).length > 0 || auditId !== null
}
