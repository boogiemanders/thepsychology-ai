import { redirect } from 'next/navigation'

export default function TrialExpiredRedirectPage() {
  redirect('/dashboard')
}
