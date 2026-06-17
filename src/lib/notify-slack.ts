// Channel-specific webhook URLs
const WEBHOOKS = {
  signups: process.env.SLACK_WEBHOOK_SIGNUPS,
  feedback: process.env.SLACK_WEBHOOK_FEEDBACK,
  recover: process.env.SLACK_WEBHOOK_RECOVER,
  insights: process.env.SLACK_WEBHOOK_INSIGHTS,
  payments: process.env.SLACK_WEBHOOK_PAYMENTS,
  metrics: process.env.SLACK_WEBHOOK_METRICS,
  alerts: process.env.SLACK_WEBHOOK_ALERTS,
  social: process.env.SLACK_WEBHOOK_SOCIAL,
  // Blog approval cards + feedback acks. Falls back to social until the
  // dedicated blog channel webhook is configured.
  blog: process.env.SLACK_WEBHOOK_BLOG || process.env.SLACK_WEBHOOK_SOCIAL,
  // Video/graphics publish approvals (review cards + post results). Falls back
  // to social until the dedicated channel webhook is configured.
  video: process.env.SLACK_WEBHOOK_VIDEO || process.env.SLACK_WEBHOOK_SOCIAL,
  // Per-lane marketing approval channels (3-lane split). Each falls back to
  // social until the founder makes a dedicated channel + webhook, so the split
  // degrades to one channel instead of dropping cards.
  linkedin: process.env.SLACK_WEBHOOK_LINKEDIN || process.env.SLACK_WEBHOOK_SOCIAL,
  tiktok_eppp: process.env.SLACK_WEBHOOK_TIKTOK_EPPP || process.env.SLACK_WEBHOOK_SOCIAL,
  // EPPP test-taking-strategy lane. Falls back to the EPPP exam channel (not the
  // generic social one) so strategy cards still land with EPPP content if its own
  // channel webhook is missing.
  tiktok_eppp_strat:
    process.env.SLACK_WEBHOOK_TIKTOK_EPPP_STRAT ||
    process.env.SLACK_WEBHOOK_TIKTOK_EPPP ||
    process.env.SLACK_WEBHOOK_SOCIAL,
  tiktok_pop: process.env.SLACK_WEBHOOK_TIKTOK_POP || process.env.SLACK_WEBHOOK_SOCIAL,
  default: process.env.SLACK_WEBHOOK_URL,
} as const

export type SlackChannel = keyof typeof WEBHOOKS

export function isSlackConfigured(channel: SlackChannel = 'default'): boolean {
  return Boolean(WEBHOOKS[channel] || WEBHOOKS.default)
}

// Returns true if the message was delivered, false if it was not (no webhook
// configured, or the webhook returned a non-ok status, or the request threw).
// Callers that need delivery to be reliable (e.g. marketing approvals) should
// check the return value instead of assuming success.
export async function sendSlackNotification(
  message: string,
  channel: SlackChannel = 'default',
  blocks?: unknown[]
): Promise<boolean> {
  const webhookUrl = WEBHOOKS[channel] || WEBHOOKS.default

  if (!webhookUrl) {
    console.warn(`[notify-slack] No webhook configured for channel: ${channel}`)
    return false
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blocks ? { text: message, blocks } : { text: message }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error(`[notify-slack] Failed (${channel}): ${response.status} - ${body}`)
      return false
    }
    return true
  } catch (error) {
    console.error(`[notify-slack] Error sending to ${channel}:`, error)
    return false
  }
}
