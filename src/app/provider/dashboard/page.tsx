import type { Metadata } from 'next'
import { ProviderDashboardClient } from './dashboard-client'

export const metadata: Metadata = {
  title: 'Provider Dashboard | thepsychology.ai',
  description: 'Manage your provider profile and clients',
}

export default function ProviderDashboardPage() {
  return <ProviderDashboardClient />
}
