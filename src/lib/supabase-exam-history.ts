// Supabase exam history utilities
// Handles reading/writing exam history from/to Supabase database

import { createClient } from "@supabase/supabase-js"
import type { ExamCompletion } from "./exam-history"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create Supabase client (safe to call from client-side)
const supabase = createClient(supabaseUrl, supabaseKey)

type ExamHistoryRow = {
  id: string
  exam_type: "diagnostic" | "practice"
  exam_mode: "study" | "test"
  score: number
  total_questions: number
  correct_answers: number
  created_at: string
}

function isExamHistoryRow(value: unknown): value is ExamHistoryRow {
  if (!value || typeof value !== "object") return false
  const row = value as Partial<ExamHistoryRow>
  return (
    typeof row.id === "string" &&
    (row.exam_type === "diagnostic" || row.exam_type === "practice") &&
    (row.exam_mode === "study" || row.exam_mode === "test") &&
    typeof row.score === "number" &&
    typeof row.total_questions === "number" &&
    typeof row.correct_answers === "number" &&
    typeof row.created_at === "string"
  )
}

/**
 * Save exam completion to Supabase
 */
export async function saveExamCompletionToSupabase(completion: Omit<ExamCompletion, "id" | "userId" | "timestamp">, userId: string): Promise<ExamCompletion | null> {
  try {
    const { data, error } = await supabase.from("exam_history").insert([
      {
        user_id: userId,
        exam_type: completion.examType,
        exam_mode: completion.examMode,
        score: completion.score,
        total_questions: completion.totalQuestions,
        correct_answers: completion.correctAnswers,
      },
    ]).select("id, exam_type, exam_mode, score, total_questions, correct_answers, created_at").single()

    if (error) {
      console.error("Error saving exam completion to Supabase:", error)
      return null
    }

    if (isExamHistoryRow(data)) {
      const row = data
      return {
        id: row.id,
        userId,
        examType: row.exam_type,
        examMode: row.exam_mode,
        score: row.score,
        totalQuestions: row.total_questions,
        correctAnswers: row.correct_answers,
        timestamp: new Date(row.created_at).getTime(),
      }
    }

    return null
  } catch (error) {
    console.error("Exception saving exam completion to Supabase:", error)
    return null
  }
}

/**
 * Get exam history from Supabase for current user
 */
export async function getExamHistoryFromSupabase(userId: string): Promise<ExamCompletion[]> {
  try {
    const { data, error } = await supabase
      .from("exam_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching exam history from Supabase:", error)
      return []
    }

    const rows = Array.isArray(data) ? data.filter(isExamHistoryRow) : []

    return rows.map((row) => ({
      id: row.id,
      userId,
      examType: row.exam_type,
      examMode: row.exam_mode,
      score: row.score,
      totalQuestions: row.total_questions,
      correctAnswers: row.correct_answers,
      timestamp: new Date(row.created_at).getTime(),
    }))
  } catch (error) {
    console.error("Exception fetching exam history from Supabase:", error)
    return []
  }
}

/**
 * Get latest exam completion of a specific type from Supabase
 */
export async function getLatestExamCompletion(
  userId: string,
  examType: "diagnostic" | "practice",
  examMode?: "study" | "test"
): Promise<ExamCompletion | null> {
  try {
    let query = supabase
      .from("exam_history")
      .select("*")
      .eq("user_id", userId)
      .eq("exam_type", examType)

    if (examMode) {
      query = query.eq("exam_mode", examMode)
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(1)

    if (error) {
      console.error("Error fetching latest exam completion from Supabase:", error)
      return null
    }

    const rows = Array.isArray(data) ? data : []
    const row = rows.find(isExamHistoryRow)
    if (!row) return null

    return {
      id: row.id,
      userId,
      examType: row.exam_type,
      examMode: row.exam_mode,
      score: row.score,
      totalQuestions: row.total_questions,
      correctAnswers: row.correct_answers,
      timestamp: new Date(row.created_at).getTime(),
    }
  } catch (error) {
    console.error("Exception fetching latest exam completion from Supabase:", error)
    return null
  }
}

/**
 * Check if user has completed an exam type/mode combination
 */
export async function hasCompletedExamOnSupabase(userId: string, examType: "diagnostic" | "practice", examMode: "study" | "test"): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("exam_history")
      .select("id")
      .eq("user_id", userId)
      .eq("exam_type", examType)
      .eq("exam_mode", examMode)
      .limit(1)

    if (error) {
      console.error("Error checking exam completion on Supabase:", error)
      return false
    }

    return Array.isArray(data) && data.length > 0
  } catch (error) {
    console.error("Exception checking exam completion on Supabase:", error)
    return false
  }
}
