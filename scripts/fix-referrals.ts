import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkAndFix() {
  // Check current Afumi records
  const { data, error } = await supabase
    .from('users')
    .select('id, email, referral_source, created_at')
    .eq('referral_source', 'Afumi')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log('Users with Afumi referral:')
  for (const u of data || []) {
    console.log(`${u.email} - ${new Date(u.created_at).toLocaleDateString()} - ID: ${u.id}`)
  }

  // The first one was originally "Anders!", change it back
  if (data && data.length >= 2) {
    const firstUser = data[0]
    console.log(`\nChanging first user (${firstUser.email}) back to Anders!`)

    const { error: updateError } = await supabase
      .from('users')
      .update({ referral_source: 'Anders!' })
      .eq('id', firstUser.id)

    if (updateError) {
      console.error('Update error:', updateError.message)
    } else {
      console.log('Done!')
    }
  }
}

checkAndFix()
