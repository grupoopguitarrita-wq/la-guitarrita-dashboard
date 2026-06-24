import type { AuditMetadata, AuditResponses } from '@/types/audit'
import { AUDIT_STRUCTURE } from '@/data/audit-structure'
import { calculateGlobalScores, calculateAreaScore } from './audit-scoring'
import { getGlobalLabel } from '@/types/audit'
import jsPDF from 'jspdf'

// Brand colors
const BRAND_RED = '#dc2626'
const DARK_GRAY = '#1f2937'
const MEDIUM_GRAY = '#6b7280'
const LIGHT_GRAY = '#9ca3af'

type NegativeFinding = {
  categoryLabel: string
  itemLabel: string
  severity: 'no_cumple' | 'critico'
  observation: string
  photoUrl: string | null
}

function getNegativeFindings(areaId: string, responses: AuditResponses): NegativeFinding[] {
  const area = AUDIT_STRUCTURE.areas.find((a) => a.id === areaId)
  if (!area) return []

  const findings: NegativeFinding[] = []

  for (const category of area.categories) {
    for (const item of category.items) {
      const response = responses[item.id]
      if (!response) continue

      if (response.value === -1 || response.value === -2) {
        findings.push({
          categoryLabel: category.label,
          itemLabel: item.isCustomLabel && response.customLabel ? response.customLabel : item.label,
          severity: response.value === -2 ? 'critico' : 'no_cumple',
          observation: response.observation || '',
          photoUrl: response.photoUrl || null,
        })
      }
    }
  }

  return findings
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#059669' // emerald
  if (score >= 80) return '#2563eb' // blue
  if (score >= 70) return '#d97706' // amber
  return '#dc2626' // red
}

function getScoreBgColor(score: number): { r: number; g: number; b: number } {
  if (score >= 90) return { r: 209, g: 250, b: 229 } // emerald-100
  if (score >= 80) return { r: 219, g: 234, b: 254 } // blue-100
  if (score >= 70) return { r: 254, g: 243, b: 199 } // amber-100
  return { r: 254, g: 226, b: 226 } // red-100
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

function sanitizeFilename(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Fits logo inside a bounding box while preserving aspect ratio.
 * maxWidth: 120pt, maxHeight: 50pt - scaled proportionally to fit inside.
 */
async function addLogo(doc: jsPDF, y: number): Promise<number> {
  const MAX_WIDTH = 120
  const MAX_HEIGHT = 50

  try {
    const logoBase64 = await loadImageAsBase64('/logo-guitarrita.png')
    if (logoBase64) {
      // Create an image element to get the natural dimensions
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject()
        img.src = logoBase64
      })

      const naturalWidth = img.naturalWidth
      const naturalHeight = img.naturalHeight

      // Calculate scale to fit inside max bounding box
      const scale = Math.min(MAX_WIDTH / naturalWidth, MAX_HEIGHT / naturalHeight)
      const finalWidth = naturalWidth * scale
      const finalHeight = naturalHeight * scale

      // Center horizontally
      const pageWidth = doc.internal.pageSize.getWidth()
      const x = (pageWidth - finalWidth) / 2

      doc.addImage(logoBase64, 'PNG', x, y, finalWidth, finalHeight)
      return y + finalHeight + 8
    }
  } catch {
    // Logo failed to load, continue without it
  }
  return y
}

function addHeader(doc: jsPDF, title: string, subtitle: string, startY: number): number {
  let y = startY
  const pageWidth = doc.internal.pageSize.getWidth()

  // Title
  doc.setFontSize(18)
  doc.setTextColor(hexToRgb(BRAND_RED).r, hexToRgb(BRAND_RED).g, hexToRgb(BRAND_RED).b)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, y, { align: 'center' })
  y += 8

  // Subtitle
  doc.setFontSize(11)
  doc.setTextColor(hexToRgb(MEDIUM_GRAY).r, hexToRgb(MEDIUM_GRAY).g, hexToRgb(MEDIUM_GRAY).b)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle, pageWidth / 2, y, { align: 'center' })
  y += 10

  // Divider line
  doc.setDrawColor(hexToRgb(BRAND_RED).r, hexToRgb(BRAND_RED).g, hexToRgb(BRAND_RED).b)
  doc.setLineWidth(0.5)
  doc.line(20, y, pageWidth - 20, y)
  y += 10

  return y
}

function addMetadataBlock(doc: jsPDF, metadata: AuditMetadata, startY: number): number {
  let y = startY
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const blockWidth = pageWidth - margin * 2

  // Background
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(margin, y, blockWidth, 28, 3, 3, 'F')
  y += 8

  const colWidth = blockWidth / 4
  const items = [
    { label: 'Local', value: metadata.locationName },
    { label: 'Auditor', value: metadata.auditorName },
    { label: 'Auditoría', value: metadata.auditQuarter },
    { label: 'Fecha', value: new Date(metadata.auditDate).toLocaleDateString('es-MX') },
  ]

  items.forEach((item, index) => {
    const x = margin + 8 + index * colWidth

    doc.setFontSize(8)
    doc.setTextColor(hexToRgb(LIGHT_GRAY).r, hexToRgb(LIGHT_GRAY).g, hexToRgb(LIGHT_GRAY).b)
    doc.setFont('helvetica', 'normal')
    doc.text(item.label.toUpperCase(), x, y)

    doc.setFontSize(10)
    doc.setTextColor(hexToRgb(DARK_GRAY).r, hexToRgb(DARK_GRAY).g, hexToRgb(DARK_GRAY).b)
    doc.setFont('helvetica', 'bold')
    const truncatedValue = item.value.length > 15 ? item.value.substring(0, 14) + '...' : item.value
    doc.text(truncatedValue, x, y + 6)
  })

  return startY + 36
}

function addScoreCard(doc: jsPDF, score: number, label: string, startY: number): number {
  let y = startY
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const blockWidth = pageWidth - margin * 2

  // Background
  const bgColor = getScoreBgColor(score)
  doc.setFillColor(bgColor.r, bgColor.g, bgColor.b)
  doc.roundedRect(margin, y, blockWidth, 40, 3, 3, 'F')

  // Score
  const scoreColor = hexToRgb(getScoreColor(score))
  doc.setFontSize(32)
  doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b)
  doc.setFont('helvetica', 'bold')
  doc.text(`${score}%`, pageWidth / 2, y + 22, { align: 'center' })

  // Label
  doc.setFontSize(12)
  doc.text(label, pageWidth / 2, y + 34, { align: 'center' })

  return y + 50
}

function addSectionTitle(doc: jsPDF, title: string, startY: number): number {
  const margin = 20

  doc.setFontSize(12)
  doc.setTextColor(hexToRgb(DARK_GRAY).r, hexToRgb(DARK_GRAY).g, hexToRgb(DARK_GRAY).b)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin, startY)

  // Underline
  doc.setDrawColor(229, 229, 229)
  doc.setLineWidth(0.3)
  doc.line(margin, startY + 2, doc.internal.pageSize.getWidth() - margin, startY + 2)

  return startY + 10
}

function addCategoryScores(
  doc: jsPDF,
  categoryScores: { categoryId: string; label: string; weight: number; percentage: number }[],
  startY: number
): number {
  let y = startY
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const barWidth = pageWidth - margin * 2 - 100

  for (const cat of categoryScores) {
    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      y = 20
    }

    // Category name with weight
    doc.setFontSize(9)
    doc.setTextColor(hexToRgb(DARK_GRAY).r, hexToRgb(DARK_GRAY).g, hexToRgb(DARK_GRAY).b)
    doc.setFont('helvetica', 'normal')
    doc.text(`${cat.label} (${cat.weight}%)`, margin, y)

    // Progress bar background
    doc.setFillColor(229, 229, 229)
    doc.roundedRect(margin, y + 3, barWidth, 5, 2, 2, 'F')

    // Progress bar fill
    const fillWidth = (cat.percentage / 100) * barWidth
    const scoreColor = hexToRgb(getScoreColor(cat.percentage))
    doc.setFillColor(scoreColor.r, scoreColor.g, scoreColor.b)
    doc.roundedRect(margin, y + 3, fillWidth, 5, 2, 2, 'F')

    // Score value
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b)
    doc.text(`${cat.percentage}%`, pageWidth - margin, y + 2, { align: 'right' })

    y += 14
  }

  return y
}

async function addFindingsSection(
  doc: jsPDF,
  findings: NegativeFinding[],
  startY: number,
  areaLabel?: string
): Promise<number> {
  let y = startY
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2

  if (findings.length === 0) return y

  // Section title
  const titleText = areaLabel
    ? `Hallazgos - ${areaLabel} (${findings.length})`
    : `Hallazgos Críticos y No Cumple (${findings.length})`

  y = addSectionTitle(doc, titleText, y)
  y += 4

  for (const finding of findings) {
    // Check if we need a new page
    const estimatedHeight = 30 + (finding.observation ? 10 : 0) + (finding.photoUrl ? 45 : 0)
    if (y + estimatedHeight > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      y = 20
    }

    // Finding card background
    const bgColor = finding.severity === 'critico' ? { r: 254, g: 226, b: 226 } : { r: 254, g: 243, b: 199 }
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b)

    let cardHeight = 24
    if (finding.observation) cardHeight += 10
    if (finding.photoUrl) cardHeight += 45

    doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'F')

    // Category label
    doc.setFontSize(8)
    doc.setTextColor(hexToRgb(MEDIUM_GRAY).r, hexToRgb(MEDIUM_GRAY).g, hexToRgb(MEDIUM_GRAY).b)
    doc.setFont('helvetica', 'normal')
    doc.text(finding.categoryLabel, margin + 4, y + 6)

    // Severity badge
    const severityText = finding.severity === 'critico' ? 'CRITICO' : 'NO CUMPLE'
    const severityColor = finding.severity === 'critico' ? '#dc2626' : '#f59e0b'
    const rgb = hexToRgb(severityColor)
    doc.setFillColor(rgb.r, rgb.g, rgb.b)
    const badgeWidth = doc.getTextWidth(severityText) + 6
    doc.roundedRect(pageWidth - margin - badgeWidth - 4, y + 2, badgeWidth, 7, 1, 1, 'F')
    doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(severityText, pageWidth - margin - badgeWidth - 1, y + 6.5)

    // Item label
    doc.setFontSize(10)
    doc.setTextColor(hexToRgb(DARK_GRAY).r, hexToRgb(DARK_GRAY).g, hexToRgb(DARK_GRAY).b)
    doc.setFont('helvetica', 'bold')
    doc.text(finding.itemLabel, margin + 4, y + 16)

    let currentY = y + 22

    // Observation
    if (finding.observation) {
      doc.setFontSize(9)
      doc.setTextColor(hexToRgb(MEDIUM_GRAY).r, hexToRgb(MEDIUM_GRAY).g, hexToRgb(MEDIUM_GRAY).b)
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(finding.observation, contentWidth - 8)
      doc.text(lines[0], margin + 4, currentY)
      currentY += 8
    }

    // Image
    if (finding.photoUrl) {
      try {
        const imgBase64 = await loadImageAsBase64(finding.photoUrl)
        if (imgBase64) {
          const imgWidth = 40
          const imgHeight = 35
          doc.addImage(imgBase64, 'JPEG', margin + 4, currentY, imgWidth, imgHeight)
        }
      } catch {
        // Image failed, skip
      }
    }

    y += cardHeight + 6
  }

  return y
}

function addFooter(doc: jsPDF): void {
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setDrawColor(229, 229, 229)
  doc.setLineWidth(0.3)
  doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15)

  doc.setFontSize(8)
  doc.setTextColor(hexToRgb(LIGHT_GRAY).r, hexToRgb(LIGHT_GRAY).g, hexToRgb(LIGHT_GRAY).b)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generado automáticamente - La Guitarrita | ${new Date().toLocaleString('es-MX')}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  )
}

export async function generateAreaPdf(
  areaId: string,
  metadata: AuditMetadata,
  responses: AuditResponses
): Promise<void> {
  const area = AUDIT_STRUCTURE.areas.find((a) => a.id === areaId)
  if (!area) return

  const areaScore = calculateAreaScore(areaId, responses)
  if (!areaScore) return

  const findings = getNegativeFindings(areaId, responses)
  const scoreLabel = getGlobalLabel(areaScore.percentage)

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let y = 15

  // Logo
  y = await addLogo(doc, y)

  // Header
  y = addHeader(doc, `Auditoría: ${area.label}`, 'La Guitarrita - Reporte Operativo', y)

  // Metadata
  y = addMetadataBlock(doc, metadata, y)

  // Score card
  y = addScoreCard(doc, areaScore.percentage, scoreLabel, y)

  // Category scores
  y = addSectionTitle(doc, 'Puntuación por Categoría', y)
  y = addCategoryScores(doc, areaScore.categoryScores, y)

  // Negative findings
  if (findings.length > 0) {
    y += 6
    y = await addFindingsSection(doc, findings, y)
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    addFooter(doc)
  }

  // Generate filename and download
  const locationSlug = sanitizeFilename(metadata.locationName)
  const filename = `Auditoria-${area.label}-${locationSlug}-${metadata.auditQuarter}.pdf`

  doc.save(filename)
}

export async function generateFinalPdf(
  metadata: AuditMetadata,
  responses: AuditResponses
): Promise<void> {
  const globalScores = calculateGlobalScores(responses)

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let y = 15

  // Logo
  y = await addLogo(doc, y)

  // Header
  y = addHeader(doc, 'Auditoría Total', 'La Guitarrita - Reporte Operativo', y)

  // Metadata
  y = addMetadataBlock(doc, metadata, y)

  // Score card
  y = addScoreCard(doc, globalScores.global, globalScores.globalLabel, y)

  // Area scores grid
  const margin = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const areaBoxWidth = (pageWidth - margin * 2 - 8) / 3

  doc.setFillColor(249, 250, 251)

  const areas = [
    { label: 'Salón', score: globalScores.salon },
    { label: 'Cocina', score: globalScores.cocina },
    { label: 'Calidad', score: globalScores.calidad },
  ]

  areas.forEach((area, index) => {
    const x = margin + index * (areaBoxWidth + 4)
    doc.roundedRect(x, y, areaBoxWidth, 20, 2, 2, 'F')

    doc.setFontSize(8)
    doc.setTextColor(hexToRgb(MEDIUM_GRAY).r, hexToRgb(MEDIUM_GRAY).g, hexToRgb(MEDIUM_GRAY).b)
    doc.setFont('helvetica', 'normal')
    doc.text(area.label, x + areaBoxWidth / 2, y + 6, { align: 'center' })

    const scoreColor = hexToRgb(getScoreColor(area.score))
    doc.setFontSize(14)
    doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b)
    doc.setFont('helvetica', 'bold')
    doc.text(`${area.score}%`, x + areaBoxWidth / 2, y + 15, { align: 'center' })
  })

  y += 28

  // Detailed breakdown per area
  for (const area of AUDIT_STRUCTURE.areas) {
    const areaScore = calculateAreaScore(area.id, responses)
    const findings = getNegativeFindings(area.id, responses)

    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage()
      y = 20
    }

    // Area header with score
    doc.setFontSize(12)
    doc.setTextColor(hexToRgb(DARK_GRAY).r, hexToRgb(DARK_GRAY).g, hexToRgb(DARK_GRAY).b)
    doc.setFont('helvetica', 'bold')
    doc.text(area.label, margin, y)

    if (areaScore) {
      const scoreColor = hexToRgb(getScoreColor(areaScore.percentage))
      doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b)
      doc.text(`${areaScore.percentage}%`, pageWidth - margin, y, { align: 'right' })
    }

    // Underline
    doc.setDrawColor(229, 229, 229)
    doc.setLineWidth(0.3)
    doc.line(margin, y + 2, pageWidth - margin, y + 2)
    y += 8

    // Category scores
    if (areaScore) {
      y = addCategoryScores(doc, areaScore.categoryScores, y)
    }

    // Findings for this area
    if (findings.length > 0) {
      y += 4
      y = await addFindingsSection(doc, findings, y, area.label)
    }

    y += 6
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    addFooter(doc)
  }

  // Generate filename and download
  const locationSlug = sanitizeFilename(metadata.locationName)
  const filename = `Auditoria-Total-${locationSlug}-${metadata.auditQuarter}.pdf`

  doc.save(filename)
}
