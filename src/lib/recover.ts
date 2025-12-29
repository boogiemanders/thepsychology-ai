export const INITIAL_RECOVER_ASSISTANT_MESSAGE = "How's studying been going?"
export const RECOVER_RECOMMENDATION_HOUR_KEY = 'recover_recommendation_hour'

export const QUICK_RESET_RECOVER_ASSISTANT_MESSAGE = [
  'Quick reset (5 minutes):',
  '',
  '- 4 slow breaths, longer exhales.',
  '- Drop your shoulders and unclench your jaw.',
  '- When you are ready, let\'s talk about how studying has been going',
].join('\n')

export function getRecoverInitialAssistantMessage(entry?: string | null): string {
  if (entry === 'quick-reset') {
    return QUICK_RESET_RECOVER_ASSISTANT_MESSAGE
  }
  return INITIAL_RECOVER_ASSISTANT_MESSAGE
}
