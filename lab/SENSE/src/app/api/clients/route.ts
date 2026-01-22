import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { sessions: true }
        }
      }
    })
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Failed to fetch clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, age, settingDefault } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const client = await prisma.client.create({
      data: {
        name,
        age: age ? parseInt(age) : null,
        settingDefault: settingDefault || null,
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Failed to create client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
