import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNotificationEmail } from '@/lib/notify-email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const CRON_SECRET = process.env.CRON_SECRET

// NYSED Office of Professions verification search
const NYSED_SEARCH_URL = 'https://www.op.nysed.gov/verification-search'

type Signup = {
  id: string
  name: string
  email: string
  license_type: string
}

/**
 * Search NYSED for a person's license.
 * The name is stored as "LastName, FirstName".
 * Returns license number if found, null otherwise.
 */
async function checkNysedLicense(name: string): Promise<{ found: boolean; licenseNumber?: string; details?: string }> {
  const [lastName, firstName] = name.split(',').map(s => s.trim())
  if (!lastName || !firstName) return { found: false }

  try {
    // NYSED uses a form POST for searches
    const params = new URLSearchParams({
      op: 'Search',
      profession: '59',  // Psychology
      last_name: lastName,
      first_name: firstName,
    })

    const res = await fetch(NYSED_SEARCH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    if (!res.ok) {
      console.error(`[nysed-check] HTTP ${res.status} for ${name}`)
      return { found: false }
    }

    const html = await res.text()

    // Look for license number pattern in results (format: 0XXXXX)
    // NYSED results contain a table with license details when found
    const licenseMatch = html.match(/License(?:\s+No\.?|#)?:?\s*(\d{5,7})/i)
      || html.match(/<td[^>]*>\s*(\d{5,7})\s*<\/td>/i)

    if (licenseMatch) {
      return {
        found: true,
        licenseNumber: licenseMatch[1],
        details: `Psychology license #${licenseMatch[1]} found in NYSED database`,
      }
    }

    // Check if name appears in results at all (broader match)
    const nameInResults = html.toLowerCase().includes(lastName.toLowerCase())
      && html.toLowerCase().includes(firstName.toLowerCase())
      && html.includes('Psychology')

    if (nameInResults && !html.includes('No results found') && !html.includes('0 results')) {
      return {
        found: true,
        details: 'Name found in NYSED Psychology records (license number parsing may need update)',
      }
    }

    return { found: false }
  } catch (err) {
    console.error(`[nysed-check] Error checking ${name}:`, err)
    return { found: false }
  }
}

async function sendLicenseFoundEmail(signup: Signup, licenseNumber?: string, details?: string) {
  const [lastName, firstName] = signup.name.split(',').map(s => s.trim())
  const displayName = firstName ? `${firstName} ${lastName}` : signup.name

  const subject = `Your Psychology License Has Been Posted - ${displayName}`
  const text = [
    `Hi ${firstName || displayName},`,
    '',
    `Great news! Your psychology license has appeared in the NYSED Office of Professions database.`,
    '',
    licenseNumber ? `License Number: ${licenseNumber}` : '',
    details || '',
    '',
    `You can verify your license at:`,
    `https://www.op.nysed.gov/verification-search`,
    '',
    `Congratulations, Dr. ${lastName}!`,
    '',
    `— Dr. Chan`,
    `thePsychology.ai`,
  ].filter(Boolean).join('\n')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
      <p>Hi ${firstName || displayName},</p>
      <p><strong>Great news!</strong> Your psychology license has appeared in the NYSED Office of Professions database.</p>
      ${licenseNumber ? `<p style="background: #fef3c7; padding: 12px 16px; border-radius: 8px; font-size: 18px; font-weight: 600;">License #${licenseNumber}</p>` : ''}
      ${details ? `<p style="color: #666;">${details}</p>` : ''}
      <p>You can verify your license at:<br/>
        <a href="https://www.op.nysed.gov/verification-search" style="color: #d97706;">NYSED Verification Search</a>
      </p>
      <p>Congratulations, Dr. ${lastName}! 🎉</p>
      <p style="color: #999; margin-top: 32px;">— Dr. Chan<br/>thePsychology.ai</p>
    </div>
  `

  await sendNotificationEmail({
    subject,
    text,
    html,
    to: signup.email,
  })
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  if (CRON_SECRET && req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  // Get all active watchers
  const { data: signups, error } = await supabase
    .from('license_watch_signups')
    .select('id, name, email, license_type')
    .eq('status', 'watching')

  if (error) {
    console.error('[nysed-check] Failed to fetch signups:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!signups || signups.length === 0) {
    return NextResponse.json({ checked: 0, found: 0 })
  }

  let foundCount = 0

  for (const signup of signups) {
    const result = await checkNysedLicense(signup.name)

    if (result.found) {
      foundCount++

      // Update record
      await supabase
        .from('license_watch_signups')
        .update({
          status: 'found',
          license_number: result.licenseNumber || null,
          license_found_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', signup.id)

      // Send notification email
      try {
        await sendLicenseFoundEmail(signup, result.licenseNumber, result.details)

        await supabase
          .from('license_watch_signups')
          .update({
            status: 'notified',
            notified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', signup.id)
      } catch (emailErr) {
        console.error(`[nysed-check] Failed to email ${signup.email}:`, emailErr)
        // Status stays 'found' so we retry email next run
      }
    }

    // Rate limit: don't hammer NYSED
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log(`[nysed-check] Checked ${signups.length}, found ${foundCount}`)
  return NextResponse.json({ checked: signups.length, found: foundCount })
}
