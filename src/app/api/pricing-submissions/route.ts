import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

interface PricingFormData {
  email: string
  phone: string
  testDate: string
  thoughtsGoalsQuestions: string
  tier: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PricingFormData = await request.json()

    // Validate required fields
    if (!body.email || !body.tier) {
      return NextResponse.json(
        { error: 'Email and tier are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Map tier names to subscription tiers
    const tierMap: { [key: string]: string } = {
      '7-Day Free Trial': 'free',
      'Pro': 'pro',
      'Pro + Coaching': 'premium',
    }

    const subscriptionTier = tierMap[body.tier] || 'free'

    // Insert into Supabase
    const { data, error } = await supabase
      .from('pricing_submissions')
      .insert([
        {
          email: body.email,
          phone: body.phone || null,
          test_date: body.testDate || null,
          thoughts_goals_questions: body.thoughtsGoalsQuestions || null,
          tier: body.tier,
          subscription_tier: subscriptionTier,
        },
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: data,
        message: 'Submission received. Please sign up or log in with your email to get started.',
        redirectUrl: '/auth/signup?email=' + encodeURIComponent(body.email) + '&tier=' + encodeURIComponent(subscriptionTier)
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
