// Channel-specific webhook URLs
const WEBHOOKS = {
  signups: process.env.SLACK_WEBHOOK_SIGNUPS,
  feedback: process.env.SLACK_WEBHOOK_FEEDBACK,
  recover: process.env.SLACK_WEBHOOK_RECOVER,
  insights: process.env.SLACK_WEBHOOK_INSIGHTS,
  default: process.env.SLACK_WEBHOOK_URL,
} as const

export type SlackChannel = keyof typeof WEBHOOKS

export function isSlackConfigured(channel: SlackChannel = 'default'): boolean {
  return Boolean(WEBHOOKS[channel] || WEBHOOKS.default)
}

export async function sendSlackNotification(
  message: string,
  channel: SlackChannel = 'default'
): Promise<void> {
  const webhookUrl = WEBHOOKS[channel] || WEBHOOKS.default

  if (!webhookUrl) {
    console.warn(`[notify-slack] No webhook configured for channel: ${channel}`)
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error(`[notify-slack] Failed (${channel}): ${response.status} - ${body}`)
    }
  } catch (error) {
    console.error(`[notify-slack] Error sending to ${channel}:`, error)
  }
}
