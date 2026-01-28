type TelegramArgs = {
  text: string
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export function isTelegramConfigured(): boolean {
  return Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)
}

export async function sendTelegramNotification({ text }: TelegramArgs): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[notify-telegram] Missing TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID; skipping')
    return
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
  })

  if (!r.ok) {
    const body = await r.text().catch(() => '')
    throw new Error(`[notify-telegram] sendMessage failed: ${r.status} ${body}`)
  }
}
