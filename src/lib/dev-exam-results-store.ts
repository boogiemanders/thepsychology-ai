import { randomUUID } from 'crypto'

export interface DevExamResultRecord {
  questions: any[]
  selected_answers: Record<number, string>
  flagged_questions: Record<number, boolean>
  score: number
  total_questions: number
  exam_type: string
  exam_mode: string
  top_priorities: any
  all_results: any
  user_id?: string
  created_at: string
}

type GlobalWithExamStore = typeof globalThis & {
  __devExamResultsStore?: Map<string, DevExamResultRecord>
}

const globalWithStore = globalThis as GlobalWithExamStore

if (!globalWithStore.__devExamResultsStore) {
  globalWithStore.__devExamResultsStore = new Map()
}

const store = globalWithStore.__devExamResultsStore!

export function saveDevExamResult(record: DevExamResultRecord): string {
  const id = (typeof randomUUID === 'function' ? randomUUID() : `local-${Date.now()}`)
  store.set(id, record)
  return id
}

export function getDevExamResult(id: string): DevExamResultRecord | null {
  return store.get(id) ?? null
}
