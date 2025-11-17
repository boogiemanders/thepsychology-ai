import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
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

interface TopicInfo {
  name: string
  domain: string
  domainId: string
  slug: string
  domainFolder: string
}

async function generateTopicContent(topic: TopicInfo): Promise<string> {
  console.log(`Generating content for: ${topic.name}...`)

  // Load reference content from EPPP Guts
  const referenceContent = loadReferenceContent(topic.name, topic.domainId)

  if (!referenceContent) {
    console.error(`  ⚠️  No reference content found for ${topic.name} in domain ${topic.domainId}`)
    console.error(`  ⚠️  Generating without reference material (will be lower quality)`)
  }

  const prompt = TOPIC_GENERATION_PROMPT
    .replace('{{TOPIC_NAME}}', topic.name)
    .replace('{{DOMAIN}}', topic.domain)
    .replace('{{REFERENCE_CONTENT}}', referenceContent || 'No reference material available. Generate based on your knowledge.')

  let fullResponse = ''

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 10000,
    stream: true,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullResponse += event.delta.text
      process.stdout.write('.')
    }
  }

  console.log(' done')
  return fullResponse
}

function createSlug(topicName: string): string {
  return topicName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function getDomainFolder(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function generateAllTopics() {
  console.log('Starting topic content generation...')

  let totalTopics = 0
  for (const domain of EPPP_DOMAINS) {
    totalTopics += domain.topics.length
  }
  console.log(`Total topics to generate: ${totalTopics}`)

  const topicsDir = join(process.cwd(), 'topic-content-v3-test')
  mkdirSync(topicsDir, { recursive: true })

  let generatedCount = 0
  let failedCount = 0

  for (const domainData of EPPP_DOMAINS) {
    const domainFolder = getDomainFolder(domainData.name)
    const domainDir = join(topicsDir, domainFolder)
    mkdirSync(domainDir, { recursive: true })

    console.log(`\n=== ${domainData.name} (${domainData.topics.length} topics) ===`)

    for (const topicObj of domainData.topics) {
      try {
        const topic = topicObj.name
        const slug = createSlug(topic)
        const filePath = join(domainDir, `${slug}.md`)

        // Skip if file already exists
        if (existsSync(filePath)) {
          console.log(`⊘ Skipped (already exists): ${slug}`)
          continue
        }

        const content = await generateTopicContent({
          name: topic,
          domain: domainData.name,
          domainId: domainData.id,
          slug,
          domainFolder,
        })

        const now = new Date().toISOString()
        const frontmatter = `---
topic_name: ${topic}
domain: ${domainData.name}
slug: ${slug}
generated_at: ${now}
model: claude-sonnet-4-5-20250929
version: 3
---

`

        const fileContent = frontmatter + content

        writeFileSync(filePath, fileContent, 'utf-8')
        console.log(`✓ Saved: ${slug}`)
        generatedCount++

        // Add a small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`✗ Failed to generate ${topicObj.name}:`, error)
        failedCount++
      }
    }
  }

  console.log(`\n\n=== Generation Complete ===`)
  console.log(`Successfully generated: ${generatedCount}`)
  console.log(`Failed: ${failedCount}`)
  console.log(`Total: ${generatedCount + failedCount}`)

  if (failedCount > 0) {
    console.log('\n⚠️  Some topics failed to generate. You can re-run this script to retry.')
  } else {
    console.log('\n✅ All topics generated successfully!')
  }
}

// Run the generation
generateAllTopics().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
