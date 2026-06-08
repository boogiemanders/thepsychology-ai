// List the rewrite queue: pending Feedback submissions (marketing_feedback rows with
// processed_at = null) joined to the original draft they target. The feedback-rewrite
// routine reads this JSON, rewrites each draft on the founder's subscription, then runs
// submit-rewrite.ts to post the new card and mark the row processed.
//
// Run: node --env-file=.env.local --import tsx scripts/marketing/list-pending-feedback.ts

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

config({ path: ".env.local" })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: pending, error } = await supabase
    .from("marketing_feedback")
    .select("id, draft_id, feedback_text, created_by, created_at")
    .eq("kind", "feedback")
    .is("processed_at", null)
    .order("created_at", { ascending: true })
  if (error) throw new Error(`Read failed: ${error.message}`)

  const out: unknown[] = []
  for (const fb of pending || []) {
    const { data: d } = await supabase
      .from("marketing_drafts")
      .select("id, type, topic, title, slug, body_md, frontmatter, sources, seo")
      .eq("id", fb.draft_id)
      .single()
    if (!d) continue // original draft is gone; skip
    out.push({
      feedback_id: fb.id,
      feedback_text: fb.feedback_text,
      requested_by: fb.created_by,
      requested_at: fb.created_at,
      original: d,
    })
  }

  console.log(JSON.stringify(out, null, 2))
}

main().catch((err) => {
  console.error("❌", err.message)
  process.exit(1)
})
