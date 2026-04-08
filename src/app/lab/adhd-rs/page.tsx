import type { Metadata } from 'next'
import { AssessmentToolPlaceholder } from '../_components/assessment-tool-placeholder'

export const metadata: Metadata = {
  title: 'ADHD-RS 2D | thePsychology.ai',
  description: 'Placeholder route for the lab ADHD Rating Scale workflow.',
}

export default function AdhdRsPage() {
  return (
    <AssessmentToolPlaceholder
      title="ADHD-RS 2D"
      description="A planned ADHD Rating Scale workflow for the lab site. The goal is fast administration, deterministic scoring, and a clinician-ready summary without manual table lookups."
      versionLabel="2D"
      audienceLabel="Parent, teacher, clinician, or other structured ADHD rating workflows inside the lab site."
      buildItems={[
        'Render the assessment from a reusable schema instead of hardcoding one-off UI.',
        'Auto-score inattentive, hyperactive-impulsive, and total values with a clean result summary.',
        'Support side-by-side informant comparisons and make repeat administrations trackable over time.',
      ]}
      differentiators={[
        'The manual workflow today is still paper-heavy and fragmented across scoring, writeup, and charting.',
        'This lab version is intended to turn the scale into an in-product assessment pipeline, not just a static form.',
      ]}
      note="Status: placeholder route only. Assessment content, scoring details, and licensing constraints still need to be finalized."
    />
  )
}
