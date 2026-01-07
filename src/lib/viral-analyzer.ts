import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

const MODEL_NAME = 'claude-sonnet-4-20250514'

export type Platform = 'tiktok' | 'twitter' | 'instagram'

export type ContentInput = {
  platform: Platform
  contentUrl?: string
  contentId?: string
  title?: string
  description?: string
  transcript?: string
  thumbnailUrl?: string
  durationSeconds?: number
  postedAt?: string
  // Engagement metrics (optional, for re-analysis)
  views?: number
  likes?: number
  comments?: number
  shares?: number
  saves?: number
}

export type ViralAnalysis = {
  hookScore: number
  hookAnalysis: {
    openingLine: string
    attentionGrab: string
    curiosityGap: string
    strengths: string[]
    weaknesses: string[]
    improvements: string[]
  }
  visualScore: number
  visualAnalysis: {
    thumbnailAppeal: string
    visualClarity: string
    brandConsistency: string
    strengths: string[]
    weaknesses: string[]
    improvements: string[]
  }
  pacingScore: number
  pacingAnalysis: {
    openingSpeed: string
    contentFlow: string
    retention: string
    strengths: string[]
    weaknesses: string[]
    improvements: string[]
  }
  toneScore: number
  toneAnalysis: {
    voiceCharacter: string
    emotionalResonance: string
    authenticity: string
    strengths: string[]
    weaknesses: string[]
    improvements: string[]
  }
  cadenceScore: number
  cadenceAnalysis: {
    speechPattern: string
    pauseUsage: string
    emphasis: string
    strengths: string[]
    weaknesses: string[]
    improvements: string[]
  }
  overallViralScore: number
  viralElements: string[]
  missingElements: string[]
  improvementSuggestions: string[]
  contentType: string
  targetAudience: string
  bestPostingTime: string
}

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  return new Anthropic({ apiKey })
}

const VIRAL_ANALYSIS_PROMPT = `You are an expert social media content analyst specializing in viral content mechanics. Your task is to analyze content for its viral potential and provide actionable insights.

Analyze the provided content and evaluate it on these dimensions:

1. **HOOK (1-10)**: How effectively does the content grab attention in the first 3 seconds?
   - Opening line strength
   - Attention grab technique
   - Curiosity gap creation

2. **VISUALS (1-10)**: How visually appealing and engaging is the content?
   - Thumbnail/preview appeal
   - Visual clarity and quality
   - Brand consistency

3. **PACING (1-10)**: How well does the content maintain engagement throughout?
   - Opening speed (should be fast)
   - Content flow
   - Retention optimization

4. **TONE OF VOICE (1-10)**: How relatable and engaging is the delivery?
   - Voice character
   - Emotional resonance
   - Authenticity

5. **CADENCE (1-10)**: How effectively is rhythm used to maintain attention?
   - Speech patterns
   - Strategic pause usage
   - Emphasis on key points

Respond with a JSON object in this exact structure:
{
  "hookScore": <1-10>,
  "hookAnalysis": {
    "openingLine": "<assessment of opening>",
    "attentionGrab": "<how attention is grabbed>",
    "curiosityGap": "<curiosity gap analysis>",
    "strengths": ["<strength 1>", "<strength 2>"],
    "weaknesses": ["<weakness 1>"],
    "improvements": ["<specific improvement 1>", "<specific improvement 2>"]
  },
  "visualScore": <1-10>,
  "visualAnalysis": {
    "thumbnailAppeal": "<thumbnail assessment>",
    "visualClarity": "<clarity assessment>",
    "brandConsistency": "<brand consistency>",
    "strengths": ["<strength 1>"],
    "weaknesses": ["<weakness 1>"],
    "improvements": ["<improvement 1>"]
  },
  "pacingScore": <1-10>,
  "pacingAnalysis": {
    "openingSpeed": "<pacing assessment>",
    "contentFlow": "<flow assessment>",
    "retention": "<retention strategy>",
    "strengths": ["<strength 1>"],
    "weaknesses": ["<weakness 1>"],
    "improvements": ["<improvement 1>"]
  },
  "toneScore": <1-10>,
  "toneAnalysis": {
    "voiceCharacter": "<voice assessment>",
    "emotionalResonance": "<emotional impact>",
    "authenticity": "<authenticity level>",
    "strengths": ["<strength 1>"],
    "weaknesses": ["<weakness 1>"],
    "improvements": ["<improvement 1>"]
  },
  "cadenceScore": <1-10>,
  "cadenceAnalysis": {
    "speechPattern": "<pattern assessment>",
    "pauseUsage": "<pause effectiveness>",
    "emphasis": "<emphasis technique>",
    "strengths": ["<strength 1>"],
    "weaknesses": ["<weakness 1>"],
    "improvements": ["<improvement 1>"]
  },
  "overallViralScore": <1-100 weighted score>,
  "viralElements": ["<element 1>", "<element 2>", "<element 3>"],
  "missingElements": ["<missing 1>", "<missing 2>"],
  "improvementSuggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "contentType": "<type of content: educational, entertainment, inspirational, etc>",
  "targetAudience": "<identified target audience>",
  "bestPostingTime": "<recommended posting time for this content type>"
}

Be specific and actionable in your analysis. Focus on what makes content go viral on the specific platform.`

export async function analyzeContent(input: ContentInput): Promise<ViralAnalysis | null> {
  const anthropic = getAnthropicClient()
  if (!anthropic) {
    console.error('[viral-analyzer] Anthropic client not configured')
    return null
  }

  const platformContext = {
    tiktok: 'TikTok - short-form video, algorithm favors watch time, hooks in first 1 second, trending sounds matter',
    twitter: 'Twitter/X - text-first with optional media, threads perform well, controversy drives engagement',
    instagram: 'Instagram - visual-first, Reels compete with TikTok, Stories drive engagement, carousel posts for saves',
  }

  const contentDescription = [
    `Platform: ${input.platform.toUpperCase()}`,
    `Platform Context: ${platformContext[input.platform]}`,
    input.title ? `Title: ${input.title}` : null,
    input.description ? `Description/Caption: ${input.description}` : null,
    input.transcript ? `Transcript/Script: ${input.transcript}` : null,
    input.durationSeconds ? `Duration: ${input.durationSeconds} seconds` : null,
    input.contentUrl ? `URL: ${input.contentUrl}` : null,
  ]
    .filter(Boolean)
    .join('\n\n')

  try {
    const response = await anthropic.messages.create({
      model: MODEL_NAME,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `${VIRAL_ANALYSIS_PROMPT}\n\n---\n\nContent to analyze:\n\n${contentDescription}`,
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      console.error('[viral-analyzer] No text response from Claude')
      return null
    }

    // Extract JSON from response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[viral-analyzer] No JSON found in response')
      return null
    }

    const analysis = JSON.parse(jsonMatch[0]) as ViralAnalysis
    return analysis
  } catch (error) {
    console.error('[viral-analyzer] Analysis failed:', error)
    return null
  }
}

export async function saveAnalysis(
  supabase: SupabaseClient,
  userId: string,
  input: ContentInput,
  analysis: ViralAnalysis
): Promise<{ id: string } | null> {
  const engagementRate =
    input.views && input.views > 0
      ? ((input.likes ?? 0) + (input.comments ?? 0) + (input.shares ?? 0)) / input.views
      : null

  const payload = {
    user_id: userId,
    platform: input.platform,
    content_url: input.contentUrl ?? null,
    content_id: input.contentId ?? null,
    title: input.title ?? null,
    description: input.description ?? null,
    transcript: input.transcript ?? null,
    thumbnail_url: input.thumbnailUrl ?? null,
    duration_seconds: input.durationSeconds ?? null,
    posted_at: input.postedAt ?? null,
    views: input.views ?? 0,
    likes: input.likes ?? 0,
    comments: input.comments ?? 0,
    shares: input.shares ?? 0,
    saves: input.saves ?? 0,
    engagement_rate: engagementRate,
    hook_score: analysis.hookScore,
    visual_score: analysis.visualScore,
    pacing_score: analysis.pacingScore,
    tone_score: analysis.toneScore,
    cadence_score: analysis.cadenceScore,
    overall_viral_score: analysis.overallViralScore,
    hook_analysis: analysis.hookAnalysis,
    visual_analysis: analysis.visualAnalysis,
    pacing_analysis: analysis.pacingAnalysis,
    tone_analysis: analysis.toneAnalysis,
    cadence_analysis: analysis.cadenceAnalysis,
    improvement_suggestions: analysis.improvementSuggestions,
    viral_elements: analysis.viralElements,
    missing_elements: analysis.missingElements,
    status: 'completed',
  }

  const { data, error } = await supabase
    .from('viral_content_analyses')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    console.error('[viral-analyzer] Failed to save analysis:', error)
    return null
  }

  return { id: data.id }
}

export async function getAnalyses(
  supabase: SupabaseClient,
  userId: string,
  options?: { platform?: Platform; limit?: number }
): Promise<any[]> {
  let query = supabase
    .from('viral_content_analyses')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  if (options?.platform) {
    query = query.eq('platform', options.platform)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('[viral-analyzer] Failed to fetch analyses:', error)
    return []
  }

  return data || []
}

export async function generateSiteRecommendations(
  supabase: SupabaseClient,
  userId: string
): Promise<any | null> {
  // Get top performing content analyses
  const analyses = await getAnalyses(supabase, userId, { limit: 10 })

  if (analyses.length === 0) {
    return null
  }

  const anthropic = getAnthropicClient()
  if (!anthropic) {
    return null
  }

  // Find common patterns in high-scoring content
  const highScoring = analyses.filter((a) => a.overall_viral_score >= 70)
  const patterns = {
    commonHookElements: [] as string[],
    commonVisualElements: [] as string[],
    avgScores: {
      hook: 0,
      visual: 0,
      pacing: 0,
      tone: 0,
      cadence: 0,
    },
  }

  analyses.forEach((a) => {
    patterns.avgScores.hook += a.hook_score || 0
    patterns.avgScores.visual += a.visual_score || 0
    patterns.avgScores.pacing += a.pacing_score || 0
    patterns.avgScores.tone += a.tone_score || 0
    patterns.avgScores.cadence += a.cadence_score || 0

    if (a.viral_elements) {
      patterns.commonHookElements.push(...(a.viral_elements as string[]))
    }
  })

  const count = analyses.length
  patterns.avgScores.hook = Math.round(patterns.avgScores.hook / count)
  patterns.avgScores.visual = Math.round(patterns.avgScores.visual / count)
  patterns.avgScores.pacing = Math.round(patterns.avgScores.pacing / count)
  patterns.avgScores.tone = Math.round(patterns.avgScores.tone / count)
  patterns.avgScores.cadence = Math.round(patterns.avgScores.cadence / count)

  const siteRecommendationPrompt = `Based on the analysis of viral content patterns, generate specific recommendations for improving a website to be more engaging and viral.

Content Analysis Summary:
- Average Hook Score: ${patterns.avgScores.hook}/10
- Average Visual Score: ${patterns.avgScores.visual}/10
- Average Pacing Score: ${patterns.avgScores.pacing}/10
- Average Tone Score: ${patterns.avgScores.tone}/10
- Average Cadence Score: ${patterns.avgScores.cadence}/10

Common viral elements found: ${patterns.commonHookElements.slice(0, 10).join(', ')}

High-performing content count: ${highScoring.length}

Generate JSON recommendations:
{
  "currentSiteScore": <estimated 1-100>,
  "hookRecommendations": {
    "headline": "<specific headline improvement>",
    "subheadline": "<subheadline suggestion>",
    "cta": "<call-to-action improvement>",
    "examples": ["<example 1>", "<example 2>"]
  },
  "visualRecommendations": {
    "heroSection": "<hero section improvement>",
    "imagery": "<imagery suggestions>",
    "colorScheme": "<color recommendations>",
    "examples": ["<example 1>", "<example 2>"]
  },
  "copyRecommendations": {
    "toneOfVoice": "<tone suggestions>",
    "messagingFramework": "<framework suggestion>",
    "urgency": "<urgency tactics>",
    "examples": ["<example 1>", "<example 2>"]
  },
  "ctaRecommendations": {
    "primaryCTA": "<primary CTA suggestion>",
    "placement": "<placement advice>",
    "copy": "<CTA copy suggestions>",
    "examples": ["<example 1>", "<example 2>"]
  },
  "topPatterns": ["<pattern 1>", "<pattern 2>", "<pattern 3>"],
  "suggestedChanges": [
    {"area": "<area>", "current": "<what to change>", "suggested": "<new approach>", "priority": "high|medium|low"}
  ]
}`

  try {
    const response = await anthropic.messages.create({
      model: MODEL_NAME,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: siteRecommendationPrompt,
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return null
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return null
    }

    const recommendations = JSON.parse(jsonMatch[0])

    // Save to database
    const { data, error } = await supabase
      .from('site_viral_recommendations')
      .insert({
        user_id: userId,
        current_site_score: recommendations.currentSiteScore,
        hook_recommendations: recommendations.hookRecommendations,
        visual_recommendations: recommendations.visualRecommendations,
        copy_recommendations: recommendations.copyRecommendations,
        cta_recommendations: recommendations.ctaRecommendations,
        top_patterns: recommendations.topPatterns,
        suggested_changes: recommendations.suggestedChanges,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[viral-analyzer] Failed to save site recommendations:', error)
      return recommendations
    }

    return { ...recommendations, id: data.id }
  } catch (error) {
    console.error('[viral-analyzer] Site recommendation generation failed:', error)
    return null
  }
}
