import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('Applying feedback table migration...')

  const migrationPath = path.join(process.cwd(), 'supabase-migrations', 'create-feedback-table.sql')
  const sql = fs.readFileSync(migrationPath, 'utf-8')

  const { error } = await supabase.rpc('exec_sql', { sql })

  if (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }

  console.log('✅ Feedback table created successfully!')
}

applyMigration()
