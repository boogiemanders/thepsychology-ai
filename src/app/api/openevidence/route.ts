import { NextRequest, NextResponse } from 'next/server'
import { getOpenEvidenceClient, OpenEvidenceMessage } from '@/lib/openevidence'
import { logUsageEvent } from '@/lib/usage-events'
import { checkSubscriptionAccess } from '@/lib/subscription-server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const OPENEVIDENCE_MODEL = 'openevidence'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, userId } = body as {
      messages: OpenEvidenceMessage[]
      userId?: string
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      )
    }

    // Check subscription access
    if (userId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const access = await checkSubscriptionAccess(supabase, userId)
      if (!access.hasAccess) {
        return NextResponse.json(
          { error: 'Subscription required' },
          { status: 403 }
        )
      }
    }

    const client = getOpenEvidenceClient()

    const stream = await client.chat.completions.create({
      model: OPENEVIDENCE_MODEL,
      messages,
      stream: true,
    })

    await logUsageEvent({
      userId: typeof userId === 'string' ? userId : null,
      eventName: 'openevidence.chat',
      endpoint: '/api/openevidence',
      model: OPENEVIDENCE_MODEL,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content
            if (delta) {
              controller.enqueue(encoder.encode(delta))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'OPENEVIDENCE_API_KEY is not set') {
      return NextResponse.json(
        { error: 'OpenEvidence API is not configured' },
        { status: 503 }
      )
    }
    console.error('[openevidence] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
