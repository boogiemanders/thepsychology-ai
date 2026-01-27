import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getChats() {
  // First get all users except chanders0
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .neq('email', 'chanders0@yahoo.com')

  if (!users || users.length === 0) {
    console.log('No users found')
    return
  }

  const userMap = new Map(users.map(u => [u.id, u.email]))
  const userIds = users.map(u => u.id)

  // Get sessions for these users
  const { data: sessions, error } = await supabase
    .from('recover_chat_sessions')
    .select('*')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.log('Error fetching sessions:', error.message)
    return
  }

  console.log('Total sessions (excluding chanders0):', sessions?.length || 0)

  if (!sessions || sessions.length === 0) {
    console.log('No chat sessions found')
    return
  }

  for (const session of sessions) {
    const userEmail = userMap.get(session.user_id) || 'unknown'
    console.log('\n' + '='.repeat(70))
    console.log('User:', userEmail)
    console.log('Messages:', session.message_count, '| Harm alert:', session.has_harm_alert, '| Stress alert:', session.has_stress_alert)
    console.log('Created:', new Date(session.created_at).toLocaleString())

    // Get messages for this session
    const { data: messages } = await supabase
      .from('recover_chat_messages')
      .select('role, content, alert_reason')
      .eq('session_id', session.id)
      .order('message_index', { ascending: true })

    if (messages && messages.length > 0) {
      console.log('\n--- Conversation ---')
      for (const msg of messages) {
        const role = msg.role === 'user' ? 'USER' : 'BOT'
        const alert = msg.alert_reason ? ' [ALERT: ' + msg.alert_reason + ']' : ''
        // Truncate long messages
        const content = msg.content.length > 600 ? msg.content.slice(0, 600) + '...' : msg.content
        console.log('\n[' + role + ']' + alert)
        console.log(content)
      }
    }
  }
}

getChats()
