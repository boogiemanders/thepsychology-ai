import { NextResponse } from 'next/server'
import { sendSlackNotification } from '@/lib/notify-slack'

export async function POST(request: Request) {
  try {
    const { tierName, section } = await request.json()

    const message = `📊 *Mini Pricing Bar Click*\n• Tier: ${tierName}\n• Section viewed: ${section}`

    await sendSlackNotification(message, 'metrics')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[track-mini-pricing-click] Error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
