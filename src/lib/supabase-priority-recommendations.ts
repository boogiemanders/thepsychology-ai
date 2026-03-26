// Supabase priority recommendations utilities
// Handles reading/writing priority recommendations from/to Supabase database

import { createClient } from "@supabase/supabase-js"
import type { PriorityDomainRecommendation, PriorityRecommendation } from "./priority-storage"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create Supabase client (safe to call from client-side)
const supabase = createClient(supabaseUrl, supabaseKey)

type PriorityRecommendationRow = {
  id: string
  exam_type: "diagnostic" | "practice"
  exam_mode: "study" | "test"
  recommendation_data: {
    topPriorities: PriorityDomainRecommendation[]
    allResults: PriorityDomainRecommendation[]
  }
  created_at: string
}

function isPriorityRecommendationRow(value: unknown): value is PriorityRecommendationRow {
  if (!value || typeof value !== "object") return false
  const row = value as Partial<PriorityRecommendationRow>
  return (
    typeof row.id === "string" &&
    (row.exam_type === "diagnostic" || row.exam_type === "practice") &&
    (row.exam_mode === "study" || row.exam_mode === "test") &&
    !!row.recommendation_data &&
    typeof row.created_at === "string"
  )
}

/**
 * Save priority recommendation to Supabase
 */
export async function savePriorityRecommendationToSupabase(
  recommendation: Omit<PriorityRecommendation, "id" | "userId" | "timestamp">,
  userId: string
): Promise<PriorityRecommendation | null> {
  try {
    const { data, error } = await supabase.from("priority_recommendations").insert([
      {
        user_id: userId,
        exam_type: recommendation.examType,
        exam_mode: recommendation.examMode,
        recommendation_data: {
          topPriorities: recommendation.topPriorities,
          allResults: recommendation.allResults,
        },
      },
    ]).select("id, exam_type, exam_mode, recommendation_data, created_at").single()

    if (error) {
      console.error("Error saving priority recommendation to Supabase:", error)
      return null
    }

    if (isPriorityRecommendationRow(data)) {
      const row = data
      return {
        id: row.id,
        userId,
        examType: row.exam_type,
        examMode: row.exam_mode,
        topPriorities: row.recommendation_data.topPriorities,
        allResults: row.recommendation_data.allResults,
        timestamp: new Date(row.created_at).getTime(),
      }
    }

    return null
  } catch (error) {
    console.error("Exception saving priority recommendation to Supabase:", error)
    return null
  }
}

/**
 * Get latest priority recommendation for an exam type from Supabase
 */
export async function getLatestRecommendationFromSupabase(userId: string, examType: "diagnostic" | "practice"): Promise<PriorityRecommendation | null> {
  try {
    const { data, error } = await supabase
      .from("priority_recommendations")
      .select("*")
      .eq("user_id", userId)
      .eq("exam_type", examType)
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error fetching priority recommendation from Supabase:", error)
      return null
    }

    const rows = Array.isArray(data) ? data : []
    const row = rows.find(isPriorityRecommendationRow)
    if (!row) return null

    return {
      id: row.id,
      userId,
      examType: row.exam_type,
      examMode: row.exam_mode,
      topPriorities: row.recommendation_data.topPriorities,
      allResults: row.recommendation_data.allResults,
      timestamp: new Date(row.created_at).getTime(),
    }
  } catch (error) {
    console.error("Exception fetching priority recommendation from Supabase:", error)
    return null
  }
}

/**
 * Get priority recommendation history from Supabase
 */
export async function getRecommendationHistoryFromSupabase(userId: string): Promise<PriorityRecommendation[]> {
  try {
    const { data, error } = await supabase
      .from("priority_recommendations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching recommendation history from Supabase:", error)
      return []
    }

    const rows = Array.isArray(data) ? data.filter(isPriorityRecommendationRow) : []

    return rows.map((row) => ({
      id: row.id,
      userId,
      examType: row.exam_type,
      examMode: row.exam_mode,
      topPriorities: row.recommendation_data.topPriorities,
      allResults: row.recommendation_data.allResults,
      timestamp: new Date(row.created_at).getTime(),
    }))
  } catch (error) {
    console.error("Exception fetching recommendation history from Supabase:", error)
    return []
  }
}

/**
 * Get all latest recommendations (both diagnostic and practice) from Supabase
 */
export async function getAllLatestRecommendationsFromSupabase(userId: string): Promise<{
  diagnostic: PriorityRecommendation | null
  practice: PriorityRecommendation | null
}> {
  const [diagnostic, practice] = await Promise.all([
    getLatestRecommendationFromSupabase(userId, "diagnostic"),
    getLatestRecommendationFromSupabase(userId, "practice"),
  ])

  return { diagnostic, practice }
}
