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

async function regenerateTopic() {
  console.log('='.repeat(80))
  console.log('TESTING TABLE GENERATION')
  console.log('='.repeat(80))
  console.log('\nRegenerating Cognitive Development with updated prompt...\n')

  const topicName = 'Cognitive Development'
  const domainId = '4'
  const domainData = EPPP_DOMAINS.find(d => d.id === domainId)!

  // Load reference content
  const referenceContent = loadReferenceContent(topicName, domainId)

  if (!referenceContent) {
    console.error('❌ No reference content found!')
    return
  }

  console.log(`✓ Loaded reference content (${referenceContent.length} characters)`)

  // Check if reference has tables
  const tableCount = (referenceContent.match(/\|/g) || []).length
  console.log(`✓ Reference material contains ${Math.floor(tableCount / 3)} potential tables`)

  const prompt = TOPIC_GENERATION_PROMPT
    .replace('{{TOPIC_NAME}}', topicName)
    .replace('{{DOMAIN}}', domainData.name)
    .replace('{{REFERENCE_CONTENT}}', referenceContent)

  console.log('\nGenerating new version with table support...')

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

  // Count tables in generated content
  const generatedTableCount = (fullResponse.match(/\|/g) || []).length
  const estimatedTables = Math.floor(generatedTableCount / 3)

  console.log(`✓ Generated ${fullResponse.length} characters`)
  console.log(`✓ Generated content contains ${estimatedTables} table${estimatedTables !== 1 ? 's' : ''}`)

  // Save the file
  const slug = 'cognitive-development'
  const domainFolder = '4-growth-lifespan-development'
  const topicsDir = join(process.cwd(), 'topic-content')
  const domainDir = join(topicsDir, domainFolder)
  mkdirSync(domainDir, { recursive: true })

  const now = new Date().toISOString()
  const frontmatter = `---
topic_name: ${topicName}
domain: ${domainData.name}
slug: ${slug}
generated_at: ${now}
model: claude-sonnet-4-5-20250929
version: 2
---

`

  const filePath = join(domainDir, `${slug}.md`)
  writeFileSync(filePath, frontmatter + fullResponse, 'utf-8')

  console.log(`\n✓ Saved to: ${filePath}`)

  if (estimatedTables > 0) {
    console.log('\n✅ SUCCESS: Tables were generated!')
    console.log('\nYou can now:')
    console.log('1. View the file to see the tables')
    console.log('2. Test in Topic Teacher to see how they render')
  } else {
    console.log('\n⚠️  No tables detected in generated content')
    console.log('The AI may not have found table-worthy content in this topic')
  }
}

regenerateTopic().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
