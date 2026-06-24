/**
 * Get today's date in YYYY-MM-DD format using local timezone.
 * This avoids UTC conversion issues where the date can shift to yesterday
 * in timezones like Argentina (UTC-3).
 */
export function getLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a date string for display in Spanish locale
 */
export function formatDateForDisplay(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
