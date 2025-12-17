import { useEffect, useState } from 'react'
import { getUnresolvedSections } from '@/lib/unified-question-results'

/**
 * Hook to integrate green apple indicators into lesson content
 * Processes markdown to add green apple emojis before section headers
 * where user has gotten questions wrong
 */
export function useGreenApples(topic: string | null, content: string | null) {
  const [processedContent, setProcessedContent] = useState<string | null>(null)
  const [unresolvedSections, setUnresolvedSections] = useState<
    { sectionName: string; count: number }[]
  >([])

  useEffect(() => {
    if (!topic || !content) {
      setProcessedContent(content)
      setUnresolvedSections([])
      return
    }

    // Get all unresolved sections for this topic
    const sections = getUnresolvedSections(topic)
    setUnresolvedSections(
      sections.map((s) => ({ sectionName: s.sectionName, count: s.wrongCount }))
    )

    if (sections.length === 0) {
      setProcessedContent(content)
      return
    }

    // Process content to add green apple emojis before section headers
    let processed = content

    sections.forEach((section) => {
      // Match section headers (## or ### followed by the section name)
      // This assumes section names in the content match the stored section names
      const headerRegex = new RegExp(
        `(^|\\n)(#{2,4}) (${escapeRegex(section.sectionName)})(?=\\n|$)`,
        'gm'
      )

      processed = processed.replace(
        headerRegex,
        `$1$2 🍏 $3`
      )
    })

    setProcessedContent(processed)
  }, [topic, content])

  return {
    processedContent,
    unresolvedSections,
    hasUnresolvedSections: unresolvedSections.length > 0,
  }
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
