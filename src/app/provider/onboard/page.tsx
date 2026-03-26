import type { Metadata } from 'next'
import { ProviderOnboardClient } from './onboard-client'

export const metadata: Metadata = {
  title: 'Provider Onboarding | thepsychology.ai',
  description: 'Set up your provider profile to get matched with clients',
}

export default function ProviderOnboardPage() {
  return <ProviderOnboardClient />
}
