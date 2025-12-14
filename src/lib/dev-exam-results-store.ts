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

function getRecordTimestamp(record: DevExamResultRecord): number {
  if (!record?.created_at) return 0
  const time = new Date(record.created_at).getTime()
  return Number.isFinite(time) ? time : 0
}

export function getDevExamResultsForUser(
  userId: string
): Array<{ id: string; record: DevExamResultRecord }> {
  if (!userId) return []

  const results: Array<{ id: string; record: DevExamResultRecord }> = []

  for (const [id, record] of store.entries()) {
    if (record.user_id !== userId) continue
    results.push({ id, record })
  }

  return results.sort(
    (a, b) => getRecordTimestamp(b.record) - getRecordTimestamp(a.record)
  )
}

export function getLatestDevExamResultForUser(
  userId: string,
  examType?: string | null
): { id: string; record: DevExamResultRecord } | null {
  const results = getDevExamResultsForUser(userId)
  if (examType) {
    const matched = results.find(({ record }) => record.exam_type === examType)
    return matched || null
  }
  return results[0] || null
}
