import { SupabaseClient } from '@supabase/supabase-js'
import { sendSlackNotification } from '@/lib/notify-slack'

const MILESTONES = [100, 250, 500, 1000, 2500, 5000]

/**
 * Check if user has reached a question milestone and notify via Slack.
 * Called after saving exam results.
 */
export async function checkUserMilestone(
  supabase: SupabaseClient,
  userId: string,
  questionsJustCompleted: number
): Promise<void> {
  try {
    // Get user's total question count from exam_history
    const { data: history } = await supabase
      .from('exam_history')
      .select('total_questions')
      .eq('user_id', userId)

    if (!history) return

    const totalQuestions = history.reduce((sum, h) => sum + (h.total_questions || 0), 0)
    const previousTotal = totalQuestions - questionsJustCompleted

    // Check if we crossed any milestones
    for (const milestone of MILESTONES) {
      if (previousTotal < milestone && totalQuestions >= milestone) {
        // Get user email for the notification
        const { data: user } = await supabase
          .from('users')
          .select('email, name')
          .eq('id', userId)
          .single()

        const identifier = user?.name || user?.email || 'A user'

        await sendSlackNotification(
          `🎉 Milestone! ${identifier} completed ${milestone.toLocaleString()} practice questions!`,
          'metrics'
        )

        // Only notify for the highest milestone crossed in this session
        break
      }
    }
  } catch (error) {
    console.error('[user-milestones] Error checking milestone:', error)
  }
}
