import { NextRequest, NextResponse } from 'next/server'
import {
  getUserWithRole,
  hasRole,
  getClientIntake,
  upsertClientIntake,
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

    if (!hasRole(user, 'client')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const intake = await getClientIntake(user.id)
    return NextResponse.json(intake ?? {})
  } catch (error) {
    console.error('Client intake GET error:', error)
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

    if (!hasRole(user, 'client')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const result = await upsertClientIntake(user.id, body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Client intake POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
