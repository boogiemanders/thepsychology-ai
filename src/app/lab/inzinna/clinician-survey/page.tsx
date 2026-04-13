import type { Metadata } from 'next'
import Link from 'next/link'
import { ClinicianSurveyDeck, type DeckSlide } from './clinician-survey-deck'

export const metadata: Metadata = {
  title: 'Inzinna Clinician Survey | thePsychology.ai',
  description:
    'Native slide deck presenting findings from the Inzinna clinician needs-assessment survey: priorities, AI use-case demand, barriers, and privacy dealbreakers.',
}

const slides: DeckSlide[] = [
  {
    kind: 'title',
    eyebrow: 'Inzinna · Needs Assessment',
    title: 'Clinician Survey',
    subtitle:
      'What seven clinicians at Dr. Inzinna Psychological Services said they actually need from AI tools.',
    meta: 'n = 7 · April 2026',
  },
  {
    kind: 'stats',
    eyebrow: 'Respondents',
    title: 'Who answered',
    stats: [
      { value: '7', label: 'Clinicians' },
      { value: '4', label: 'LSW / LMHC' },
      { value: '2', label: 'Psychologists' },
      { value: '1', label: 'Postdoctoral fellow' },
    ],
    footer: 'Orientations: 3 integrative · 2 CBT · 1 psychodynamic · 1 humanistic',
  },
  {
    kind: 'bars',
    eyebrow: 'Universal Demand',
    title: 'Three things (almost) everyone wants',
    intro: 'AI use cases selected by respondents (check all that apply).',
    bars: [
      { label: 'After-session note draft', value: 7, max: 7, tone: 'strong' },
      { label: 'Supervision prep (agenda + Qs)', value: 6, max: 7, tone: 'strong' },
      { label: 'Treatment planning suggestions', value: 6, max: 7, tone: 'strong' },
      { label: 'AI listens to session (audio)', value: 4, max: 7 },
      { label: 'Live transcription during session', value: 2, max: 7, tone: 'muted' },
      { label: 'Roleplay practice', value: 2, max: 7, tone: 'muted' },
    ],
  },
  {
    kind: 'list',
    eyebrow: 'Top Priorities',
    title: '#1 priority by respondent',
    intro: 'Each clinician named a different top priority. The overlap is in the middle.',
    items: [
      { tag: 'P01', text: 'Trainings & education' },
      { tag: 'P02', text: 'Automation of verification of benefits (VOB)' },
      { tag: 'P03', text: 'Reduced administrative load' },
      { tag: 'P04', text: 'Specialized training (IFS, EMDR, assessments)' },
      { tag: 'P05', text: 'Staff to handle assessments' },
      { tag: 'P07', text: 'Schedule consistency' },
      { tag: 'P08', text: 'Learn to do assessments' },
    ],
  },
  {
    kind: 'bars',
    eyebrow: 'Likert Ratings',
    title: 'Where clinicians landed (avg · 1–5)',
    intro: 'Highest-rated framings become the product\u2019s positioning anchors.',
    bars: [
      { label: 'Helps identify blind spots', value: 4.14, max: 5, tone: 'strong' },
      { label: 'Complement, not replace, supervision', value: 4.0, max: 5, tone: 'strong' },
      { label: 'Fit into current workflow', value: 3.86, max: 5 },
      { label: 'Comfortable with AI feedback', value: 3.86, max: 5 },
      { label: 'Would use regularly if available', value: 3.86, max: 5 },
      { label: 'Timely feedback when supervisor unavailable', value: 3.29, max: 5, tone: 'muted' },
    ],
    footer:
      'Lead with "identify blind spots" and "complement supervision." Do not lead with "timely feedback when supervisor unavailable."',
  },
  {
    kind: 'bars',
    eyebrow: 'Barriers',
    title: 'What will kill adoption',
    intro: 'Barriers cited by respondents. Anything above the line (\u22653) is non-negotiable for design.',
    bars: [
      { label: 'Skepticism about AI accuracy', value: 6, max: 7, tone: 'warn' },
      { label: 'Technical / poor UI', value: 5, max: 7, tone: 'warn' },
      { label: 'Algorithmic bias', value: 5, max: 7, tone: 'warn' },
      { label: 'Data privacy / confidentiality', value: 4, max: 7, tone: 'warn' },
      { label: 'Ethics (cognitive / social / env)', value: 4, max: 7, tone: 'warn' },
      { label: 'Therapeutic relationship impact', value: 3, max: 7 },
      { label: 'Preference for human-only supervision', value: 3, max: 7 },
    ],
  },
  {
    kind: 'dealbreakers',
    eyebrow: 'Privacy Dealbreakers',
    title: 'Things that must never happen',
    intro: 'At least one respondent marked each of these as "I would NOT use the tool."',
    items: [
      {
        rule: 'Supervisor sees which AI suggestions you followed or ignored',
        who: 'P01 · P03 · P05',
      },
      {
        rule: 'AI feedback routinely reviewed in supervision without opt-in',
        who: 'P01 · P05',
      },
      {
        rule: 'AI flags high-risk cases to supervisor automatically',
        who: 'P03',
      },
      {
        rule: 'Anonymized cases used to train future AI versions',
        who: 'P03',
      },
    ],
    footer: 'Universally OK: anonymized data entry · HIPAA compliance.',
  },
  {
    kind: 'quotes',
    eyebrow: 'Verbatim',
    title: 'In your own words',
    quotes: [
      {
        body: 'I am not certain I actually believe session transcripts or other data points are not being secretly maintained.',
        who: 'P05',
      },
      {
        body: 'I find AI very helpful. The note taking is very useful.',
        who: 'P08',
      },
      {
        body: 'I currently see it as something with more value as an administrative tool.',
        who: 'P03',
      },
      {
        body: 'If it could totally replace scheduling and communicating with patients outside of session.',
        who: 'P07',
      },
    ],
  },
  {
    kind: 'list',
    eyebrow: 'Roadmap · Tier 1 (ship now)',
    title: 'What we already have that maps to demand',
    intro: 'All three Tier 1 items are built or ready-to-test.',
    items: [
      { tag: '100%', text: 'SimplePractice Notes \u2014 intake capture + SOAP drafts + treatment-plan support' },
      { tag: '86%', text: 'Supervision Prep generator (new Phase 3.9) \u2014 reuses existing diagnostic + SOAP pipeline' },
      { tag: 'P02 #1', text: 'ZocDoc\u2192SimplePractice + VOB automation \u2014 ready for real-portal test' },
    ],
  },
  {
    kind: 'list',
    eyebrow: 'Roadmap · Tier 2',
    title: 'Build next',
    items: [
      { tag: '86%', text: 'D&TP auto-filler (111 fields mapped, ready to implement)' },
      { tag: 'P04·P05·P08', text: 'ADHD-RS school form + parent-vs-teacher discrepancy view' },
      { tag: '\u2014', text: 'BAARS + ADHD-RS registered in lab-site ring animation' },
      { tag: 'P04 #1', text: 'Didactics workstream v1: IFS \u00b7 EMDR \u00b7 Assessment administration' },
    ],
  },
  {
    kind: 'rules',
    eyebrow: 'Design Rules',
    title: 'Non-negotiables for every build',
    intro: 'Direct translations of the survey barriers into product requirements.',
    rules: [
      {
        n: '01',
        rule: 'Accuracy transparency',
        detail: 'Every AI suggestion shows its source (intake field, DSM criterion, knowledge-base chunk).',
      },
      {
        n: '02',
        rule: 'UI reliability',
        detail: 'Error boundaries, graceful degradation, and a one-click "report a problem" button in every extension.',
      },
      {
        n: '03',
        rule: 'Privacy-by-default',
        detail: 'No supervisor-visible telemetry on follow/ignore. Supervisor-facing features are opt-in per session.',
      },
      {
        n: '04',
        rule: 'Complement, not replace',
        detail: 'Copy positions AI as draft-assistant; final authorship is always the clinician\u2019s.',
      },
      {
        n: '05',
        rule: 'Anonymized-only training',
        detail: 'Any training on usage data is anonymized and opt-in. Off by default.',
      },
    ],
  },
  {
    kind: 'title',
    eyebrow: 'Next',
    title: 'Pilot with P07 and P08',
    subtitle:
      'Highest fit scores. Fewest barriers. Two weeks of real-session use, 20-min debrief, re-take Likert. Target: \u22650.5-point lift on "worth the time" and "trust clinical accuracy."',
    meta: 'See Clinician Survey folder \u00b7 pilot-outreach-P07-P08.md',
  },
]

export default function InzinnaClinicianSurveyPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <div className="mb-10">
        <Link
          href="/lab"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100"
        >
          &larr; Lab
        </Link>
      </div>
      <ClinicianSurveyDeck slides={slides} />
    </main>
  )
}
