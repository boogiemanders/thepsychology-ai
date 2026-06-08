// Distill the raw marketing_feedback log into the human-readable voice notebook
// (content/marketing/voice-learnings.md → "## Learned preferences"). The daily writer reads
// that file; this script keeps it current from what the founder actually asked for and approved.
//
// Run: node --env-file=.env.local --import tsx scripts/marketing/distill-learnings.ts
// (env must load before notify-slack-style import-time reads; this script avoids those, but
//  the flag keeps it consistent with the rest of the marketing scripts.)

import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"
import { config } from "dotenv"
import * as fs from "fs"
import * as path from "path"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FILE = path.join(process.cwd(), "content/marketing/voice-learnings.md")
const SECTION = "## Learned preferences"

async function main() {
  const { data: rows, error } = await supabase
    .from("marketing_feedback")
    .select("kind, feedback_text")
    .order("created_at", { ascending: false })
    .limit(60)
  if (error) throw new Error(`Read failed: ${error.message}`)

  const feedbackTexts = (rows || [])
    .filter((r) => r.kind === "feedback" && (r.feedback_text || "").trim())
    .map((r) => `- ${(r.feedback_text as string).trim()}`)
  const approvedCount = (rows || []).filter((r) => r.kind === "approved").length

  if (feedbackTexts.length === 0) {
    console.log("No feedback to distill yet.")
    return
  }

  const current = fs.readFileSync(FILE, "utf8")
  const head = current.includes(SECTION) ? current.split(SECTION)[0] : current + "\n"
  const existing = current.includes(SECTION) ? current.split(SECTION)[1].trim() : ""

  const prompt = `You maintain a writing-voice guide for a psychology education brand. Below are the founder's recent feedback notes on marketing drafts (most recent first), and the number of drafts approved as-is. Distill these into a short list of DURABLE voice preferences the writer should follow next time.

Rules:
- Output ONLY a markdown bullet list, one preference per line starting with "- ". No preamble, no headers.
- Merge repeated asks into one clear rule. Drop one-off nitpicks.
- Keep it under 12 bullets. Most important first.
- Do not restate the hard rules (no em dashes, no emojis, cite sources) — those live elsewhere.

Drafts approved as-is recently: ${approvedCount}

Recent feedback:
${feedbackTexts.join("\n")}

Current learned preferences (refine, don't discard good ones):
${existing || "(none yet)"}`

  const resp = (await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  } as any)) as any

  const text = (resp.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim()

  if (!text) {
    console.error("Model returned no text; leaving voice-learnings.md unchanged.")
    return
  }

  fs.writeFileSync(FILE, `${head}${SECTION}\n\n${text}\n`, "utf8")
  console.log(`Updated ${FILE} from ${feedbackTexts.length} feedback notes (${approvedCount} approvals).`)
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
