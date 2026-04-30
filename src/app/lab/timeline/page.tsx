import type { Metadata } from 'next'
import { getSupabaseClient } from '@/lib/supabase-server'
import { TimelineShell } from './timeline-view'
import type { TimelineProject, TimelineCollaborator } from './use-timeline'
import '../inzinna/timeline/inzinna.css'

export const metadata: Metadata = {
  title: 'Personal Timeline | Lab',
  description: 'Side projects, month by month. Anders Chan personal roadmap across the year.',
}

const TIMELINE_KEY = 'anders-personal'

// Only people on Anders' personal projects show in the picker.
const PERSONAL_INITIALS = ['AC', 'SB', 'TC', 'LC', 'YD'] as const

const FALLBACK_COLLABORATORS: TimelineCollaborator[] = [
  { initials: 'AC', name: 'Anders',  hue: 12 },
  { initials: 'SB', name: 'Shaunak', hue: 240 },
  { initials: 'TC', name: 'Tamilyn', hue: 320 },
  { initials: 'LC', name: 'Lenny',   hue: 90 },
  { initials: 'YD', name: 'Yael',    hue: 60 },
]

const MONTHS = [
  { key: 'apr', label: 'April',     short: 'APR', days: 30 },
  { key: 'may', label: 'May',       short: 'MAY', days: 31 },
  { key: 'jun', label: 'June',      short: 'JUN', days: 30 },
  { key: 'jul', label: 'July',      short: 'JUL', days: 31 },
  { key: 'aug', label: 'August',    short: 'AUG', days: 31 },
  { key: 'sep', label: 'September', short: 'SEP', days: 30 },
  { key: 'oct', label: 'October',   short: 'OCT', days: 31 },
  { key: 'nov', label: 'November',  short: 'NOV', days: 30 },
  { key: 'dec', label: 'December',  short: 'DEC', days: 31 },
]

export default async function PersonalTimelinePage() {
  let projects: TimelineProject[] = []
  let collaborators: TimelineCollaborator[] = FALLBACK_COLLABORATORS

  try {
    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })

    if (supabase) {
      const [projRes, collabRes] = await Promise.all([
        supabase
          .from('timeline_projects')
          .select('*')
          .eq('timeline_key', TIMELINE_KEY)
          .order('sort_order', { ascending: true }),
        supabase
          .from('timeline_collaborators')
          .select('*')
          .in('initials', PERSONAL_INITIALS as unknown as string[])
          .order('initials'),
      ])

      if (projRes.data?.length) projects = projRes.data as TimelineProject[]
      if (collabRes.data?.length) collaborators = collabRes.data as TimelineCollaborator[]
    }
  } catch {
    // Supabase unavailable. Empty state will render.
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="dark inz-page">
      <TimelineShell
        initialProjects={projects}
        initialCollaborators={collaborators}
        months={months}
        todayIso={today}
      />
    </div>
  )
}

const months = MONTHS
