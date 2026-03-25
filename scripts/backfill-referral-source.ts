import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const argLimit = Number.parseInt(process.argv[2] ?? '', 10)
const limit = Number.isFinite(argLimit) && argLimit > 0 ? argLimit : 200

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function run() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  const { data: candidates, error: fetchError } = await supabase
    .from('users')
    .select('id, email, created_at, referral_source')
    .is('referral_source', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (fetchError) throw fetchError

  if (!candidates || candidates.length === 0) {
    console.log('No users need referral_source backfill')
    return
  }

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const candidate of candidates) {
    try {
      const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(candidate.id)
      if (authUserError || !authUserData?.user) {
        errors += 1
        console.warn('Auth user lookup failed:', candidate.id, authUserError?.message)
        continue
      }

      const referralSource = asNonEmptyString(authUserData.user.user_metadata?.referral_source)
      if (!referralSource) {
        skipped += 1
        continue
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ referral_source: referralSource })
        .eq('id', candidate.id)

      if (updateError) {
        errors += 1
        console.warn('Update failed:', candidate.id, updateError.message)
        continue
      }

      updated += 1
      console.log(`Updated ${candidate.email ?? candidate.id} -> ${referralSource}`)
    } catch (error) {
      errors += 1
      console.warn('Unexpected error:', candidate.id, error)
    }
  }

  console.log(
    JSON.stringify(
      {
        scanned: candidates.length,
        updated,
        skipped,
        errors,
      },
      null,
      2
    )
  )
}

run().catch((error) => {
  console.error('Backfill failed:', error)
  process.exit(1)
})
