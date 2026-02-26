export const INITIAL_RECOVER_ASSISTANT_MESSAGE =
  "How are you doing right now? We can talk about studying, or anything that feels most useful."
export const RECOVER_RECOMMENDATION_HOUR_KEY = 'recover_recommendation_hour'

export const QUICK_RESET_RECOVER_ASSISTANT_MESSAGE = [
  'Quick reset (5 minutes):',
  '',
  '- 4 slow breaths, longer exhales.',
  '- Drop your shoulders and unclench your jaw.',
  '- When you are ready, we can talk about studying or anything that is on your mind.',
].join('\n')

export function getRecoverInitialAssistantMessage(entry?: string | null): string {
  if (entry === 'quick-reset') {
    return QUICK_RESET_RECOVER_ASSISTANT_MESSAGE
  }
  return INITIAL_RECOVER_ASSISTANT_MESSAGE
}
