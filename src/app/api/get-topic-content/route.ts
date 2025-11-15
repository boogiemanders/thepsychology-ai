import { NextRequest, NextResponse } from 'next/server'
import { loadTopicContent, topicContentExists } from '@/lib/topic-content-manager'

/**
 * GET /api/get-topic-content
 * Fetches pre-generated topic content from filesystem
 * Query params: topicName, domain
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicName = searchParams.get('topicName')
    const domain = searchParams.get('domain')

    if (!topicName || !domain) {
      return NextResponse.json(
        { error: 'Missing topicName or domain query parameters' },
        { status: 400 }
      )
    }

    // Check if pre-generated content exists
    if (!topicContentExists(topicName, domain)) {
      console.warn(`Pre-generated content not found for topic: ${topicName}`)
      return NextResponse.json(
        {
          error: 'Topic content not found',
          message: 'Pre-generated content for this topic is not available. Please run the generation script.',
        },
        { status: 404 }
      )
    }

    // Load the content
    const content = loadTopicContent(topicName, domain)

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to load topic content' },
        { status: 500 }
      )
    }

    console.log(`[Get Topic] Loaded ${topicName} from filesystem`)

    return NextResponse.json({
      success: true,
      metadata: content.metadata,
      baseContent: content.baseContent,
      content: content.content,
    })
  } catch (error) {
    console.error('[Get Topic] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch topic content',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
