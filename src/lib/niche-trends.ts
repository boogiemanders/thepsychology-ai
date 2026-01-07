import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

const MODEL_NAME = 'claude-sonnet-4-20250514'

export type NicheTrend = {
  keyword: string
  searchVolume: number | null
  trendDirection: 'rising' | 'stable' | 'declining'
  competitionLevel: 'low' | 'medium' | 'high'
  platformPopularity: {
    tiktok: number
    twitter: number
    instagram: number
    youtube: number
    google: number
  }
  relatedKeywords: string[]
  contentIdeas: string[]
}

export type NicheAnalysis = {
  niche: string
  trends: NicheTrend[]
  emergingTopics: string[]
  contentGaps: string[]
  bestContentFormats: string[]
  audienceInsights: {
    demographics: string
    painPoints: string[]
    desires: string[]
    questions: string[]
  }
  competitorInsights: string[]
  seasonalTrends: string[]
}

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  return new Anthropic({ apiKey })
}

const NICHE_TRENDS_PROMPT = `You are an expert social media trends analyst and SEO specialist. Your task is to analyze a specific niche and provide comprehensive insights about trending topics, search keywords, and content opportunities.

For the given niche, provide:

1. **TOP TRENDING KEYWORDS** - 10-15 keywords people are actively searching for
2. **EMERGING TOPICS** - New topics gaining traction
3. **CONTENT GAPS** - Underserved topics with high potential
4. **BEST CONTENT FORMATS** - What types of content work best in this niche
5. **AUDIENCE INSIGHTS** - Who's searching and why
6. **COMPETITOR INSIGHTS** - What top creators are doing
7. **SEASONAL TRENDS** - Time-sensitive opportunities

Respond with a JSON object in this exact structure:
{
  "niche": "<the niche being analyzed>",
  "trends": [
    {
      "keyword": "<trending keyword>",
      "searchVolume": <estimated monthly searches or null>,
      "trendDirection": "rising|stable|declining",
      "competitionLevel": "low|medium|high",
      "platformPopularity": {
        "tiktok": <1-10>,
        "twitter": <1-10>,
        "instagram": <1-10>,
        "youtube": <1-10>,
        "google": <1-10>
      },
      "relatedKeywords": ["<related 1>", "<related 2>", "<related 3>"],
      "contentIdeas": ["<idea 1>", "<idea 2>"]
    }
  ],
  "emergingTopics": ["<topic 1>", "<topic 2>", "<topic 3>"],
  "contentGaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "bestContentFormats": ["<format 1>", "<format 2>", "<format 3>"],
  "audienceInsights": {
    "demographics": "<demographic description>",
    "painPoints": ["<pain 1>", "<pain 2>", "<pain 3>"],
    "desires": ["<desire 1>", "<desire 2>", "<desire 3>"],
    "questions": ["<question 1>", "<question 2>", "<question 3>"]
  },
  "competitorInsights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "seasonalTrends": ["<trend 1>", "<trend 2>"]
}

Focus on actionable insights that can directly inform content strategy. Be specific to the niche and current social media landscape.`

export async function analyzeNicheTrends(niche: string): Promise<NicheAnalysis | null> {
  const anthropic = getAnthropicClient()
  if (!anthropic) {
    console.error('[niche-trends] Anthropic client not configured')
    return null
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL_NAME,
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `${NICHE_TRENDS_PROMPT}\n\n---\n\nNiche to analyze: ${niche}\n\nProvide comprehensive trend analysis for this niche, focusing on what's currently popular and what opportunities exist for content creators.`,
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      console.error('[niche-trends] No text response from Claude')
      return null
    }

    // Extract JSON from response
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[niche-trends] No JSON found in response')
      return null
    }

    const analysis = JSON.parse(jsonMatch[0]) as NicheAnalysis
    return analysis
  } catch (error) {
    console.error('[niche-trends] Analysis failed:', error)
    return null
  }
}

export async function saveTrends(
  supabase: SupabaseClient,
  userId: string,
  analysis: NicheAnalysis
): Promise<boolean> {
  const inserts = analysis.trends.map((trend) => ({
    user_id: userId,
    niche: analysis.niche,
    keyword: trend.keyword,
    search_volume: trend.searchVolume,
    trend_direction: trend.trendDirection,
    competition_level: trend.competitionLevel,
    tiktok_popularity: trend.platformPopularity.tiktok,
    twitter_popularity: trend.platformPopularity.twitter,
    instagram_popularity: trend.platformPopularity.instagram,
    youtube_popularity: trend.platformPopularity.youtube,
    google_popularity: trend.platformPopularity.google,
    related_keywords: trend.relatedKeywords,
    content_ideas: trend.contentIdeas,
    fetched_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('niche_search_trends').insert(inserts)

  if (error) {
    console.error('[niche-trends] Failed to save trends:', error)
    return false
  }

  return true
}

export async function getTrends(
  supabase: SupabaseClient,
  userId: string,
  options?: { niche?: string; limit?: number }
): Promise<any[]> {
  let query = supabase
    .from('niche_search_trends')
    .select('*')
    .eq('user_id', userId)
    .order('fetched_at', { ascending: false })

  if (options?.niche) {
    query = query.eq('niche', options.niche)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('[niche-trends] Failed to fetch trends:', error)
    return []
  }

  return data || []
}

export async function getUniqueNiches(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('niche_search_trends')
    .select('niche')
    .eq('user_id', userId)
    .order('fetched_at', { ascending: false })

  if (error || !data) {
    return []
  }

  // Get unique niches
  const niches = [...new Set(data.map((d) => d.niche))]
  return niches
}
