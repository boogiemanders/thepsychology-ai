import type { Metadata } from 'next'
import { LabDetailPage } from '../_components/lab-detail-page'
import { getInzinnaDemoConfig } from '../_lib/inzinna-demo-data'

export const metadata: Metadata = {
  title: 'ZocDoc to SimplePractice | thePsychology.ai',
  description:
    'Interactive lab demo for a browser-side ZocDoc to SimplePractice intake handoff covering capture, insurance fill, appointment setup, VOB draft, and PHI cleanup.',
}

export default function ZocdocSimplePracticePage() {
  return <LabDetailPage config={getInzinnaDemoConfig('zocdoc-simplepractice')} />
}
