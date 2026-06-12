// Talking-head video generation for approved TikTok scripts. Run by launchd (hourly)
// or by hand. For each marketing_drafts row with type='tiktok', status='approved',
// video_status null: extract the spoken lines, generate a vertical talking-head video
// of Anders via HeyGen (avatar trained on his footage + his voice), save the mp4 to
// the Google Drive marketing folder, and mark the row 'generated'. Then a local
// Remotion pass (video-overlay/) composites captions + the question card and saves
// the deliverable next to the raw mp4 as <name>_final.mp4 (see renderOverlay).
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
import { execFileSync } from "child_process"
import { config } from "dotenv"
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join, resolve } from "path"
import {
  extractSpokenScript,
  estimateDurationSeconds,
  parsePracticeQuestion,
} from "../../src/lib/marketing/video-script"
import type { AnimationCue, MarketingDraft } from "../../src/lib/marketing/types"

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

// --- Post-render: Remotion overlay (captions + question card) ----------------
// Composites the final deliverable over the raw HeyGen mp4: chunked captions,
// plus a floating question card when the script parses as a practice question.
// Runs after the raw video is on Drive and the DB row says 'generated', so an
// overlay failure only costs the final cut, never the draft (caller catches).
// Exported so a final can be re-rendered by hand without touching HeyGen.

const OVERLAY_DIR = resolve(__dirname, "../../video-overlay")

// Every generated illustration cue shares the brand drawing style; the cue's
// prompt only describes WHAT to draw.
const ILLUSTRATION_STYLE_PREFIX =
  "Hand-drawn editorial line illustration, loose confident ink strokes, minimal color " +
  "with warm coral accents on dark charcoal background, in the style of calm " +
  "tech-explainer visuals. No text in the image. "

async function generateIllustration(prompt: string, outPath: string): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY not set")
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: ILLUSTRATION_STYLE_PREFIX + prompt,
      size: "1024x1024",
    }),
  })
  const body = await res.json().catch(() => null)
  const b64 = body?.data?.[0]?.b64_json
  if (!res.ok || !b64) {
    throw new Error(
      `OpenAI image generation failed (${res.status}): ${JSON.stringify(body)?.slice(0, 300)}`
    )
  }
  writeFileSync(outPath, Buffer.from(b64, "base64"))
}

// Illustration cues authored as { prompt } need their art generated before the
// render; the cue is rewritten to { image } pointing into public/. A failed
// generation skips just that cue (warn + continue) — the render still happens.
// Returns the resolved cue list plus the generated files (deleted after render
// like the job mp4/srt).
async function resolveAnimationCues(
  cues: AnimationCue[],
  draftId: string
): Promise<{ cues: AnimationCue[]; generatedFiles: string[] }> {
  const resolved: AnimationCue[] = []
  const generatedFiles: string[] = []
  let n = 0
  for (const cue of cues) {
    const prompt = cue.payload?.prompt
    if (cue.type === "illustration" && !cue.payload?.image && typeof prompt === "string") {
      n++
      const rel = `illustrations/${draftId.slice(0, 8)}-${n}.png`
      const abs = join(OVERLAY_DIR, "public", rel)
      try {
        mkdirSync(join(OVERLAY_DIR, "public", "illustrations"), { recursive: true })
        await generateIllustration(prompt, abs)
        generatedFiles.push(abs)
        resolved.push({ ...cue, payload: { ...cue.payload, image: rel } })
      } catch (err) {
        console.warn(
          `⚠️  illustration cue "${cue.trigger}" skipped: ${(err as Error).message.slice(0, 300)}`
        )
      }
    } else {
      resolved.push(cue)
    }
  }
  return { cues: resolved, generatedFiles }
}

export async function renderOverlay(
  mp4Path: string,
  srtPath: string,
  draft: MarketingDraft
): Promise<string> {
  // The launchd automation checkout (~/thepsychology-ai-marketing) resets via
  // git, so video-overlay/node_modules may not exist on a first run there.
  if (!existsSync(join(OVERLAY_DIR, "node_modules"))) {
    console.log("[overlay] node_modules missing, running npm install in video-overlay/")
    execFileSync("npm", ["install", "--silent"], { cwd: OVERLAY_DIR, stdio: "inherit" })
  }

  // Remotion can only read inputs from public/. Per-draft job names keep
  // parallel runs from clobbering each other's files.
  const jobId = `job-${draft.id.slice(0, 8)}`
  const jobMp4 = join(OVERLAY_DIR, "public", `${jobId}.mp4`)
  const jobSrt = join(OVERLAY_DIR, "public", `${jobId}.srt`)
  const tmpOut = join(tmpdir(), `${jobId}-final.mp4`)
  copyFileSync(mp4Path, jobMp4)
  copyFileSync(srtPath, jobSrt)

  // animation_cues only exists on the row once the 20260611 migration ran.
  const { cues: animationCues, generatedFiles } = await resolveAnimationCues(
    draft.animation_cues ?? [],
    draft.id
  )

  try {
    const parsed = parsePracticeQuestion(extractSpokenScript(draft.body_md))
    // Founder-standing rule: every practice-question script opens on the
    // "psychology licensure exam" hook line, so every one of those videos
    // gets the founder's hand-drawn studying artwork there (white panel,
    // gentle bob — see AnimatedArt). Draft-authored cues come after; the
    // cue windowing in PracticeQuestion.tsx already prevents overlap
    // stacking (an earlier cue hands off when the next one starts).
    const standingCues: AnimationCue[] = parsed
      ? [
          {
            trigger: "psychology licensure exam",
            type: "art",
            payload: { image: "art/studying.png" },
          },
        ]
      : []
    const props = {
      videoFile: `${jobId}.mp4`,
      srtFile: `${jobId}.srt`,
      captionStyle: "clean",
      captionBottomPercent: 32,
      questionStem: parsed?.stem ?? "",
      choices: parsed?.choices ?? [],
      animationCues: [...standingCues, ...animationCues],
    }
    // execFileSync with an arg array bypasses the shell, so the JSON (quotes,
    // apostrophes in stems) needs no escaping.
    execFileSync(
      "npx",
      ["remotion", "render", "PracticeQuestion", tmpOut, `--props=${JSON.stringify(props)}`],
      { cwd: OVERLAY_DIR, stdio: "inherit" }
    )
    const finalPath = mp4Path.replace(/\.mp4$/, "_final.mp4")
    copyFileSync(tmpOut, finalPath)
    return finalPath
  } finally {
    for (const f of [jobMp4, jobSrt, tmpOut, ...generatedFiles]) rmSync(f, { force: true })
  }
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
  let finals = 0
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

      // Final cut. Raw mp4 + DB row are already in place above, so a Remotion
      // failure must not mark the draft failed: log, ping Slack, move on.
      const srtPath = join(OUTPUT_DIR, `${base}.srt`)
      if (!existsSync(srtPath)) {
        console.warn(`⚠️  ${label}: no SRT on Drive, skipping overlay (captions impossible)`)
      } else {
        try {
          const finalPath = await renderOverlay(filePath, srtPath, draft)
          console.log(`✅ ${label} final → ${finalPath}`)
          finals++
        } catch (overlayErr) {
          const reason = (overlayErr as Error).message.slice(0, 500)
          console.error(`❌ ${label}: overlay render failed: ${reason}`)
          // .catch guard: a Slack outage here would otherwise bubble to the
          // outer catch and wrongly mark a generated draft as failed.
          await notifySlack(
            `Overlay render failed for ${label}, raw video is in Drive: ${reason}`
          ).catch((e) => console.error(`[slack] ${(e as Error).message}`))
        }
      }
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
      `Video pipeline: ${ok} generated${finals ? ` (${finals} final cut${finals === 1 ? "" : "s"} with captions)` : ""}${failed ? `, ${failed} failed` : ""}. ` +
        `Ready for review in Drive → thepsychology.ai marketing/videos`
    )
  }
  console.log(`Done: ${ok} generated, ${finals} finals, ${failed} failed.`)
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
