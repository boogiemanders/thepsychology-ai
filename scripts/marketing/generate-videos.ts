// Talking-head video generation for approved TikTok scripts. Run by launchd (hourly)
// or by hand. For each marketing_drafts row with type='tiktok', status='approved',
// video_status null: extract the spoken lines, generate a vertical talking-head video
// of Anders via HeyGen (avatar trained on his footage + his voice), save the mp4 to
// the Google Drive marketing folder, and mark the row 'generated'.
//
// Nothing posts anywhere — output goes to Drive for Anders's daily review.
//
// Failure policy (per founder): log it, mark video_status='failed' with the error,
// ping #social-approvals, move on. No automatic retries — reset video_status to null
// to retry a draft. A daily cap stops a bug from draining HeyGen credits.
//
// Provider note: HeyGen is isolated behind generateTalkingHeadVideo() so Seedance /
// OmniHuman can swap in later without touching the pipeline.
//
// Usage: npx tsx scripts/marketing/generate-videos.ts [--dry-run]
//
// Env (.env.local): HEYGEN_API_KEY, HEYGEN_AVATAR_ID, HEYGEN_VOICE_ID
// Optional: HEYGEN_ENGINE (default avatar_iv), VIDEO_DAILY_CAP (default 12),
// VIDEO_OUTPUT_DIR (default Drive folder)

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { extractSpokenScript, estimateDurationSeconds } from "../../src/lib/marketing/video-script"
import type { MarketingDraft } from "../../src/lib/marketing/types"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DRY_RUN = process.argv.includes("--dry-run")
const DAILY_CAP = Number(process.env.VIDEO_DAILY_CAP || 12)
const OUTPUT_DIR =
  process.env.VIDEO_OUTPUT_DIR ||
  "/Users/anderschan/Library/CloudStorage/GoogleDrive-dranders@drinzinna.com/My Drive/thepsychology.ai marketing/videos"

const HEYGEN_API = "https://api.heygen.com"
// v3 rendering engine, set via HEYGEN_ENGINE for the avatar A/B test:
//   "avatar_iv" = Avatar IV, the standard tier and the v3 default (cheapest engine
//                 documented on v3, so it is our default and the budget arm)
//   "avatar_v"  = Avatar V, the newest premium engine (more natural motion/lip-sync;
//                 the avatar must be opted in / eligible for it)
// Note: Avatar III ("avatar_iii") only exists on the old v1/v2 endpoints. The docs
// say it is not accessible via v3, so it cannot be an arm here.
// Docs: https://developers.heygen.com/models.md
const HEYGEN_ENGINE = process.env.HEYGEN_ENGINE || "avatar_iv"
const POLL_INTERVAL_MS = 15_000
const POLL_TIMEOUT_MS = 20 * 60_000 // HeyGen renders can take a while at queue peaks
// Soft sanity bound: ~90s of speech ≈ 225 words. Longer scripts still generate
// (approved text is never cut) but get a loud warning since cost scales with length.
const WARN_DURATION_SECONDS = 95

// Same ET-day convention as drip-blog.ts — the cap is per founder calendar day.
function startOfEtDayUtcIso(): string {
  const now = new Date()
  const etNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }))
  const utcNow = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }))
  const offsetMs = utcNow.getTime() - etNow.getTime()
  etNow.setHours(0, 0, 0, 0)
  return new Date(etNow.getTime() + offsetMs).toISOString()
}

function safeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

function timestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "")
    .replace("T", "-")
}

async function notifySlack(text: string): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_SOCIAL
  if (!webhook) return console.warn("[slack] SLACK_WEBHOOK_SOCIAL not set, skipping notify")
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) console.error(`[slack] notify failed: ${res.status} ${await res.text()}`)
}

// --- Provider: HeyGen ------------------------------------------------------
// Returns the URL of the rendered mp4. Throws with a descriptive message on
// any API failure (caller marks the draft failed).

// Pause control. The /v3/videos "script" field is plain text (no SSML flag in
// its schema), but /v3/voices/speech accepts SSML on this voice (verified live).
// So when a script needs pauses we render audio first with SSML <break> tags,
// then create the video from that audio_url (schema-supported lip-sync path).
// Authors can write "[pause]" or "[pause 2s]" inline; the signature line
// "Pause to think of your answer." also gets an automatic 1s thinking beat.
const SIGNATURE_PAUSE_LINE = "Pause to think of your answer."

function buildSsml(text: string): { ssml: string; hasPauses: boolean } {
  let hasPauses = false
  let esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  esc = esc.replace(/\[pause(?: ([\d.]+)s)?\]/gi, (_m, secs) => {
    hasPauses = true
    return `<break time="${secs || "1"}s"/>`
  })
  if (esc.includes(SIGNATURE_PAUSE_LINE)) {
    hasPauses = true
    esc = esc.split(SIGNATURE_PAUSE_LINE).join(`${SIGNATURE_PAUSE_LINE} <break time="1s"/>`)
  }
  // Reveal beat: "The answer is C." [pause] then the explanation.
  esc = esc.replace(/(The answer is [A-D]\.)/g, (m) => {
    hasPauses = true
    return `${m} <break time="1s"/>`
  })
  return { ssml: `<speak>${esc}</speak>`, hasPauses }
}

async function renderSsmlAudio(ssml: string, apiKey: string): Promise<string> {
  const res = await fetch(`${HEYGEN_API}/v3/voices/speech`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text: ssml, voice_id: process.env.HEYGEN_VOICE_ID, input_type: "ssml" }),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.data?.audio_url) {
    throw new Error(`HeyGen TTS (SSML) failed (${res.status}): ${JSON.stringify(body)?.slice(0, 300)}`)
  }
  return body.data.audio_url
}

async function generateTalkingHeadVideo(
  spokenText: string,
  title: string,
  idempotencyKey: string
): Promise<{ videoUrl: string; subtitleUrl: string | null }> {
  const apiKey = process.env.HEYGEN_API_KEY!
  // Scripts with pause markers go audio-first (SSML TTS -> lip-sync); plain
  // scripts use the simple text path.
  const { ssml, hasPauses } = buildSsml(spokenText)
  const audioUrl = hasPauses ? await renderSsmlAudio(ssml, apiKey) : null
  // v3 create endpoint (POST /v3/videos) replaces v2 /v2/video/generate.
  // We do NOT use the Video Agent endpoint: it rewrites scripts, and these scripts
  // are approved verbatim. The plain "script" field speaks the text as-is.
  // 1080p costs the same as 720p (only 4K is more); aspect_ratio 9:16 = vertical.
  // Idempotency-Key (the draft id) makes retries safe: HeyGen replays the original
  // response for 24h instead of rendering (and charging) twice.
  const createRes = await fetch(`${HEYGEN_API}/v3/videos`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      type: "avatar",
      title: title.slice(0, 100),
      avatar_id: process.env.HEYGEN_AVATAR_ID,
      // audio_url is mutually exclusive with script/voice_id in the v3 schema.
      ...(audioUrl
        ? { audio_url: audioUrl }
        : { voice_id: process.env.HEYGEN_VOICE_ID, script: spokenText }),
      resolution: "1080p",
      aspect_ratio: "9:16",
      engine: { type: HEYGEN_ENGINE },
      // Sidecar SRT (word timings) for the Phase 2 Remotion caption/animation layer.
      // No style key, so nothing is burned into the picture.
      caption: { file_format: "srt" },
      // Motion is per-request in v3, not stored on the avatar look. Docs:
      // https://developers.heygen.com/photo-avatar.md
      ...(process.env.HEYGEN_MOTION_PROMPT && { motion_prompt: process.env.HEYGEN_MOTION_PROMPT }),
      ...(process.env.HEYGEN_EXPRESSIVENESS && { expressiveness: process.env.HEYGEN_EXPRESSIVENESS }),
    }),
  })
  const createBody = await createRes.json().catch(() => null)
  if (!createRes.ok || !createBody?.data?.video_id) {
    throw new Error(
      `HeyGen create failed (${createRes.status}): ${JSON.stringify(createBody)?.slice(0, 400)}`
    )
  }
  const videoId: string = createBody.data.video_id

  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    const statusRes = await fetch(`${HEYGEN_API}/v3/videos/${encodeURIComponent(videoId)}`, {
      headers: { "x-api-key": apiKey },
    })
    const statusBody = await statusRes.json().catch(() => null)
    const status = statusBody?.data?.status
    if (status === "completed") {
      const url = statusBody?.data?.video_url
      if (!url) throw new Error(`HeyGen completed but no video_url (video_id=${videoId})`)
      return { videoUrl: url, subtitleUrl: statusBody?.data?.subtitle_url ?? null }
    }
    if (status === "failed") {
      const code = statusBody?.data?.failure_code ?? "unknown"
      const msg = statusBody?.data?.failure_message ?? "no failure_message"
      throw new Error(
        `HeyGen render failed (video_id=${videoId}): [${code}] ${String(msg).slice(0, 400)}`
      )
    }
    // pending | processing → keep polling
  }
  throw new Error(`HeyGen render timed out after ${POLL_TIMEOUT_MS / 60000}min (video_id=${videoId})`)
}

// ---------------------------------------------------------------------------

async function downloadTo(url: string, filePath: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (${res.status}) from HeyGen video URL`)
  writeFileSync(filePath, Buffer.from(await res.arrayBuffer()))
}

async function main() {
  for (const v of ["HEYGEN_API_KEY", "HEYGEN_AVATAR_ID", "HEYGEN_VOICE_ID"]) {
    if (!process.env[v]) {
      console.log(`${v} not set — video generation not configured yet. Nothing to do.`)
      return
    }
  }

  // Daily cap (cost guard): how many videos already generated today (ET)?
  const { count, error: countErr } = await supabase
    .from("marketing_drafts")
    .select("id", { count: "exact", head: true })
    .eq("type", "tiktok")
    .eq("video_status", "generated")
    .gte("video_generated_at", startOfEtDayUtcIso())
  if (countErr) throw new Error(`Cap count failed: ${countErr.message}`)
  const generatedToday = count ?? 0
  if (generatedToday >= DAILY_CAP) {
    console.log(`Daily cap reached (${generatedToday}/${DAILY_CAP}). Nothing to do.`)
    return
  }

  // Approved TikTok scripts with no video yet, oldest first.
  const { data, error } = await supabase
    .from("marketing_drafts")
    .select("*")
    .eq("type", "tiktok")
    .eq("status", "approved")
    .is("video_status", null)
    .order("created_at", { ascending: true })
    .limit(DAILY_CAP - generatedToday)
  if (error) throw new Error(`Select failed: ${error.message}`)

  const drafts = (data ?? []) as MarketingDraft[]
  if (drafts.length === 0) {
    console.log("No approved TikTok scripts awaiting video. Nothing to do.")
    return
  }

  console.log(`${drafts.length} script(s) to process (${generatedToday}/${DAILY_CAP} generated today).`)
  mkdirSync(OUTPUT_DIR, { recursive: true })

  let ok = 0
  let failed = 0
  for (const draft of drafts) {
    const label = `"${draft.title}" [${draft.id.slice(0, 8)}]`
    const spoken = extractSpokenScript(draft.body_md)
    const est = estimateDurationSeconds(spoken)

    if (!spoken.trim()) {
      console.error(`❌ ${label}: extractor produced an empty script — marking failed`)
      if (!DRY_RUN) {
        await supabase
          .from("marketing_drafts")
          .update({ video_status: "failed", video_error: "empty spoken script after extraction" })
          .eq("id", draft.id)
      }
      failed++
      continue
    }
    if (est > WARN_DURATION_SECONDS) {
      console.warn(`⚠️  ${label}: ~${est}s of speech (target is 30-60s) — generating anyway, cost scales with length`)
    }

    if (DRY_RUN) {
      console.log(`[dry-run] would generate ${label} (~${est}s, ${spoken.split(/\s+/).length} words)`)
      continue
    }

    try {
      console.log(`▶ Generating ${label} (~${est}s)...`)
      const { videoUrl, subtitleUrl } = await generateTalkingHeadVideo(spoken, draft.title, draft.id)
      const base = `${safeFilename(draft.title)}_${timestamp()}`
      const filePath = join(OUTPUT_DIR, `${base}.mp4`)
      await downloadTo(videoUrl, filePath)
      // Best-effort SRT alongside the mp4 (Remotion reads the word timings later).
      if (subtitleUrl) {
        try {
          await downloadTo(subtitleUrl, join(OUTPUT_DIR, `${base}.srt`))
        } catch (srtErr) {
          console.warn(`⚠️  SRT download failed for ${draft.id.slice(0, 8)}: ${(srtErr as Error).message}`)
        }
      } else {
        console.warn(`⚠️  No subtitle_url returned for ${draft.id.slice(0, 8)}`)
      }
      const { error: updErr } = await supabase
        .from("marketing_drafts")
        .update({
          video_status: "generated",
          video_path: filePath,
          video_error: null,
          video_generated_at: new Date().toISOString(),
        })
        .eq("id", draft.id)
      // mp4 is already on Drive; if the DB write fails the next run would regenerate
      // and double-spend, so stop loudly instead of moving on.
      if (updErr) {
        throw new Error(
          `Video saved (${filePath}) but DB update FAILED for ${draft.id} — mark video_status='generated' manually: ${updErr.message}`
        )
      }
      console.log(`✅ ${label} → ${filePath}`)
      ok++
    } catch (err) {
      const reason = (err as Error).message.slice(0, 500)
      console.error(`❌ ${label}: ${reason}`)
      await supabase
        .from("marketing_drafts")
        .update({ video_status: "failed", video_error: reason })
        .eq("id", draft.id)
      await notifySlack(`Video generation FAILED for ${label}: ${reason}\nReset video_status to retry.`)
      failed++
    }
  }

  if (!DRY_RUN && (ok > 0 || failed > 0)) {
    await notifySlack(
      `Video pipeline: ${ok} generated${failed ? `, ${failed} failed` : ""}. ` +
        `Ready for review in Drive → thepsychology.ai marketing/videos`
    )
  }
  console.log(`Done: ${ok} generated, ${failed} failed.`)
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
