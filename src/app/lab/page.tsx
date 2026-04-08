import type { Metadata } from 'next'
import LabClient from './lab-client'

export const metadata: Metadata = {
  title: 'Lab | thePsychology.ai',
  description: 'Clinical tools, practice automations, and experimental projects from thePsychology.ai.',
}

const projects = [
  {
    id: 1,
    title: 'NYSED License Notification',
    description: 'We check NYSED daily. The second your license posts, you get an email. No more refreshing.',
    category: 'getting-licensed',
    categoryLabel: '01 Getting Licensed',
    href: '/lab/license-watch',
    status: 'live' as const,
    tags: ['Email Alerts', 'NYSED', 'Free'],
  },
  {
    id: 2,
    title: 'SimplePractice Notes',
    description: 'Local AI writes your progress notes. Intake data, diagnostic impressions, session records. PHI never leaves your device.',
    category: 'clinical-practice',
    categoryLabel: '02 Clinical Practice',
    status: 'beta' as const,
    tags: ['Chrome Extension', 'Ollama', 'HIPAA'],
  },
  {
    id: 3,
    title: 'ZocDoc to SimplePractice',
    description: 'ZocDoc referral comes in. SimplePractice intake fills itself. Your front desk stops typing things twice.',
    category: 'clinical-practice',
    categoryLabel: '02 Clinical Practice',
    status: 'dev' as const,
    tags: ['Chrome Extension', 'Automation'],
  },
  {
    id: 4,
    title: 'SENSE Lens',
    description: 'Sensory-informed clinical framework. Client tracking, interventions, and pattern recognition. Built for your phone, built for sessions.',
    category: 'clinical-practice',
    categoryLabel: '02 Clinical Practice',
    status: 'dev' as const,
    tags: ['Next.js App', 'Prisma', 'Clinical'],
  },
  {
    id: 5,
    title: 'Chinese Calligraphy Studio',
    description: 'Type English. Get Chinese. See it in real calligraphy fonts.',
    category: 'creative',
    categoryLabel: '03 Creative',
    href: '/lab/calligraphy',
    status: 'live' as const,
    tags: ['Interactive', 'Translation'],
  },
]

export default function LabPage() {
  return <LabClient projects={projects} />
}
