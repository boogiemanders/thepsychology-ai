import { NextRequest, NextResponse } from 'next/server'
import { listCaseVignetteSummaries, loadCaseVignetteById } from '@/lib/case-bank'
import { getSupabaseClient } from '@/lib/supabase-server'

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

function isProTier(tier: string | null): boolean {
  return tier === 'pro' || tier === 'pro_coaching'
}

async function resolveSubscriptionTier(request: NextRequest): Promise<string | null> {
  const token = getBearerToken(request)
  if (!token) return null

  const supabase = getSupabaseClient(
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
    { requireServiceRole: false }
  )
  if (!supabase) return null

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const tier = typeof (profile as any)?.subscription_tier === 'string' ? (profile as any).subscription_tier : null
  return tier
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')

    if (id) {
      const vignette = loadCaseVignetteById(id)
      if (!vignette) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }

      if (vignette.isPremium) {
        const tier = await resolveSubscriptionTier(request)
        if (!isProTier(tier)) {
          return NextResponse.json(
            { error: 'Pro subscription required', requiresPro: true },
            { status: 402 }
          )
        }
      }

      return NextResponse.json({ case: vignette })
    }

    const cases = listCaseVignetteSummaries()
    return NextResponse.json({ cases })
  } catch (error) {
    console.error('[case-bank] Error:', error)
    return NextResponse.json({ error: 'Failed to load case bank' }, { status: 500 })
  }
}
