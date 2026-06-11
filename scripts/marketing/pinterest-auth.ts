// One-time Pinterest OAuth for the marketing vault. Opens the Pinterest consent
// page in the browser, catches the redirect on localhost:8085, exchanges the
// code for tokens (Basic auth), and saves them into .env.local.
//
// The redirect URI http://localhost:8085/ must be registered in the Pinterest
// app settings (developers.pinterest.com) or the consent page will reject it.
//
// Token model (Pinterest v5, "continuous refresh"): access tokens last ~30 days,
// refresh tokens ~1 year, and a refresh may return a NEW refresh token, so the
// puller persists whatever comes back. Re-run this script only if the refresh
// token itself expires.
//
// Usage: npx tsx scripts/marketing/pinterest-auth.ts
//
// Reads (.env.local): PINTEREST_APP_ID, PINTEREST_APP_SECRET
// Writes (.env.local): PINTEREST_ACCESS_TOKEN, PINTEREST_REFRESH_TOKEN,
//                      PINTEREST_TOKEN_EXPIRES_AT (epoch ms)

import { execFileSync } from "child_process"
import { randomBytes } from "crypto"
import { readFileSync, writeFileSync } from "fs"
import http from "http"
import { config } from "dotenv"

config({ path: ".env.local" })

const APP_ID = process.env.PINTEREST_APP_ID
const APP_SECRET = process.env.PINTEREST_APP_SECRET
if (!APP_ID || !APP_SECRET) {
  console.error("PINTEREST_APP_ID and PINTEREST_APP_SECRET must be set in .env.local")
  process.exit(1)
}

const PORT = 8085
const REDIRECT_URI = `http://localhost:${PORT}/`
const SCOPES = "boards:read,pins:read"
const TOKEN_URL = "https://api.pinterest.com/v5/oauth/token"
const state = randomBytes(16).toString("hex")

// Update keys in .env.local in place, append if missing, leave every other line alone.
function updateEnvLocal(values: Record<string, string>) {
  let text = readFileSync(".env.local", "utf-8")
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`
    const re = new RegExp(`^${key}=.*$`, "m")
    if (re.test(text)) {
      text = text.replace(re, () => line)
    } else {
      if (!text.endsWith("\n")) text += "\n"
      text += line + "\n"
    }
  }
  writeFileSync(".env.local", text)
}

async function exchangeCode(code: string) {
  const basic = Buffer.from(`${APP_ID}:${APP_SECRET}`).toString("base64")
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
    refresh_token_expires_in: number
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", REDIRECT_URI)
  if (url.pathname !== "/") {
    // Stray requests (favicon etc), keep waiting for the real redirect.
    res.writeHead(404)
    res.end()
    return
  }

  const denied = url.searchParams.get("error")
  if (denied) {
    res.writeHead(200, { "Content-Type": "text/html" })
    res.end("<p>Pinterest authorization was denied. You can close this tab.</p>")
    console.error(`Authorization denied (${denied}). No tokens were saved.`)
    server.close()
    process.exit(1)
  }

  const code = url.searchParams.get("code")
  if (!code) {
    res.writeHead(404)
    res.end()
    return
  }
  if (url.searchParams.get("state") !== state) {
    res.writeHead(400, { "Content-Type": "text/html" })
    res.end("<p>State mismatch, possible stale redirect. Run the script again.</p>")
    console.error("State mismatch on redirect. No tokens were saved.")
    server.close()
    process.exit(1)
  }

  try {
    const tokens = await exchangeCode(code)
    const expiresAt = Date.now() + tokens.expires_in * 1000
    updateEnvLocal({
      PINTEREST_ACCESS_TOKEN: tokens.access_token,
      PINTEREST_REFRESH_TOKEN: tokens.refresh_token,
      PINTEREST_TOKEN_EXPIRES_AT: String(expiresAt),
    })
    res.writeHead(200, { "Content-Type": "text/html" })
    res.end("<p>Pinterest connected. You can close this tab.</p>")
    console.log("Tokens saved to .env.local")
    console.log(`Access token expires ${new Date(expiresAt).toISOString()}`)
    console.log(
      `Refresh token expires ${new Date(Date.now() + tokens.refresh_token_expires_in * 1000).toISOString()}`
    )
    server.close()
    process.exit(0)
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html" })
    res.end("<p>Token exchange failed. Check the terminal.</p>")
    console.error(err instanceof Error ? err.message : String(err))
    server.close()
    process.exit(1)
  }
})

server.listen(PORT, () => {
  const authorizeUrl =
    "https://www.pinterest.com/oauth/?" +
    new URLSearchParams({
      client_id: APP_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: SCOPES,
      state,
    }).toString()
  console.log("Waiting for the Pinterest redirect on " + REDIRECT_URI)
  console.log("If the browser does not open, paste this URL into it:")
  console.log(authorizeUrl)
  try {
    execFileSync("open", [authorizeUrl])
  } catch {
    // Browser did not open, the printed URL still works.
  }
})
