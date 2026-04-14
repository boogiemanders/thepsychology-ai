export type LabDetailTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'zinc'

export type WorkflowFieldState = 'complete' | 'active' | 'pending' | 'watch'

export interface WorkflowMetricItem {
  label: string
  value: string
  tone?: LabDetailTone
}

export interface WorkflowFieldItem {
  label: string
  value: string
  state?: WorkflowFieldState
}

export interface WorkflowTranscriptItem {
  speaker: 'client' | 'clinician' | 'system'
  time?: string
  text: string
}

export interface WorkflowSectionItem {
  label: string
  body: string
}

export interface WorkflowReferenceItem {
  title: string
  meta: string
  preview: string
}

export type WorkflowBlock =
  | {
      type: 'metrics'
      title?: string
      items: WorkflowMetricItem[]
    }
  | {
      type: 'fields'
      title: string
      items: WorkflowFieldItem[]
    }
  | {
      type: 'pills'
      title: string
      items: string[]
    }
  | {
      type: 'text'
      title: string
      body: string
      monospace?: boolean
    }
  | {
      type: 'transcript'
      title: string
      items: WorkflowTranscriptItem[]
    }
  | {
      type: 'sections'
      title?: string
      items: WorkflowSectionItem[]
    }
  | {
      type: 'references'
      title: string
      items: WorkflowReferenceItem[]
    }

export interface WorkflowStep {
  id: string
  label: string
  title: string
  summary: string
  bullets: string[]
  blocks: WorkflowBlock[]
}

export interface LabDetailFact {
  label: string
  value: string
}

export interface LabResearchCard {
  title: string
  body: string
}

export interface LabStatusColumn {
  title: string
  items: string[]
}

export interface LabBrandLogo {
  src: string
  alt: string
  label: string
}

export interface LabDetailConfig {
  slug: 'simplepractice-notes' | 'zocdoc-simplepractice'
  title: string
  description: string
  categoryLabel: string
  statusLabel: string
  accent: LabDetailTone
  brandLogos?: LabBrandLogo[]
  tags: string[]
  audience: string
  whyItExists: string
  heroFacts: LabDetailFact[]
  workflowHeading: string
  workflowIntro: string
  steps: WorkflowStep[]
  proofHeading: string
  proofBullets: string[]
  architectureHeading: string
  architectureBullets: string[]
  researchHeading: string
  researchCards: LabResearchCard[]
  statusHeading: string
  statusColumns: LabStatusColumn[]
  note: string
}
