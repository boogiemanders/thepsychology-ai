/**
 * Shared date formatting utilities used by popup + content script.
 */

/** Turn "04/06/2026" -> "4/6" for compact display. Empty string -> "". */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('/')
  if (parts.length < 2) return ''
  return `${parseInt(parts[0])}/${parseInt(parts[1])}`
}
