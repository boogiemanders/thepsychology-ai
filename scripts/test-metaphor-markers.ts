import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { EPPP_DOMAINS } from '../src/lib/eppp-data'
import { loadReferenceContent } from '../src/lib/eppp-reference-loader'

// Load environment variables from .env.local
const envPath = join(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    process.env[key.trim()] = value.trim()
  }
})

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const TOPIC_GENERATION_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) educator creating engaging teaching materials for adult psychology students (20-40 years old) preparing for the EPPP exam.

You will receive comprehensive reference material about a topic. Your task is to transform this dense, academic content into an accessible, memorable teaching lesson.

Topic: {{TOPIC_NAME}}
Domain: {{DOMAIN}}

Reference Material:
{{REFERENCE_CONTENT}}

Your Task:
Transform the above reference material into an engaging, practical lesson for adult learners.

Requirements:
- Target audience: Adults aged 20-40 preparing for EPPP
- Reading level: 13-year-old vocabulary (simple, clear language)
- Metaphors: Use adult-relatable analogies from career, relationships, modern technology, real-world scenarios
  * Good examples: workplace dynamics, life transitions, modern tech (smartphones, apps), adult responsibilities
  * Avoid: childish comparisons, overly academic language, building/office clichés
- Length: 2500-3000 words
- Structure: Clear markdown formatting with ## headers (no H1)
- Tone: Professional but conversational, measured, encouraging
- Tables: Use markdown tables when helpful for learning
  * Preserve important tables from reference material (diagnostic criteria, stage theories, comparisons)
  * Create tables for: comparing theories, DSM-5 criteria, developmental stages, research designs, statistical tests
  * Tables should be clear and readable with proper headers and alignment

CRITICAL - Metaphor Marking:
Whenever you use a metaphor, analogy, or example to explain a concept, wrap ONLY the metaphorical part in special markers:
- Start metaphor: {{M}}
- End metaphor: {{/M}}

Examples of what to mark:
- "The HPA axis {{M}}is like a cascade of text messages{{/M}} where the hypothalamus releases CRH..."
- "{{M}}Imagine you're at a coffee shop preparing for a session.{{/M}} This scenario illustrates..."
- "Think of it {{M}}like updating your smartphone's operating system{{/M}} - when you encounter new information..."

Do NOT mark:
- Factual statements, definitions, or core teaching content
- Technical terms or psychological concepts
- Tables, lists of criteria, or research findings

The goal: Mark ONLY the analogies/scenarios that could be personalized to user interests, while keeping all factual psychology content unmarked.

Content Structure:
1. Introduction & Core Concept - Hook the learner with why this matters
2. Historical Context (if relevant) - Brief background
3. Key Principles/Mechanisms - Break down the concepts clearly
4. Real-World Applications - Concrete examples from clinical practice, daily life, career
5. Common Misconceptions - What students often get wrong
6. Practice Tips for Remembering - Memory aids, study strategies
7. Key Takeaways - Bullet list of essentials

Style Guidelines:
- Use concrete, varied metaphors (not just "think of it as...")
- Include practical clinical examples where relevant
- Bold only key terms sparingly
- Minimal emoji usage
- Evidence-based and accurate
- Explain technical terms in simple language
- Make connections to real psychology practice

Start generating the lesson now based on the reference material provided.`

async function testMetaphorMarkers() {
  console.log('='.repeat(80))
  console.log('TESTING METAPHOR MARKER GENERATION')
  console.log('='.repeat(80))
  console.log('\nGenerating Classical Conditioning with metaphor markers...\n')

  const topicName = 'Classical Conditioning'
  const domainId = '2'
  const domainData = EPPP_DOMAINS.find(d => d.id === domainId)!

  // Load reference content
  const referenceContent = loadReferenceContent(topicName, domainId)

  if (!referenceContent) {
    console.error('❌ No reference content found!')
    return
  }

  console.log(`✓ Loaded reference content (${referenceContent.length} characters)`)

  const prompt = TOPIC_GENERATION_PROMPT
    .replace('{{TOPIC_NAME}}', topicName)
    .replace('{{DOMAIN}}', domainData.name)
    .replace('{{REFERENCE_CONTENT}}', referenceContent)

  console.log('\nGenerating with metaphor markers...')

  let fullResponse = ''
  const stream = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 10000,
    stream: true,
    messages: [{ role: 'user', content: prompt }],
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullResponse += event.delta.text
      process.stdout.write('.')
    }
  }

  console.log(' done\n')

  // Count metaphor markers
  const metaphorStartCount = (fullResponse.match(/\{\{M\}\}/g) || []).length
  const metaphorEndCount = (fullResponse.match(/\{\{\/M\}\}/g) || []).length

  console.log(`✓ Generated ${fullResponse.length} characters`)
  console.log(`✓ Found ${metaphorStartCount} metaphor start markers`)
  console.log(`✓ Found ${metaphorEndCount} metaphor end markers`)

  if (metaphorStartCount !== metaphorEndCount) {
    console.warn(`⚠️  Marker mismatch! Start: ${metaphorStartCount}, End: ${metaphorEndCount}`)
  }

  // Show first few metaphors found
  const metaphorRegex = /\{\{M\}\}(.*?)\{\{\/M\}\}/gs
  const metaphors = [...fullResponse.matchAll(metaphorRegex)]

  if (metaphors.length > 0) {
    console.log(`\n✅ SUCCESS: Found ${metaphors.length} marked metaphors`)
    console.log('\nFirst 5 metaphors:')
    metaphors.slice(0, 5).forEach((match, i) => {
      console.log(`${i + 1}. "${match[1].substring(0, 80)}${match[1].length > 80 ? '...' : ''}"`)
    })
  } else {
    console.log('\n❌ WARNING: No metaphor markers found in generated content!')
  }

  // Save the file
  const slug = 'classical-conditioning'
  const domainFolder = '2-cognitive-affective-bases'
  const topicsDir = join(process.cwd(), 'topic-content-v3-test')
  const domainDir = join(topicsDir, domainFolder)
  mkdirSync(domainDir, { recursive: true })

  const now = new Date().toISOString()
  const frontmatter = `---
topic_name: ${topicName}
domain: ${domainData.name}
slug: ${slug}
generated_at: ${now}
model: claude-sonnet-4-5-20250929
version: 3
---

`

  const filePath = join(domainDir, `${slug}.md`)
  writeFileSync(filePath, frontmatter + fullResponse, 'utf-8')

  console.log(`\n✓ Saved to: ${filePath}`)
  console.log('\nYou can now:')
  console.log('1. Review the file to verify marker placement')
  console.log('2. Check if metaphors are appropriately marked')
  console.log('3. If good, run full regeneration for all topics')
}

testMetaphorMarkers().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
