import type { Metadata } from 'next'
import { getSupabaseClient } from '@/lib/supabase-server'
import { TimelineShell } from './timeline-view'
import type { TimelineProject, TimelineCollaborator } from './use-timeline'

export const metadata: Metadata = {
  title: 'Leadership Timeline | Inzinna Lab',
  description: 'Monthly timeline of leadership projects and milestones for the Inzinna practice. Scan what ships in April, May, June, and July 2026.',
}

// Fallback data when Supabase isn't available (dev / preview)
const FALLBACK_COLLABORATORS: TimelineCollaborator[] = [
  { initials: 'AC', name: 'Anders',   hue: 12 },
  { initials: 'GI', name: 'Greg',     hue: 210 },
  { initials: 'CA', name: 'Carlos',   hue: 330 },
  { initials: 'BR', name: 'Bret',     hue: 260 },
  { initials: 'LO', name: 'Lorin',    hue: 170 },
  { initials: 'FI', name: 'Filomena', hue: 45 },
]

const MONTHS = [
  { key: 'apr', label: 'April', short: 'APR', days: 30 },
  { key: 'may', label: 'May',   short: 'MAY', days: 31 },
  { key: 'jun', label: 'June',  short: 'JUN', days: 30 },
  { key: 'jul', label: 'July',  short: 'JUL', days: 31 },
]

export default async function LeadershipTimelinePage() {
  let projects: TimelineProject[] = []
  let collaborators: TimelineCollaborator[] = FALLBACK_COLLABORATORS

  try {
    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })

    if (supabase) {
      const [projRes, collabRes] = await Promise.all([
        supabase
          .from('timeline_projects')
          .select('*')
          .eq('timeline_key', 'inzinna-leadership')
          .order('sort_order', { ascending: true }),
        supabase
          .from('timeline_collaborators')
          .select('*')
          .order('initials'),
      ])

      if (projRes.data?.length) projects = projRes.data as TimelineProject[]
      if (collabRes.data?.length) collaborators = collabRes.data as TimelineCollaborator[]
    }
  } catch {
    // Supabase unavailable or table doesn't exist yet — use fallbacks
  }

  // If no projects from DB, seed with local fallback data
  if (!projects.length) projects = FALLBACK_PROJECTS

  const today = new Date().toISOString().slice(0, 10)

  return (
    <TimelineShell
      initialProjects={projects}
      initialCollaborators={collaborators}
      months={months}
      todayIso={today}
    />
  )
}

// Lower-cased for the client prop — avoids serialisation issues with `as const`
const months = MONTHS

// Static fallback projects used when DB table doesn't exist yet.
const FALLBACK_PROJECTS: TimelineProject[] = [
  {
    id: 'fallback-01', timeline_key: 'inzinna-leadership', num: '01',
    name: 'Zocdoc → SimplePractice',
    one_liner: 'Pulls patient info from Zocdoc into SimplePractice. Drafts the insurance verification email. Saves ~15 min per intake.',
    priority: 'high', status: 'blocked',
    stage_line: 'Working plugin on one machine. Blocked on Workspace admin.',
    contributors: ['AC', 'GI'],
    phases: [{ kind: 'build', start: 0.000, end: 0.230, label: 'Ship blocker' }, { kind: 'rollout', start: 0.230, end: 0.250, label: 'Push-install + pilot' }],
    milestone: { at: 0.250, label: 'Live (end of April)' },
    steps: [{ text: 'Get Google Workspace admin access', done: false }, { text: 'Submit plugin to Chrome Web Store (private)', done: false }, { text: 'Push-install to clinicians', done: false }, { text: 'Pilot with P02', done: false }],
    support: 'Workspace admin / HIPAA BAA with Google / Zocdoc admin for testing',
    href: '/lab/zocdoc-simplepractice', sort_order: 10,
    created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z', updated_by: null,
  },
  {
    id: 'fallback-02', timeline_key: 'inzinna-leadership', num: '02',
    name: 'Leadership Roadmap Timeline',
    one_liner: 'Shared monthly view of every leadership project (this page).',
    priority: 'high', status: 'building',
    stage_line: 'Folder + doc created. Doc is being filled. Visual ships next.',
    contributors: ['AC'],
    phases: [{ kind: 'build', start: 0.100, end: 0.183, label: 'Doc fills in' }, { kind: 'rollout', start: 0.183, end: 0.200, label: 'Visual build' }],
    milestone: { at: 0.200, label: 'Visual live' },
    steps: [{ text: 'Collect inputs from all leaders', done: false }, { text: 'Build visual calendar (this page)', done: false }],
    support: 'All leaders to drop projects + timelines into the doc',
    href: null, sort_order: 20,
    created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z', updated_by: null,
  },
  {
    id: 'fallback-03', timeline_key: 'inzinna-leadership', num: '03',
    name: 'Supervision Prep Tool',
    one_liner: 'Pulls notes + treatment plans. Clinicians review and adjust diagnoses before supervision.',
    priority: 'medium', status: 'building',
    stage_line: 'Working but rough. Needs cleanup + bug fixes + a clinician feedback pass.',
    contributors: ['AC', 'BR'],
    phases: [{ kind: 'build', start: 0.100, end: 0.40, label: 'Clean UI + fix bugs' }, { kind: 'test', start: 0.40, end: 0.58, label: 'Clinician testing' }, { kind: 'rollout', start: 0.58, end: 0.66, label: 'Roll out to externs' }],
    milestone: { at: 0.66, label: 'Before externs arrive' },
    steps: [{ text: 'Clean UI', done: false }, { text: 'Gather clinician feedback', done: false }, { text: 'Fix bugs', done: false }, { text: 'Roll out to externs (June/July)', done: false }],
    support: '1-2 clinicians for testing in May',
    href: null, sort_order: 30,
    created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z', updated_by: null,
  },
  {
    id: 'fallback-04', timeline_key: 'inzinna-leadership', num: '04',
    name: 'JustWorks Payroll Autofill',
    one_liner: 'Reads SimplePractice payroll. Fills JustWorks time cards using pay rules + CPT-based rates.',
    priority: 'high', status: 'building',
    stage_line: 'Mostly working. Comparing against Carlos payroll session Apr 17.',
    contributors: ['AC', 'CA'],
    phases: [{ kind: 'build', start: 0.100, end: 0.250, label: 'Build + upload template' }, { kind: 'rollout', start: 0.250, end: 0.500, label: 'Salary calculator' }],
    milestone: { at: 0.160, label: 'Carlos session — Apr 17' },
    steps: [{ text: 'Build upload template', done: false }, { text: 'Test full pay cycle', done: false }, { text: 'Meet with Carlos (Apr 17)', done: false }, { text: 'Confirm SimplePractice / JustWorks reports', done: false }, { text: 'Add salary calculator (May)', done: false }],
    support: 'Carlos availability / confirmation on required reports',
    href: '/lab/inzinna/payroll', sort_order: 40,
    created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z', updated_by: null,
  },
  {
    id: 'fallback-05', timeline_key: 'inzinna-leadership', num: '05',
    name: 'ADHD Assessment Scorers',
    one_liner: 'Automates scoring for BAARS + ADHD-RS and generates clinical summaries.',
    priority: 'high', status: 'live',
    stage_line: 'Live and in testing with Bret. Bret is travelling.',
    contributors: ['AC', 'BR'],
    phases: [{ kind: 'test', start: 0.100, end: 0.220, label: 'Apply feedback' }, { kind: 'live', start: 0.220, end: 0.250, label: 'Finalize scoring' }],
    milestone: { at: 0.250, label: 'Final (end of April)' },
    steps: [{ text: 'Apply Bret feedback', done: false }, { text: 'Finalize scoring logic', done: false }, { text: 'Share with clinical team', done: false }],
    support: 'Bret feedback',
    href: '/lab/baars', sort_order: 50,
    created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z', updated_by: null,
  },
  {
    id: 'fallback-06', timeline_key: 'inzinna-leadership', num: '06',
    name: 'Inzinna Website Chatbot',
    one_liner: 'Handles common admin questions. Reduces staff interruption.',
    priority: 'medium', status: 'idea',
    stage_line: 'Idea stage. Gated on site launch + higher-priority tools.',
    contributors: ['AC', 'FI', 'GI'],
    phases: [{ kind: 'wait', start: 0.100, end: 0.500, label: 'Wait for launch' }, { kind: 'build', start: 0.500, end: 0.670, label: 'Build RAG + guardrails' }, { kind: 'test', start: 0.670, end: 0.730, label: 'Test real inquiries' }, { kind: 'rollout', start: 0.730, end: 0.750, label: 'Go live' }],
    milestone: { at: 0.750, label: 'Live (end of June)' },
    steps: [{ text: 'Wait for website launch (June 1)', done: false }, { text: 'Build RAG system', done: false }, { text: 'Add guardrails (NOT THERAPY)', done: false }, { text: 'Test with real inquiries', done: false }],
    support: 'Website access / clinician manual review',
    href: null, sort_order: 60,
    created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z', updated_by: null,
  },
  {
    id: 'fallback-07', timeline_key: 'inzinna-leadership', num: '07',
    name: 'Call Management System',
    one_liner: 'HIPAA-compliant routing + text fallback. Fewer interruptions.',
    priority: 'low', status: 'idea',
    stage_line: 'Needs a platform decision. Reviewing options.',
    contributors: ['AC'],
    phases: [{ kind: 'wait', start: 0.500, end: 0.700, label: 'Review platforms' }, { kind: 'build', start: 0.700, end: 0.900, label: 'Set up routing + VA' }, { kind: 'rollout', start: 0.900, end: 1.000, label: 'Go live' }],
    milestone: { at: 0.750, label: 'Platform picked' },
    steps: [{ text: 'Review options', done: false }, { text: 'Choose platform', done: false }, { text: 'Set up routing', done: false }, { text: 'Consider VA / text service', done: false }],
    support: 'Team decision / budget approval',
    href: null, sort_order: 70,
    created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z', updated_by: null,
  },
]
