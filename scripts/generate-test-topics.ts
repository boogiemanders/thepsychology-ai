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

interface TopicInfo {
  name: string
  domain: string
  domainId: string
  slug: string
  domainFolder: string
}

async function generateTopicContent(topic: TopicInfo): Promise<string> {
  console.log(`\nGenerating content for: ${topic.name}...`)
  console.log(`Domain: ${topic.domain}`)

  // Load reference content from EPPP Guts
  const referenceContent = loadReferenceContent(topic.name, topic.domainId)

  if (!referenceContent) {
    console.error(`  ⚠️  No reference content found for ${topic.name} in domain ${topic.domainId}`)
    throw new Error(`No reference content available for ${topic.name}`)
  }

  console.log(`  ✓ Loaded reference content (${referenceContent.length} characters)`)

  const prompt = TOPIC_GENERATION_PROMPT
    .replace('{{TOPIC_NAME}}', topic.name)
    .replace('{{DOMAIN}}', topic.domain)
    .replace('{{REFERENCE_CONTENT}}', referenceContent)

  let fullResponse = ''

  console.log(`  Generating lesson...`)

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
  console.log(`  ✓ Generated ${fullResponse.length} characters`)
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

async function generateTestTopics() {
  console.log('='.repeat(80))
  console.log('TOPIC GENERATION TEST')
  console.log('='.repeat(80))
  console.log('\nGenerating 3 test topics from different domains...\n')

  const testTopics = [
    // Domain 2: Cognitive-Affective
    { domainId: '2', topicName: 'Classical Conditioning' },
    // Domain 4: Growth & Lifespan
    { domainId: '4', topicName: 'Cognitive Development' },
    // Domain 5: Diagnosis
    { domainId: '5-diagnosis', topicName: 'Bipolar and Depressive Disorders' },
  ]

  const topicsDir = join(process.cwd(), 'topic-content')
  mkdirSync(topicsDir, { recursive: true })

  let generatedCount = 0
  let failedCount = 0

  for (const { domainId, topicName } of testTopics) {
    try {
      // Find the domain data
      const domainData = EPPP_DOMAINS.find(d => d.id === domainId)
      if (!domainData) {
        throw new Error(`Domain not found: ${domainId}`)
      }

      const domainFolder = getDomainFolder(domainData.name)
      const domainDir = join(topicsDir, domainFolder)
      mkdirSync(domainDir, { recursive: true })

      const slug = createSlug(topicName)
      const filePath = join(domainDir, `${slug}.md`)

      const content = await generateTopicContent({
        name: topicName,
        domain: domainData.name,
        domainId: domainData.id,
        slug,
        domainFolder,
      })

      const now = new Date().toISOString()
      const frontmatter = `---
topic_name: ${topicName}
domain: ${domainData.name}
slug: ${slug}
generated_at: ${now}
model: claude-sonnet-4-5-20250929
version: 1
---

`

      const fileContent = frontmatter + content

      writeFileSync(filePath, fileContent, 'utf-8')
      console.log(`  ✓ Saved to: ${filePath}`)
      generatedCount++

      // Add a delay between requests
      console.log('  Waiting 2 seconds before next topic...')
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error) {
      console.error(`  ✗ Failed to generate ${topicName}:`, error)
      failedCount++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('GENERATION COMPLETE')
  console.log('='.repeat(80))
  console.log(`Successfully generated: ${generatedCount}/3`)
  console.log(`Failed: ${failedCount}/3`)

  if (generatedCount > 0) {
    console.log('\n✅ Test topics generated successfully!')
    console.log('You can now:')
    console.log('1. Review the generated content in topic-content/ folders')
    console.log('2. Test the Topic Teacher to see if content loads correctly')
    console.log('3. Run scripts/generate-all-topics.ts to generate all remaining topics')
  } else {
    console.log('\n❌ Generation failed. Check the errors above.')
  }
}

// Run the generation
generateTestTopics().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
