import type { Metadata } from 'next'
import { ResultsClient } from './results-client'

export const metadata: Metadata = {
  title: 'Your Matches | thepsychology.ai',
  description: 'Psychologists ranked by clinical fit with your intake.',
}

export default function ResultsPage() {
  return <ResultsClient />
}
