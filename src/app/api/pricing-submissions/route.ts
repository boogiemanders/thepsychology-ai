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
      { success: true, data: data },
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
