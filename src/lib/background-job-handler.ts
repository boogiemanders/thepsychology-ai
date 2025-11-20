'use client'

/**
 * Background Job Handler
 * Manages the queue and retry logic for background exam generation
 */

interface JobQueueItem {
  userId: string
  examType: 'diagnostic' | 'practice'
  retries: number
  maxRetries: number
  lastAttempt?: number
}

// In-memory queue for background jobs (in production, use Redis or a job queue service)
let jobQueue: JobQueueItem[] = []
let isProcessing = false

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000 // 5 seconds between retries
const JOB_TIMEOUT_MS = 120000 // 2 minute timeout per job

/**
 * Add a job to the background queue
 */
export function enqueueExamGeneration(userId: string, examType: 'diagnostic' | 'practice'): void {
  // Check if job already exists
  const existingJob = jobQueue.find((j) => j.userId === userId && j.examType === examType)
  if (existingJob) {
    console.log(`[BGJob] Job already queued for user ${userId}, exam type ${examType}`)
    return
  }

  jobQueue.push({
    userId,
    examType,
    retries: 0,
    maxRetries: MAX_RETRIES,
  })

  console.log(`[BGJob] Queued exam generation for user ${userId}, exam type ${examType}`)
  processQueue()
}

/**
 * Process the background job queue
 */
async function processQueue(): Promise<void> {
  if (isProcessing || jobQueue.length === 0) {
    return
  }

  isProcessing = true

  try {
    while (jobQueue.length > 0) {
      const job = jobQueue[0]

      try {
        await executeJob(job)
        // Remove successful job from queue
        jobQueue.shift()
      } catch (error) {
        job.retries++
        job.lastAttempt = Date.now()

        if (job.retries >= job.maxRetries) {
          console.error(
            `[BGJob] Max retries exceeded for user ${job.userId}, exam type ${job.examType}`,
            error
          )
          jobQueue.shift()
        } else {
          console.warn(
            `[BGJob] Job failed for user ${job.userId}, exam type ${job.examType}, retrying... (${job.retries}/${job.maxRetries})`,
            error
          )
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
        }
      }
    }
  } finally {
    isProcessing = false
  }
}

/**
 * Execute a single background job
 */
async function executeJob(job: JobQueueItem): Promise<void> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), JOB_TIMEOUT_MS)

  try {
    const response = await fetch('/api/pre-generate-exam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: job.userId,
        examType: job.examType,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      let errorMessage = `API returned ${response.status}`

      try {
        const errorText = await response.text()
        if (errorText) {
          try {
            const parsed = JSON.parse(errorText)
            errorMessage = `${errorMessage}: ${parsed.error || errorText}`
          } catch {
            errorMessage = `${errorMessage}: ${errorText}`
          }
        }
      } catch (parseErr) {
        console.warn('[BGJob] Failed to parse error response', parseErr)
      }

      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log(
      `[BGJob] Successfully generated ${job.examType} exam for user ${job.userId}`,
      result
    )
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Background job timed out after ${JOB_TIMEOUT_MS / 1000}s`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Get current job queue status (for debugging)
 */
export function getJobQueueStatus(): {
  queueLength: number
  isProcessing: boolean
  jobs: JobQueueItem[]
} {
  return {
    queueLength: jobQueue.length,
    isProcessing,
    jobs: [...jobQueue],
  }
}

/**
 * Clear the job queue (for debugging/testing)
 */
export function clearJobQueue(): void {
  const count = jobQueue.length
  jobQueue = []
  console.log(`[BGJob] Cleared ${count} jobs from queue`)
}
