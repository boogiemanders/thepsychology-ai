import type { Metadata } from 'next'
import { PlanMatchLanding } from './plan-match-landing'

export const metadata: Metadata = {
  title: 'Plan Match | thePsychology.ai',
  description:
    'See the matching engine. Two short forms, one ranking. Pick your insurance and state to see the psychologists who fit.',
}

export default function PlanMatchPage() {
  return <PlanMatchLanding />
}
