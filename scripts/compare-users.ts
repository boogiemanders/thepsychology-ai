import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function compareUsers() {
  const yaelId = 'cc1fc7bc-c3ce-4b1c-99ae-25560ebb21cd'
  const andersId = 'fdd56b5d-3cae-442c-8bec-3e37d7b9afba'

  // Get both profiles
  const { data: yael, error: yaelErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', yaelId)
    .single()

  const { data: anders, error: andersErr } = await supabase
    .from('users')
    .select('*')
    .eq('id', andersId)
    .single()

  if (yaelErr) console.log('Yael error:', yaelErr.message)
  if (andersErr) console.log('Anders error:', andersErr.message)

  console.log('=== YAEL ===')
  console.log(JSON.stringify(yael, null, 2))

  console.log('\n=== ANDERS ===')
  console.log(JSON.stringify(anders, null, 2))

  // Compare key fields
  console.log('\n=== KEY DIFFERENCES ===')
  if (yael && anders) {
    const keys = new Set([...Object.keys(yael), ...Object.keys(anders)])
    for (const key of keys) {
      const yaelVal = (yael as any)[key]
      const andersVal = (anders as any)[key]
      if (JSON.stringify(yaelVal) !== JSON.stringify(andersVal)) {
        console.log(`${key}:`)
        console.log(`  Yael: ${JSON.stringify(yaelVal)}`)
        console.log(`  Anders: ${JSON.stringify(andersVal)}`)
      }
    }
  }

  // Check auth.users for both
  console.log('\n=== AUTH USERS ===')
  const { data: yaelAuth } = await supabase.auth.admin.getUserById(yaelId)
  const { data: andersAuth } = await supabase.auth.admin.getUserById(andersId)

  console.log('Yael auth email_confirmed_at:', yaelAuth?.user?.email_confirmed_at)
  console.log('Anders auth email_confirmed_at:', andersAuth?.user?.email_confirmed_at)
  console.log('Yael auth last_sign_in_at:', yaelAuth?.user?.last_sign_in_at)
  console.log('Anders auth last_sign_in_at:', andersAuth?.user?.last_sign_in_at)
}

compareUsers()
