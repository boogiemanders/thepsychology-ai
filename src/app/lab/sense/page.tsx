import type { Metadata } from 'next'
import SenseSurvey from './sense-survey'

export const metadata: Metadata = {
  title: 'SENSE Questionnaire | thePsychology.ai',
  description: 'The SENSE Questionnaire: a mind-body assessment tool measuring somatic awareness, emotional integration, neurocognitive load, sensory processing, environmental regulation, and coherence.',
}

export default function SensePage() {
  return <SenseSurvey />
}
