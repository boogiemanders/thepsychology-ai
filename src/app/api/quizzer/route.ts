import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const QUIZZER_PROMPT = `You are an expert EPPP quiz generator. Your task is to generate exactly 10 multiple-choice questions on the given topic.

Requirements:
- 10 questions total (8 scored + 2 unscored experimental)
- 4 options per question (A, B, C, D)
- Scored questions (8): Mix of medium difficulty questions that count toward the score
- Unscored questions (2): Noticeably harder experimental questions that DO NOT count toward score
- Focus on concepts that might appear on the EPPP exam
- Include one correct answer per question
- Provide brief explanations for why the correct answer is right
- Include "relatedSections" - a list of 1-2 key concepts/section names that this question is about
  * Use specific, concise terms (3-5 words max)
  * These should be main topics or subtopics from the lesson
  * Examples: "Classical Conditioning", "Operant Conditioning", "Reinforcement Schedules"
  * Be consistent - reuse section names across multiple questions when appropriate
- Mark unscored questions with "isScored": false (these 2 questions should be the hardest)
- Mark scored questions with "isScored": true (default for all others)

Return the quiz in this exact JSON format:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation of why this is correct",
      "relatedSections": ["Main Concept", "Sub-concept"],
      "isScored": true
    }
  ]
}

IMPORTANT: Include exactly 2 questions with "isScored": false (the hardest ones). All others should have "isScored": true or omit the field (defaults to true).

Generate a quiz now. Return ONLY the JSON, no other text.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic } = body

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic required' },
        { status: 400 }
      )
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `${QUIZZER_PROMPT}\n\nTopic: ${topic}`,
        },
      ],
    })

    // Extract the text content from the response
    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    // Parse the JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse quiz JSON from response')
    }

    const quizData = JSON.parse(jsonMatch[0])

    return NextResponse.json(quizData)
  } catch (error) {
    console.error('Error generating quiz:', error)
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    )
  }
}
