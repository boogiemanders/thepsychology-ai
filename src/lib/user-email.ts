// User-facing transactional emails (distinct from admin notify-email.ts).
// Sends to the end user, not to the internal admin inbox.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_ENDPOINT = 'https://api.resend.com/emails'

// Use a dedicated no-reply sender for extension emails, fall back to the shared notify sender.
const EMAIL_FROM = process.env.EMAIL_FROM_EXTENSIONS || process.env.NOTIFY_EMAIL_FROM

export async function sendLicenseKeyEmail(opts: {
  to: string
  licenseKey: string
  name?: string
}): Promise<void> {
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    throw new Error('Email not configured (RESEND_API_KEY / EMAIL_FROM_EXTENSIONS)')
  }

  const { to, licenseKey, name } = opts
  const greeting = name ? `Hi ${name},` : 'Hi,'

  const text = [
    greeting,
    '',
    'Thanks for subscribing to Inzinna Extensions! Here is your license key:',
    '',
    `    ${licenseKey}`,
    '',
    'To activate your extensions:',
    '  1. Install the Chrome extension(s) from the Chrome Web Store.',
    '  2. Click the extension icon in your browser toolbar to open the popup.',
    '  3. Paste your license key into the "Activate License" field and click Activate.',
    '',
    'Both extensions (SimplePractice Notes and ZocDoc → SimplePractice) use the same key.',
    '',
    'Questions? Reply to this email or visit https://thepsychology.ai',
    '',
    '— The Inzinna Team',
  ].join('\n')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a1a;">Inzinna Extensions</p>
          <p style="margin:0 0 24px;font-size:13px;color:#666;">Your license key is ready</p>

          <p style="margin:0 0 16px;font-size:14px;color:#374151;">${greeting}</p>
          <p style="margin:0 0 16px;font-size:14px;color:#374151;">
            Thanks for subscribing! Here is your license key:
          </p>

          <div style="background:#f3e8ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px;margin:0 0 24px;text-align:center;">
            <code style="font-size:14px;font-family:'SF Mono',Menlo,monospace;color:#6d28d9;letter-spacing:0.5px;">${licenseKey}</code>
          </div>

          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#374151;">To activate:</p>
          <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
            <li>Install the Chrome extension(s) from the Chrome Web Store.</li>
            <li>Click the extension icon in your toolbar to open the popup.</li>
            <li>Paste your key into <strong>Activate License</strong> and click <strong>Activate</strong>.</li>
          </ol>

          <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">
            Both extensions (SimplePractice Notes and ZocDoc → SimplePractice) use the same key.
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">

          <p style="margin:0;font-size:13px;color:#9ca3af;">
            Questions? Reply to this email or visit
            <a href="https://thepsychology.ai" style="color:#7c3aed;text-decoration:none;">thepsychology.ai</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject: 'Your Inzinna Extensions license key', text, html }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Resend returned ${response.status}: ${body}`)
  }
}
