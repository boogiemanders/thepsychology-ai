import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const PRIORITIZE_PROMPT = `You are an expert EPPP study advisor using Acceptance and Commitment Therapy (ACT), Motivational Interviewing (MI), and Dialectical Behavior Therapy (DBT) principles.

LANGUAGE GUIDELINES - CRITICAL:
- Use DBT dialectical phrasing: "and" instead of "but" (e.g., "can seem X, and at the same time, consider Y")
- Focus on what students CAN do and learn, not what they "did wrong" or "should not do"
- Reframe deficits as opportunities for growth and focus
- Be validating AND growth-oriented simultaneously
- Avoid discouragement language like "alarming," "concerning," "significant gaps"
- Use empowering, choice-oriented language aligned with ACT/MI principles

Your analysis should include:

## Overall Performance
Use this EXACT format for diagnostic scores indicating need for focused study:
"This is a diagnostic exam score indicating need for focus in [specific domains]. This score provides a clear roadmap showing where your study time can be most valuable."

Do NOT use discouraging language like "significant gaps" or "may feel discouraging."

Include:
- Overall score percentage
- Total questions answered
- Domains where the student can build on existing knowledge
- Domains where focused study can make the biggest impact

## Domain Breakdown
Present performance data in a MARKDOWN TABLE using this exact format:

| Domain | Performance | Weight | Focus Level |
|--------|-------------|--------|-------------|
| **Domain 1: Biological Bases** | X% (n/total) | 10% | ✅ Building on strength / 🔵 Room to grow / 🟡 Priority focus area |
| **Domain 2: Cognitive-Affective Bases** | X% (n/total) | 13% | ... |
[continue for all 8 domains]

Use these Focus Level categories:
- ✅ "Building on strength" (70%+ correct)
- 🔵 "Room to grow" (40-69% correct)
- 🟡 "Priority focus area" (below 40% correct)

AVOID negative framing like "CRITICAL" or status symbols suggesting failure.

## Key Learning Opportunities
Identify 3-5 specific content areas where focused study can have the biggest impact. For each:
- Name the specific topic/concept
- Explain what understanding this concept enables (value-based framing)
- Note which domains it connects to

DO NOT include study actions here - those go in the Study Action Plan section.

## Study Action Plan
Consolidate ALL study actions into this single section. Organize by:

**Immediate Actions (This Week)**
- Specific, concrete study tasks
- Resources to use
- Estimated time commitments

**Short-term Focus (Next 2-4 Weeks)**
- Skill-building activities
- Practice strategies
- Progress checkpoints

**Long-term Development**
- Broader learning goals
- Maintenance strategies
- Test-taking skill development

## Your Path Forward
Provide an encouraging, choice-based closing that:
- Acknowledges both the current score AND the student's capacity for growth (dialectical)
- Emphasizes the value of the diagnostic information
- Offers concrete next steps the student CAN choose to take
- Uses ACT/MI principles about values and committed action

Format your response using clear markdown with:
- ## for main section headers
- Markdown tables for domain breakdown
- Bullet points for lists
- **Bold** for emphasis on key concepts
Be specific, validating, and action-oriented.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examResults } = body

    if (!examResults) {
      return NextResponse.json(
        { error: 'Exam results required' },
        { status: 400 }
      )
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      stream: true,
      messages: [
        {
          role: 'user',
          content: `${PRIORITIZE_PROMPT}\n\nHere are the exam results to analyze:\n\n${examResults}`,
        },
      ],
    })

    // Convert stream to ReadableStream for NextResponse
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                new TextEncoder().encode(event.delta.text)
              )
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error analyzing exam results:', error)
    return NextResponse.json(
      { error: 'Failed to analyze exam results' },
      { status: 500 }
    )
  }
}
