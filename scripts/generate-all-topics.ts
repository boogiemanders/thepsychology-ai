import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { EPPP_DOMAINS } from '../src/lib/eppp-data'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const TOPIC_GENERATION_PROMPT = `You are an expert EPPP (Examination for Professional Practice in Psychology) educator tasked with creating comprehensive teaching materials for psychology students preparing for the EPPP exam.

Your task is to create an in-depth, engaging educational lesson about the following topic:

Topic: {{TOPIC_NAME}}
Domain: {{DOMAIN}}

Requirements:
- Write in simple, clear language (13-year-old reading level)
- Use everyday analogies and metaphors throughout
- Include at least 2-3 real-world examples or applications
- Use bullet points and headers to organize information
- Include a "Key Takeaways" section at the end
- Markdown formatting with clear headers (use # for main sections, ## for subsections)
- Comprehensive but concise (2500-3000 words)
- Include common misconceptions and how to avoid them
- Add practice tips for remembering the concept

Structure your response as follows:
1. Introduction & Core Concept
2. Historical Context (if relevant)
3. Key Principles/Mechanisms
4. Real-World Applications
5. Common Misconceptions
6. {{PERSONALIZED_EXAMPLES}} (placeholder for user-interest-based examples - just note this placeholder)
7. Key Takeaways

Important notes:
- Use measured, calm tone
- Minimal emoji usage
- Sparse bolding (only for key terms)
- Include section headers but no H1 (save that for the title)
- Make sure content is accurate and evidence-based

Start generating the lesson now.`

interface TopicInfo {
  name: string
  domain: string
  slug: string
  domainFolder: string
}

async function generateTopicContent(topic: TopicInfo): Promise<string> {
  console.log(`Generating content for: ${topic.name}...`)

  const prompt = TOPIC_GENERATION_PROMPT
    .replace('{{TOPIC_NAME}}', topic.name)
    .replace('{{DOMAIN}}', topic.domain)

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

  const topicsDir = join(process.cwd(), 'topic-content')
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

        const content = await generateTopicContent({
          name: topic,
          domain: domainData.name,
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
version: 1
---

`

        const fileContent = frontmatter + content

        writeFileSync(filePath, fileContent, 'utf-8')
        console.log(`✓ Saved: ${slug}`)
        generatedCount++

        // Add a small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`✗ Failed to generate ${topic}:`, error)
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
