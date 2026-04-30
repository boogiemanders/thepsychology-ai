import { NextRequest, NextResponse } from 'next/server'
import {
  getUserWithRole,
  getProviderProfile,
  upsertProviderProfile,
} from '@/lib/supabase-matching'

export async function GET(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserWithRole(authToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getProviderProfile(user.id)
    return NextResponse.json(profile ?? {})
  } catch (error) {
    console.error('Provider profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getUserWithRole(authToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = await upsertProviderProfile(user.id, body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Provider profile POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
