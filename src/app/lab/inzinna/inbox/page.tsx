import type { Metadata } from 'next'
import { getSupabaseClient } from '@/lib/supabase-server'
import { InboxClient, type InziMessage } from './inbox-client'

export const metadata: Metadata = {
  title: 'Inzi Inbox · Inzinna',
  description: 'Patient messages routed from the Inzi chatbot.',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  let messages: InziMessage[] = []
  if (supabase) {
    const { data } = await supabase
      .from('inzi_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    messages = (data || []) as InziMessage[]
  }
  return <InboxClient initialMessages={messages} />
}
