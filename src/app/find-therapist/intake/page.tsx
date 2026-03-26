import type { Metadata } from 'next'
import { IntakeClient } from './intake-client'

export const metadata: Metadata = {
  title: 'Find Your Therapist | thepsychology.ai',
  description: 'Tell us about yourself so we can find your ideal therapist match',
}

export default function IntakePage() {
  return <IntakeClient />
}
