import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get email from command line argument
const EMAIL_TO_FIX = process.argv[2]

if (!EMAIL_TO_FIX) {
  console.error('Usage: npx tsx scripts/fix-orphaned-user.ts <email>')
  console.error('       npx tsx scripts/fix-orphaned-user.ts --list-orphans')
  console.error('       npx tsx scripts/fix-orphaned-user.ts --fix-all')
  console.error('')
  console.error('Examples:')
  console.error('  npx tsx scripts/fix-orphaned-user.ts user@example.com  # Fix single user')
  console.error('  npx tsx scripts/fix-orphaned-user.ts --list-orphans    # List all orphaned users')
  console.error('  npx tsx scripts/fix-orphaned-user.ts --fix-all         # Fix all orphaned users')
  process.exit(1)
}

async function getOrphanedUsers() {
  // Get all auth users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) {
    console.error('Failed to list auth users:', authError.message)
    process.exit(1)
  }

  // Get all public.users
  const { data: publicUsers, error: publicError } = await supabase.from('users').select('id, email')
  if (publicError) {
    console.error('Failed to list public users:', publicError.message)
    process.exit(1)
  }

  const publicUserIds = new Set(publicUsers?.map(u => u.id) || [])
  return authData.users.filter(u => !publicUserIds.has(u.id))
}

async function listOrphanedUsers() {
  console.log('Finding orphaned users (in auth but not in public.users)...\n')

  const orphanedUsers = await getOrphanedUsers()

  if (orphanedUsers.length === 0) {
    console.log('✅ No orphaned users found!')
    return
  }

  console.log(`Found ${orphanedUsers.length} orphaned user(s):\n`)
  for (const user of orphanedUsers) {
    console.log(`  - ${user.email} (ID: ${user.id})`)
    console.log(`    Created: ${user.created_at}`)
    console.log('')
  }

  console.log('To fix, run:')
  console.log('  npx tsx scripts/fix-orphaned-user.ts <email>')
  console.log('  npx tsx scripts/fix-orphaned-user.ts --fix-all')
}

async function fixAllOrphanedUsers() {
  console.log('Fixing all orphaned users...\n')

  const orphanedUsers = await getOrphanedUsers()

  if (orphanedUsers.length === 0) {
    console.log('✅ No orphaned users to fix!')
    return
  }

  console.log(`Found ${orphanedUsers.length} orphaned user(s) to fix.\n`)

  let fixed = 0
  let failed = 0

  for (const user of orphanedUsers) {
    process.stdout.write(`Fixing ${user.email}... `)

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        full_name: null,
        subscription_tier: 'pro',
        subscription_started_at: new Date().toISOString(),
      })

    if (insertError) {
      console.log(`❌ ${insertError.message}`)
      failed++
    } else {
      console.log('✅')
      fixed++
    }
  }

  console.log(`\nDone! Fixed: ${fixed}, Failed: ${failed}`)
}

async function fixOrphanedUser() {
  console.log(`Fixing orphaned user: ${EMAIL_TO_FIX}`)

  // 1. Get the user's UUID from auth.users
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('Failed to list users:', listError.message)
    process.exit(1)
  }

  const authUser = listData.users.find(u => u.email === EMAIL_TO_FIX)

  if (!authUser) {
    console.error(`User not found in auth.users: ${EMAIL_TO_FIX}`)
    process.exit(1)
  }

  const userId = authUser.id
  console.log(`Found auth user with ID: ${userId}`)

  // 2. Check if user already exists in public.users
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', userId)
    .single()

  if (existingUser) {
    console.log('User already exists in public.users table:')
    console.log(existingUser)
    process.exit(0)
  }

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking for existing user:', checkError)
    process.exit(1)
  }

  // 3. Insert the user into public.users
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: EMAIL_TO_FIX,
      full_name: null,
      subscription_tier: 'pro',
      subscription_started_at: new Date().toISOString(),
    })
    .select()

  if (insertError) {
    console.error('Failed to insert user:', insertError)
    process.exit(1)
  }

  console.log('✅ Successfully created user profile:')
  console.log(newUser)
}

// Run the appropriate command
if (EMAIL_TO_FIX === '--list-orphans') {
  listOrphanedUsers()
} else if (EMAIL_TO_FIX === '--fix-all') {
  fixAllOrphanedUsers()
} else {
  fixOrphanedUser()
}
