import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIApiKey } from '@/lib/openai-api-key'

const MODEL = 'gpt-4o-mini'

function buildPrompt(text: string, targetVariant: string): string {
  const variant = targetVariant === 'traditional' ? 'Traditional Chinese' : 'Simplified Chinese'
  return [
    `Translate the English text into natural ${variant}.`,
    'Rules:',
    '- Preserve tone and emotional intent.',
    '- Output only the translation.',
    '- Do not add pinyin, notes, explanations, or quotation marks unless the source requires them.',
    '',
    `English text: ${text}`,
  ].join('\n')
}

function cleanTranslation(value: string): string {
  return value
    .trim()
    .replace(/^["'\u201c\u201d]+|["'\u201c\u201d]+$/g, '')
    .replace(/^(translation|chinese)\s*:\s*/i, '')
    .trim()
}

export async function POST(request: NextRequest) {
  const apiKey = getOpenAIApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured.' }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const text = String(body.text || '').trim()
  const targetVariant = String(body.targetVariant || 'simplified')

  if (text.length < 2) {
    return NextResponse.json({ error: 'Enter more text before translating.' }, { status: 400 })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      messages: [{ role: 'user', content: buildPrompt(text, targetVariant) }],
    }),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => 'Translation failed.')
    return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: 502 })
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content || ''

  return NextResponse.json({
    translation: cleanTranslation(raw),
    model: MODEL,
  })
}
