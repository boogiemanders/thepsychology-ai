// Persist one generated draft: insert into marketing_drafts, write the Obsidian
// note (#mktg) into content/marketing/<date>/, and post it to Slack for approval.
//
// Usage: npx tsx scripts/marketing/submit-draft.ts path/to/draft.json
// The JSON file matches the DraftInput shape in src/lib/marketing/types.ts.

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

function loadInput(): DraftInput {
  const file = process.argv[2]
  if (!file) throw new Error("Pass a path to a draft JSON file")
  return JSON.parse(fs.readFileSync(file, "utf8")) as DraftInput
}

async function main() {
  const input = loadInput()

  if (!input.type || !input.topic || !input.title || !input.body_md) {
    throw new Error("Draft missing required fields (type, topic, title, body_md)")
  }
  if (!Array.isArray(input.sources) || input.sources.length === 0) {
    throw new Error("Draft has no sources — every claim must trace to a source")
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

  const { data, error } = await supabase
    .from("marketing_drafts")
    .insert(insert)
    .select("*")
    .single()

  if (error) throw new Error(`Insert failed: ${error.message}`)
  const draft = data as MarketingDraft

  // Write the Obsidian note. Defaults to the repo (cloud-safe). For LOCAL runs, set
  // MARKETING_NOTES_DIR to your Obsidian vault path so notes land straight in Obsidian,
  // e.g. "/Users/anderschan/Library/Mobile Documents/iCloud~md~obsidian/Documents/Claude Code/inbox".
  const date = draft.created_at.slice(0, 10)
  const baseDir = process.env.MARKETING_NOTES_DIR || path.join(process.cwd(), "content/marketing")
  const dir = path.join(baseDir, date)
  fs.mkdirSync(dir, { recursive: true })
  const noteName = `${draft.type}-${slug || slugify(draft.title)}-${draft.id.slice(0, 8)}.md`
  fs.writeFileSync(path.join(dir, noteName), buildObsidianNote(draft), "utf8")

  // Post to #social-approvals for review (via SLACK_WEBHOOK_SOCIAL). The draft and
  // note are already saved above, so a Slack failure is recoverable. But it must NOT
  // be silent: exit non-zero so the scheduled routine surfaces it instead of
  // reporting a false success when the webhook is missing or returns non-ok.
  try {
    await postDraftForApproval(draft)
  } catch (err) {
    console.error(
      `❌ Saved ${draft.type} "${draft.title}" [${draft.id.slice(0, 8)}] but SLACK POST FAILED: ${(err as Error).message}`
    )
    process.exit(1)
  }

  console.log(`Saved ${draft.type} "${draft.title}" [${draft.id.slice(0, 8)}] · posted to Slack`)
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
