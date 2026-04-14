import type { Metadata } from 'next'
import { LabDetailPage } from '../_components/lab-detail-page'
import { getInzinnaDemoConfig } from '../_lib/inzinna-demo-data'

export const metadata: Metadata = {
  title: 'Inzinna SP Notes | thePsychology.ai',
  description:
    'Interactive lab demo for a local-first clinical documentation copilot covering intake capture, diagnostics, SOAP drafting, and treatment-plan support.',
}

export default function InzinnaSpNotesPage() {
  return <LabDetailPage config={getInzinnaDemoConfig('inzinna-sp-notes')} />
}
