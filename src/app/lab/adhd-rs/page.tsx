import type { Metadata } from 'next'
import { AssessmentToolPlaceholder } from '../_components/assessment-tool-placeholder'

export const metadata: Metadata = {
  title: 'ADHD-RS | thePsychology.ai',
  description: 'Digital ADHD Rating Scale scorer with automated subscale scoring, norm lookup, and report-ready clinical summaries.',
}

export default function AdhdRsPage() {
  return (
    <AssessmentToolPlaceholder
      title="ADHD Rating Scale"
      description="18 items. 5 minutes. No more hand-summing raw scores or cross-referencing printed norm tables by age, gender, and informant type. Enter responses and get inattention, hyperactivity-impulsivity, and total scores with DSM-style symptom counts — instantly."
      versionLabel="ADHD-RS-5"
      audienceLabel="Parent, teacher, or clinician completing a structured ADHD rating."
      buildItems={[
        'Auto-score inattention and hyperactivity-impulsivity subscales with zero manual calculation.',
        'Count symptoms at or above clinical threshold for DSM-aligned reporting.',
        'Compare parent vs. teacher ratings side by side with agreement flags.',
        'Track scores across sessions to monitor treatment response over time.',
      ]}
      differentiators={[
        'No digital ADHD-RS scoring platform exists. Every competitor — Vanderbilt, Conners 4, ASRS — has gone digital. The ADHD-RS is still paper and pencil.',
        'This tool turns the gold-standard pharma trial measure into something you can actually use in a modern clinical workflow.',
      ]}
      note="Assessment content and scoring logic in development. The ADHD-RS is published by Guilford Press."
    />
  )
}
