import { JWT } from 'google-auth-library'

type ScopeName = 'EVENT' | 'USER' | 'ITEM'

interface CustomDimension {
  parameterName: string
  displayName: string
  scope: ScopeName
  description?: string
}

const DIMENSIONS: CustomDimension[] = [
  { parameterName: 'utm_campaign', displayName: 'UTM Campaign', scope: 'EVENT', description: 'Captured from event params; first-touch attribution' },
  { parameterName: 'utm_source',   displayName: 'UTM Source',   scope: 'EVENT', description: 'Captured from event params; first-touch attribution' },
  { parameterName: 'utm_medium',   displayName: 'UTM Medium',   scope: 'EVENT', description: 'Captured from event params; first-touch attribution' },
  { parameterName: 'utm_content',  displayName: 'UTM Content',  scope: 'EVENT', description: 'Captured from event params; first-touch attribution' },
  { parameterName: 'utm_term',     displayName: 'UTM Term',     scope: 'EVENT', description: 'Captured from event params; first-touch attribution' },
]

function loadCreds(): { client_email: string; private_key: string } {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set')
  try {
    const parsed = JSON.parse(raw)
    if (parsed.client_email && parsed.private_key) return parsed
  } catch {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8')
    const parsed = JSON.parse(decoded)
    if (parsed.client_email && parsed.private_key) return parsed
  }
  throw new Error('Could not parse GOOGLE_SERVICE_ACCOUNT_KEY')
}

async function getAccessToken(): Promise<string> {
  const creds = loadCreds()
  const client = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.edit'],
  })
  const token = await client.getAccessToken()
  if (!token.token) throw new Error('Failed to obtain access token')
  return token.token
}

async function listExisting(propertyId: string, accessToken: string): Promise<Set<string>> {
  const url = `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}/customDimensions?pageSize=200`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`List failed (${res.status}): ${body}`)
  }
  const json = await res.json() as { customDimensions?: Array<{ parameterName: string }> }
  return new Set((json.customDimensions || []).map((d) => d.parameterName))
}

async function createOne(propertyId: string, accessToken: string, dim: CustomDimension): Promise<void> {
  const url = `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}/customDimensions`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(dim),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Create ${dim.parameterName} failed (${res.status}): ${body}`)
  }
}

async function main() {
  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) throw new Error('GA4_PROPERTY_ID not set')

  const accessToken = await getAccessToken()
  console.log(`Property: properties/${propertyId}`)

  const existing = await listExisting(propertyId, accessToken)
  console.log(`Existing custom dimensions: ${existing.size > 0 ? Array.from(existing).join(', ') : '(none)'}`)

  for (const dim of DIMENSIONS) {
    if (existing.has(dim.parameterName)) {
      console.log(`  skip   ${dim.parameterName} (already registered)`)
      continue
    }
    try {
      await createOne(propertyId, accessToken, dim)
      console.log(`  create ${dim.parameterName} -> "${dim.displayName}"`)
    } catch (err) {
      console.error(`  FAIL   ${dim.parameterName}: ${(err as Error).message}`)
      throw err
    }
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('\nFailed.')
  console.error(err?.message || err)
  process.exit(1)
})
