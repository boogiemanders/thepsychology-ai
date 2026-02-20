import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// Test with ANON key (what the client uses)
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Service role client for comparison
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testRLS() {
  const yaelId = 'cc1fc7bc-c3ce-4b1c-99ae-25560ebb21cd'
  const andersId = 'fdd56b5d-3cae-442c-8bec-3e37d7b9afba'

  console.log('=== Testing with ANON key (no auth) ===')

  // Try to fetch Yael's profile with anon key
  const { data: yaelAnon, error: yaelAnonErr } = await anonClient
    .from('users')
    .select('id, email, subscription_tier')
    .eq('id', yaelId)
    .single()

  console.log('Yael with anon key:', yaelAnon || yaelAnonErr?.message)

  // Try to fetch Anders' profile with anon key
  const { data: andersAnon, error: andersAnonErr } = await anonClient
    .from('users')
    .select('id, email, subscription_tier')
    .eq('id', andersId)
    .single()

  console.log('Anders with anon key:', andersAnon || andersAnonErr?.message)

  console.log('\n=== Testing with SERVICE key ===')

  const { data: yaelService, error: yaelServiceErr } = await serviceClient
    .from('users')
    .select('id, email, subscription_tier')
    .eq('id', yaelId)
    .single()

  console.log('Yael with service key:', yaelService || yaelServiceErr?.message)

  const { data: andersService, error: andersServiceErr } = await serviceClient
    .from('users')
    .select('id, email, subscription_tier')
    .eq('id', andersId)
    .single()

  console.log('Anders with service key:', andersService || andersServiceErr?.message)
}

testRLS()
