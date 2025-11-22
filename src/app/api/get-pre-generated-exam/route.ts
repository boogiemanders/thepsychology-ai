import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { preGenerated: false, reason: 'Supabase is not configured' },
        { status: 200 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const examType = searchParams.get('examType')

    // Validate inputs
    if (!userId || !examType) {
      return NextResponse.json(
        { error: 'Missing userId or examType', preGenerated: false },
        { status: 400 }
      )
    }

    if (!['diagnostic', 'practice'].includes(examType)) {
      return NextResponse.json(
        { error: 'Invalid examType', preGenerated: false },
        { status: 400 }
      )
    }

    console.log(`[Get Pre-Gen] Fetching pre-generated ${examType} exam for user ${userId}`)

    // Fetch unused, non-expired exam
    const { data, error } = await supabase
      .from('pre_generated_exams')
      .select('id, questions, expires_at')
      .eq('user_id', userId)
      .eq('exam_type', examType)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Handle "no rows" error as normal (no pre-gen available)
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - normal condition
        console.log(`[Get Pre-Gen] No valid pre-generated exam found for user ${userId}`)
        return NextResponse.json(
          { preGenerated: false, reason: 'No valid pre-generated exam' },
          { status: 200 }
        )
      }

      console.error('[Get Pre-Gen] Database error:', error)
      return NextResponse.json(
        { error: 'Database error', preGenerated: false },
        { status: 500 }
      )
    }

    if (!data) {
      console.log(`[Get Pre-Gen] No valid pre-generated exam found for user ${userId}`)
      return NextResponse.json(
        { preGenerated: false, reason: 'No valid pre-generated exam' },
        { status: 200 }
      )
    }

    console.log(`[Get Pre-Gen] Found pre-generated exam ${data.id}, marking as used`)

    // Mark as used
    const { error: updateError } = await supabase
      .from('pre_generated_exams')
      .update({ used: true })
      .eq('id', data.id)

    if (updateError) {
      console.error('[Get Pre-Gen] Error marking exam as used:', updateError)
      // Don't fail the request if marking as used fails
      // The exam will still work, it's just not marked as used
    }

    console.log(`[Get Pre-Gen] Successfully retrieved pre-generated exam with ${data.questions.questions.length} questions`)

    return NextResponse.json(
      {
        preGenerated: true,
        examId: data.id,
        questions: data.questions,
        expiresAt: data.expires_at,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Get Pre-Gen] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', preGenerated: false },
      { status: 500 }
    )
  }
}
