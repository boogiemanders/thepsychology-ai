import type { Metadata } from 'next'
import { getSupabaseClient } from '@/lib/supabase-server'
import { TimelineShell } from './timeline-view'
import type { TimelineProject, TimelineCollaborator } from './use-timeline'
import './inzinna.css'

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

// Lower-cased for the client prop — avoids serialisation issues with `as const`
const months = MONTHS

// Static fallback projects used when DB table doesn't exist yet.
const FALLBACK_PROJECTS: TimelineProject[] = [
  {
    id: 'fallback-01', timeline_key: 'inzinna-leadership', num: '01',
    name: 'Zocdoc → SimplePractice', lead: 'AC',
    one_liner: 'Pulls patient info from Zocdoc into SimplePractice. Drafts the insurance verification email. Saves ~15 min per intake.',
    priority: 'high', status: 'blocked',
    stage_line: 'Working plugin on one machine. Blocked on Workspace admin.',
    contributors: ['AC', 'GI'],
    phases: [{ kind: 'build', start: 0.000, end: 0.230, label: 'Google admin + Chrome store' }, { kind: 'rollout', start: 0.230, end: 0.250, label: 'Push-install + pilot' }],
    milestone: { at: 0.250, label: 'Live (end of April)' },
    steps: [{ text: 'Get Google Workspace admin access', done: false }, { text: 'Submit plugin to Chrome Web Store (private)', done: false }, { text: 'Push-install to clinicians', done: false }, { text: 'Pilot with P02', done: false }],
    support: 'Workspace admin / HIPAA BAA with Google / Zocdoc admin for testing',
    href: '/lab/zocdoc-simplepractice', sort_order: 10,
    created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z', updated_by: null,
  },
  {
    id: 'fallback-02', timeline_key: 'inzinna-leadership', num: '02',
    name: 'Leadership Roadmap Timeline', lead: 'AC',
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
    name: 'Supervision Prep Tool', lead: 'AC',
    one_liner: 'Pulls notes + treatment plans. Clinicians review and adjust diagnoses before supervision.',
    priority: 'medium', status: 'building',
    stage_line: 'Working but rough. Needs cleanup + bug fixes + a clinician feedback pass.',
    contributors: ['AC'],
    phases: [{ kind: 'build', start: 0.100, end: 0.40, label: 'Clean UI + fix bugs' }, { kind: 'test', start: 0.40, end: 0.58, label: 'Clinician testing' }, { kind: 'rollout', start: 0.58, end: 0.66, label: 'Roll out to externs' }],
    milestone: { at: 0.66, label: 'Before externs arrive' },
    steps: [{ text: 'Clean UI', done: false }, { text: 'Gather clinician feedback', done: false }, { text: 'Fix bugs', done: false }, { text: 'Roll out to externs (June/July)', done: false }],
    support: '1-2 clinicians for testing in May',
    href: null, sort_order: 30,
    created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z', updated_by: null,
  },
  {
    id: 'fallback-04', timeline_key: 'inzinna-leadership', num: '04',
    name: 'JustWorks Payroll Autofill', lead: 'AC',
    one_liner: 'Reads SimplePractice payroll. Fills JustWorks time cards using pay rules + CPT-based rates.',
    priority: 'high', status: 'building',
    stage_line: 'Mostly working. Comparing against Carlos payroll session Apr 17.',
    contributors: ['AC', 'CA'],
    phases: [{ kind: 'build', start: 0.100, end: 0.250, label: 'Build + upload template' }, { kind: 'build', start: 0.250, end: 0.500, label: 'Salary calculator' }],
    milestone: { at: 0.160, label: 'Carlos session — Apr 17' },
    steps: [{ text: 'Build upload template', done: false }, { text: 'Test full pay cycle', done: false }, { text: 'Meet with Carlos (Apr 17)', done: false }, { text: 'Confirm SimplePractice / JustWorks reports', done: false }, { text: 'Add salary calculator (May)', done: false }],
    support: 'Carlos availability / confirmation on required reports',
    href: '/lab/inzinna/payroll', sort_order: 40,
    created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z', updated_by: null,
  },
  {
    id: 'fallback-05', timeline_key: 'inzinna-leadership', num: '05',
    name: 'Assessment', lead: 'AC',
    one_liner: 'Automated scoring for clinical assessments. BAARS, ADHD-RS, executive functioning (Trail-making, Tower of Hanoi), Rorschach.',
    priority: 'high', status: 'live',
    stage_line: 'Live and in testing with Bret. Bret is travelling.',
    contributors: ['AC', 'BR'],
    phases: [{ kind: 'test', start: 0.100, end: 0.250, label: 'BAARS + ADHD-RS', description: 'Apply feedback + finalize BAARS/ADHD-RS' }, { kind: 'build', start: 0.250, end: 0.500, label: 'EF: Trail-making + Tower of Hanoi' }, { kind: 'build', start: 0.500, end: 0.750, label: 'Rorschach admin + scoring' }, { kind: 'build', start: 0.750, end: 1.000, label: 'Rorschach interpretation' }],
    milestone: null,
    steps: [{ text: 'Apply Bret feedback on BAARS/ADHD-RS', done: false }, { text: 'Finalize scoring logic', done: false }, { text: 'Build Trail-making test', done: false }, { text: 'Build Tower of Hanoi', done: false }, { text: 'Rorschach administration flow', done: false }, { text: 'Rorschach scoring', done: false }, { text: 'Rorschach interpretation', done: false }],
    support: 'Bret feedback',
    href: '/lab/baars', sort_order: 50,
    created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z', updated_by: null,
  },
  {
    id: 'fallback-06', timeline_key: 'inzinna-leadership', num: '06',
    name: 'Website Chatbot + Call Management', lead: 'AC',
    one_liner: 'Chatbot handles admin questions, then call routing reduces interruptions. Chatbot first, call system after. Can prototype early if bandwidth opens up.',
    priority: 'medium', status: 'idea',
    stage_line: null,
    contributors: ['AC', 'FI', 'GI'],
    phases: [{ kind: 'wait', start: 0.100, end: 0.500, label: 'Wait for launch (prototype optional)' }, { kind: 'build', start: 0.500, end: 0.700, label: 'Build chatbot' }, { kind: 'build', start: 0.700, end: 0.900, label: 'Build call routing' }, { kind: 'rollout', start: 0.900, end: 1.000, label: 'Go live' }],
    milestone: { at: 0.700, label: 'Chatbot live' },
    steps: [{ text: 'Wait for website launch (June)', done: false }, { text: 'Build RAG system + guardrails (NOT THERAPY)', done: false }, { text: 'Test chatbot with real inquiries', done: false }, { text: 'Choose call routing platform', done: false }, { text: 'Set up routing + text fallback', done: false }, { text: 'Go live with call system', done: false }],
    support: 'Website access / clinician review / team decision on call platform / budget approval',
    href: null, sort_order: 60,
    created_at: '2026-04-15T00:00:00Z', updated_at: '2026-04-15T00:00:00Z', updated_by: null,
  },
]
