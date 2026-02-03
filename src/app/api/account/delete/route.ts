import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

async function requireAuthedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null

  if (!token) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user?.id) return null
  return data.user.id
}

export async function POST(req: NextRequest) {
  const userId = await requireAuthedUserId(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Step 1: Cancel any active Stripe subscription
    if (stripe && user.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active',
          limit: 10,
        })

        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id)
          console.log('[Account Delete] Cancelled subscription:', subscription.id)
        }
      } catch (stripeError) {
        console.error('[Account Delete] Error cancelling Stripe subscriptions:', stripeError)
        // Continue with account deletion even if Stripe fails
      }
    }

    // Step 2: Mark account as deleted (set deleted_at timestamp)
    // Keep all user data for potential recovery or legal requirements
    const { error: updateError } = await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        subscription_tier: 'free',
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[Account Delete] Error marking account as deleted:', updateError)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    // Step 3: Delete the auth user (this will sign them out)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('[Account Delete] Error deleting auth user:', authDeleteError)
      // Account is already marked as deleted, so we can still return success
    }

    console.log('[Account Delete] Account deleted successfully:', {
      userId,
      email: user.email,
    })

    return NextResponse.json({
      success: true,
      message: 'Account has been deleted. Your study data has been preserved.',
    })
  } catch (error) {
    console.error('[Account Delete] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
