import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const searchTerm = process.argv[2] || 'yael'

async function findUser() {
  // Search auth users
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  const matches = data.users.filter(u => {
    const email = (u.email || '').toLowerCase()
    const name = (u.user_metadata?.full_name || '').toLowerCase()
    return email.includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase())
  })

  if (matches.length > 0) {
    for (const u of matches) {
      console.log('Email:', u.email)
      console.log('ID:', u.id)
      console.log('Created:', new Date(u.created_at).toLocaleDateString())
      console.log('---')
    }
  } else {
    console.log(`No users found matching "${searchTerm}"`)
  }

  // Also check users table for more details
  const { data: profileData } = await supabase
    .from('users')
    .select('*')
    .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)

  if (profileData && profileData.length > 0) {
    console.log('\nProfile data:')
    for (const p of profileData) {
      console.log('Email:', p.email)
      console.log('Name:', p.full_name)
      console.log('Subscription:', p.subscription_tier)
      console.log('Referral:', p.referral_source)
      console.log('---')
    }
  }
}

findUser()
