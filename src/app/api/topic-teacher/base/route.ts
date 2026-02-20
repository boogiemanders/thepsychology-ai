import { NextRequest, NextResponse } from 'next/server'
import { loadTopicContent, stripMetaphorMarkersWithRanges } from '@/lib/topic-content-manager'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic')
  const domain = searchParams.get('domain')

  if (!topic || !domain) {
    return NextResponse.json({ error: 'Topic and domain are required.' }, { status: 400 })
  }

  const content = loadTopicContent(topic, domain)
  if (!content) {
    return NextResponse.json({ error: 'No pre-generated content found.' }, { status: 404 })
  }

  const { content: baseContent, ranges } = stripMetaphorMarkersWithRanges(content.baseContent)

  return NextResponse.json(
    {
      topicName: content.metadata?.topic_name || topic,
      baseContent,
      metaphorRanges: ranges,
      baseContentLength: baseContent.length,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
