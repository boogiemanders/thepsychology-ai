import type { Metadata } from 'next'
import LabClient from './lab-client'

export const metadata: Metadata = {
  title: 'Lab | thePsychology.ai',
  description: 'Clinical tools, practice automations, and experimental projects from thePsychology.ai.',
}

const projects = [
  {
    id: 1,
    title: 'NYSED Psych License Check',
    description: 'After you got your hours and passed the EPPP, you\u2019re waiting for the board. We check daily and email you when your license is recognized. Free. No more refreshing.',
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
    categoryLabel: '02 Psychologist Tools',
    status: 'beta' as const,
    tags: ['Chrome Extension', 'Ollama', 'HIPAA'],
  },
  {
    id: 3,
    title: 'ZocDoc to SimplePractice',
    description: 'ZocDoc referral comes in. SimplePractice intake fills itself. Your front desk stops typing things twice.',
    category: 'clinical-practice',
    categoryLabel: '02 Psychologist Tools',
    status: 'dev' as const,
    tags: ['Chrome Extension', 'Automation'],
  },
  {
    id: 4,
    title: 'SENSE',
    description: 'A mind-body assessment tool developed by Dr. Neha Menon.',
    category: 'clinical-practice',
    categoryLabel: '02 Psychologist Tools',
    href: '/lab/sense',
    status: 'dev' as const,
    tags: ['Next.js App', 'Prisma', 'Clinical'],
  },
  {
    id: 5,
    title: 'ADHD-RS 2D',
    description: 'Placeholder for an ADHD Rating Scale workflow in the lab site, with structured scoring and clinician-friendly results.',
    category: 'clinical-practice',
    categoryLabel: '02 Psychologist Tools',
    href: '/lab/adhd-rs',
    status: 'dev' as const,
    tags: ['Assessment', 'ADHD', 'Psychologist Tools'],
  },
  {
    id: 6,
    title: 'BAARS 2E',
    description: 'Placeholder for a BAARS workflow in the lab site, designed for interactive administration, scoring, and summary output.',
    category: 'clinical-practice',
    categoryLabel: '02 Psychologist Tools',
    href: '/lab/baars',
    status: 'dev' as const,
    tags: ['Assessment', 'ADHD', 'Psychologist Tools'],
  },
  {
    id: 7,
    title: 'Chinese Calligraphy Studio',
    description: 'Type English. Get Chinese. See it in real calligraphy fonts.',
    category: 'creative',
    categoryLabel: '03 Creative',
    href: '/lab/calligraphy',
    status: 'live' as const,
    tags: ['Interactive', 'Translation'],
  },
  {
    id: 8,
    title: 'Dental Figure Extractor',
    description: 'Upload a textbook PDF. Get a PowerPoint with every figure on its own slide, captions included. Drag them into your study decks.',
    category: 'dental',
    categoryLabel: '04 Dental',
    href: '/lab/dental',
    status: 'beta' as const,
    tags: ['PyMuPDF', 'PowerPoint', 'Dental Students'],
  },
]

export default function LabPage() {
  return <LabClient projects={projects} />
}
