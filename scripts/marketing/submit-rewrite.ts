// Close the loop on one feedback-driven rewrite: insert the rewritten draft (status pending),
// write its Obsidian note, post a fresh approval card to #social-approvals, and mark the
// originating marketing_feedback row processed (records new_draft_id + rewritten_body).
// The creative rewrite is done by the feedback-rewrite routine (on the founder's subscription);
// this script only does the deterministic DB + Slack work.
//
// Input JSON (matches DraftInput + a feedback_id):
//   { "feedback_id": "<uuid>", "type": "...", "topic": "...", "title": "...", "slug"?: "...",
//     "body_md": "...", "frontmatter"?: {...}, "sources": [{title,url}], "seo"?: {...},
//     "needs_review"?: bool, "review_notes"?: "..." }
//
// Run: node --env-file=.env.local --import tsx scripts/marketing/submit-rewrite.ts path/to/rewrite.json

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import * as fs from "fs"
import * as path from "path"
import { slugify, buildObsidianNote } from "../../src/lib/marketing/format"
import { postDraftForApproval } from "../../src/lib/marketing/slack"
import type { DraftInput, MarketingDraft } from "../../src/lib/marketing/types"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type RewriteInput = DraftInput & { feedback_id: string }

function loadInput(): RewriteInput {
  const file = process.argv[2]
  if (!file) throw new Error("Pass a path to a rewrite JSON file")
  return JSON.parse(fs.readFileSync(file, "utf8")) as RewriteInput
}

async function main() {
  const input = loadInput()

  if (!input.feedback_id) throw new Error("Rewrite missing feedback_id")
  if (!input.type || !input.topic || !input.title || !input.body_md) {
    throw new Error("Rewrite missing required fields (type, topic, title, body_md)")
  }
  if (!Array.isArray(input.sources) || input.sources.length === 0) {
    throw new Error("Rewrite has no sources — every claim must trace to a source")
  }

  const slug = input.type === "blog" ? input.slug || slugify(input.frontmatter?.title || input.title) : null

  const insert = {
    type: input.type,
    topic: input.topic,
    title: input.title,
    slug,
    body_md: input.body_md,
    frontmatter: input.frontmatter || {},
    sources: input.sources,
    seo: input.seo || {},
    status: "pending" as const,
    needs_review: input.needs_review ?? false,
    review_notes: input.review_notes ?? null,
  }

  const { data, error } = await supabase.from("marketing_drafts").insert(insert).select("*").single()
  if (error) throw new Error(`Insert failed: ${error.message}`)
  const draft = data as MarketingDraft

  // Obsidian note (same pattern as submit-draft.ts; cloud-safe default to the repo).
  const date = draft.created_at.slice(0, 10)
  const baseDir = process.env.MARKETING_NOTES_DIR || path.join(process.cwd(), "content/marketing")
  const dir = path.join(baseDir, date)
  fs.mkdirSync(dir, { recursive: true })
  const noteName = `${draft.type}-${slug || slugify(draft.title)}-${draft.id.slice(0, 8)}.md`
  fs.writeFileSync(path.join(dir, noteName), buildObsidianNote(draft), "utf8")

  // Post the fresh approval card.
  let slackInfo = ""
  try {
    await postDraftForApproval(draft)
    slackInfo = " · posted to Slack"
  } catch (err) {
    slackInfo = ` · Slack post skipped: ${(err as Error).message}`
  }

  // Mark the feedback row processed and link the rewrite.
  const { error: updErr } = await supabase
    .from("marketing_feedback")
    .update({ processed_at: new Date().toISOString(), new_draft_id: draft.id, rewritten_body: draft.body_md })
    .eq("id", input.feedback_id)
  if (updErr) console.error(`⚠️  feedback row not marked processed: ${updErr.message}`)

  console.log(`Rewrote into ${draft.type} "${draft.title}" [${draft.id.slice(0, 8)}]${slackInfo}`)
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
