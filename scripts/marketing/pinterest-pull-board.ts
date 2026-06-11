// Pull the founder's Pinterest board into the marketing vault. Refreshes the
// access token when it is close to expiring, finds the board by name, pages
// through its pins, downloads images we do not already have (matched by pin id,
// so the earlier RSS pull counts as downloaded), and regenerates _index.md.
//
// Usage: npx tsx scripts/marketing/pinterest-pull-board.ts [--board "Board Name"]
//        (default board: "Animation Reference")
//
// Env (.env.local): PINTEREST_APP_ID, PINTEREST_APP_SECRET plus the tokens
// written by pinterest-auth.ts (PINTEREST_ACCESS_TOKEN, PINTEREST_REFRESH_TOKEN,
// PINTEREST_TOKEN_EXPIRES_AT). A refresh may return a new refresh token, which
// is persisted back to .env.local.

import { config } from "dotenv"
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

config({ path: ".env.local" })

const API = "https://api.pinterest.com/v5"
const OUTPUT_DIR =
  "/Users/anderschan/Library/CloudStorage/GoogleDrive-dranders@drinzinna.com/My Drive/Claude Code Vault/raw/marketing/animation-references"
const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // refresh when within 7 days of expiry

const boardFlag = process.argv.indexOf("--board")
const BOARD_NAME = boardFlag >= 0 ? process.argv[boardFlag + 1] : "Animation Reference"
if (!BOARD_NAME) {
  console.error('Usage: npx tsx scripts/marketing/pinterest-pull-board.ts [--board "Board Name"]')
  process.exit(1)
}

let accessToken = process.env.PINTEREST_ACCESS_TOKEN
if (!accessToken) {
  console.error("PINTEREST_ACCESS_TOKEN is not set. Run the one-time auth first:")
  console.error("  npx tsx scripts/marketing/pinterest-auth.ts")
  process.exit(1)
}

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

async function refreshIfNeeded() {
  const expiresAt = Number(process.env.PINTEREST_TOKEN_EXPIRES_AT || 0)
  if (expiresAt && expiresAt - Date.now() > REFRESH_WINDOW_MS) return

  const appId = process.env.PINTEREST_APP_ID
  const appSecret = process.env.PINTEREST_APP_SECRET
  const refreshToken = process.env.PINTEREST_REFRESH_TOKEN
  if (!appId || !appSecret || !refreshToken) {
    console.error(
      "Access token needs a refresh but PINTEREST_APP_ID, PINTEREST_APP_SECRET or PINTEREST_REFRESH_TOKEN is missing."
    )
    console.error("Run: npx tsx scripts/marketing/pinterest-auth.ts")
    process.exit(1)
  }

  console.log("Access token expires within 7 days, refreshing.")
  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${appId}:${appSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as {
    access_token: string
    expires_in: number
    refresh_token?: string
  }

  accessToken = data.access_token
  const updates: Record<string, string> = {
    PINTEREST_ACCESS_TOKEN: data.access_token,
    PINTEREST_TOKEN_EXPIRES_AT: String(Date.now() + data.expires_in * 1000),
  }
  // Continuous refresh: Pinterest may rotate the refresh token, keep the newest.
  if (data.refresh_token) updates.PINTEREST_REFRESH_TOKEN = data.refresh_token
  updateEnvLocal(updates)
  console.log("Refreshed token saved to .env.local")
}

async function apiGet(path: string, params: Record<string, string>) {
  const url = new URL(`${API}${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

// v5 list endpoints share the same shape: { items, bookmark } with bookmark
// pagination (null/absent bookmark means last page).
async function pagedGet<T>(path: string): Promise<T[]> {
  const items: T[] = []
  let bookmark: string | undefined
  do {
    const params: Record<string, string> = { page_size: "100" }
    if (bookmark) params.bookmark = bookmark
    const page = (await apiGet(path, params)) as { items?: T[]; bookmark?: string | null }
    items.push(...(page.items || []))
    bookmark = page.bookmark || undefined
  } while (bookmark)
  return items
}

type Board = { id: string; name: string }
type PinImage = { url?: string; width?: number; height?: number }
type Pin = {
  id: string
  title?: string | null
  description?: string | null
  media?: { media_type?: string; images?: Record<string, PinImage> } | null
}

// Prefer media.images.originals, fall back to the widest size present.
function bestImageUrl(pin: Pin): string | null {
  const images = pin.media?.images
  if (!images) return null
  if (images.originals?.url) return images.originals.url
  let best: PinImage | undefined
  for (const img of Object.values(images)) {
    if (img?.url && (!best || (img.width || 0) > (best.width || 0))) best = img
  }
  return best?.url || null
}

async function main() {
  await refreshIfNeeded()

  const boards = await pagedGet<Board>("/boards")
  const board = boards.find((b) => b.name.toLowerCase() === BOARD_NAME.toLowerCase())
  if (!board) {
    console.error(`Board "${BOARD_NAME}" not found on this account.`)
    console.error(`Boards found: ${boards.map((b) => b.name).join(", ") || "(none)"}`)
    process.exit(1)
  }

  mkdirSync(OUTPUT_DIR, { recursive: true })
  // Anything already named pin-<id>.* counts as downloaded (covers the earlier RSS pull).
  const existingByPinId = new Map<string, string>()
  for (const f of readdirSync(OUTPUT_DIR)) {
    const m = f.match(/^pin-(\d+)\.[a-z0-9]+$/i)
    if (m) existingByPinId.set(m[1], f)
  }

  const pins = await pagedGet<Pin>(`/boards/${board.id}/pins`)

  let downloaded = 0
  let skipped = 0
  const indexLines: string[] = []

  for (const pin of pins) {
    let filename = existingByPinId.get(pin.id)
    if (filename) {
      skipped++
    } else {
      const imageUrl = bestImageUrl(pin)
      if (!imageUrl) {
        console.log(`pin ${pin.id}: no image available (media_type ${pin.media?.media_type || "unknown"}), not downloaded`)
      } else {
        const extMatch = new URL(imageUrl).pathname.match(/\.([a-z0-9]+)$/i)
        const ext = extMatch ? extMatch[1].toLowerCase() : "jpg"
        filename = `pin-${pin.id}.${ext}`
        const res = await fetch(imageUrl)
        if (!res.ok) throw new Error(`Image download failed for pin ${pin.id}: ${res.status}`)
        writeFileSync(join(OUTPUT_DIR, filename), Buffer.from(await res.arrayBuffer()))
        existingByPinId.set(pin.id, filename)
        downloaded++
        console.log(`downloaded ${filename}`)
      }
    }

    const text = (pin.title || pin.description || "").replace(/\s+/g, " ").trim().slice(0, 120)
    indexLines.push(
      `- ${filename || "(no image)"} | https://www.pinterest.com/pin/${pin.id}/${text ? ` | ${text}` : ""}`
    )
  }

  const index = [
    `# ${board.name} (Pinterest board ${board.id})`,
    "",
    `Source: Pinterest API v5, board "${board.name}"`,
    `Last sync: ${new Date().toISOString()}`,
    "",
    ...indexLines,
    "",
  ].join("\n")
  writeFileSync(join(OUTPUT_DIR, "_index.md"), index)

  console.log("")
  console.log(`Board "${board.name}": ${pins.length} pins total`)
  console.log(`New downloads: ${downloaded}`)
  console.log(`Skipped (already downloaded): ${skipped}`)
  console.log(`Index regenerated: ${join(OUTPUT_DIR, "_index.md")}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
