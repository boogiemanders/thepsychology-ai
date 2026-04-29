import type { Metadata } from 'next'
import { InziApp } from './inzi-app'

export const metadata: Metadata = {
  title: 'Inzi · Inzinna chatbot prototype',
  description: 'Patient-facing chat assistant: welcome, self-assessment, results, clinician matching, gentle crisis handoff, human handoff, and saved conversations.',
}

export default function Page() {
  return <InziApp />
}
