import fs from 'fs'
import path from 'path'
import { DOMAIN_FOLDER_MAP, DOMAIN_NUMBER_MAP, findTopicFile } from './topic-paths'

const QUESTIONS_DIR = path.join(process.cwd(), 'questionsGPT')

export interface TopicQuestion {
  stem?: string
  question?: string
  options?: string[]
  answer?: string
  correct_answer?: string
  explanation?: string
  relatedSections?: string[]
  is_lock_in_drill?: boolean
  lock_in_level?: string
  tags?: string[]
}

export interface LoadedTopicQuestions {
  filePath: string
  questions: TopicQuestion[]
}

export function loadTopicQuestions(topicName: string, domainId?: string | null): LoadedTopicQuestions | null {
  if (!topicName) return null

  const filePath = findTopicFile(QUESTIONS_DIR, topicName, '.json', domainId)

  if (!filePath) {
    console.warn(`[Topic Question Loader] No question file found for topic "${topicName}" (domain: ${domainId ?? 'any'})`)
    return null
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw)
    const questions = Array.isArray(parsed.questions) ? parsed.questions : []

    if (!Array.isArray(questions) || questions.length === 0) {
      console.warn(`[Topic Question Loader] Question file ${filePath} has no questions array`)
      return null
    }

    return { filePath, questions }
  } catch (error) {
    console.error(`[Topic Question Loader] Failed to load questions from ${filePath}:`, error)
    return null
  }
}

export function topicHasQuestionFile(topicName: string, domainId: string): boolean {
  const domainFolder = DOMAIN_FOLDER_MAP[domainId]
  const domainNumbers = DOMAIN_NUMBER_MAP[domainId]

  if (!domainFolder || !domainNumbers) {
    return false
  }

  const filePath = findTopicFile(QUESTIONS_DIR, topicName, '.json', domainId)
  return Boolean(filePath)
}
