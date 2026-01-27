import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const userId = 'b4aa08a1-6d14-4928-bd23-799f246cdb4f'

async function check() {
  const { data: ratings } = await supabase
    .from('feature_ratings')
    .select('feature, topic, domain, rating_value, duration_seconds, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  console.log('=== ALL TOPIC TEACHER SESSIONS ===')
  console.log('Total:', ratings?.length || 0, 'sessions')
  
  if (ratings?.length) {
    let totalTime = 0
    const byDate: Record<string, any[]> = {}
    ratings.forEach(r => {
      const date = new Date(r.created_at).toLocaleDateString()
      if (!(date in byDate)) byDate[date] = []
      byDate[date].push(r)
      totalTime += r.duration_seconds || 0
    })
    
    console.log('Total study time:', Math.round(totalTime / 60), 'minutes')
    console.log('')
    
    for (const [date, sessions] of Object.entries(byDate)) {
      const dayTime = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0)
      console.log(date + ':', sessions.length, 'lessons (' + Math.round(dayTime / 60) + ' min)')
      sessions.forEach(s => {
        console.log('  -', s.topic, '(' + s.domain + ') -', Math.round((s.duration_seconds || 0) / 60) + 'min')
      })
    }
  }

  const { data: user } = await supabase
    .from('users')
    .select('last_activity_at, current_page')
    .eq('id', userId)
    .single()
  
  console.log('')
  console.log('=== CURRENT STATUS ===')
  console.log('Last activity:', user?.last_activity_at)
  console.log('Current page:', user?.current_page)
  
  const { data: pageViews } = await supabase
    .from('user_page_views')
    .select('page_path, duration_seconds, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(15)
  
  console.log('')
  console.log('=== RECENT PAGE VIEWS ===')
  if (pageViews?.length) {
    pageViews.forEach(p => {
      const mins = Math.round((p.duration_seconds || 0) / 60)
      console.log(' ', p.page_path, '-', mins + 'min')
    })
  } else {
    console.log('  None tracked')
  }
}
check()
