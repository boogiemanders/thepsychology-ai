import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'
import type { PriorityDomainRecommendation } from '@/lib/priority-storage'
import { calculatePriorities } from '@/lib/priority-calculator'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { examResults, userId } = body

    if (!examResults) {
      return NextResponse.json(
        { error: 'Exam results required' },
        { status: 400 }
      )
    }

    // Parse exam results
    const results = typeof examResults === 'string' ? JSON.parse(examResults) : examResults

    // Always calculate priorities from raw exam results so that
    // performance and % wrong remain consistent, even if stored
    // summaries (topPriorities/allResults) already exist
    const {
      topPriorities,
      allResults,
      score,
      totalQuestions,
      orgPsychPerformance,
    } = calculatePriorities(results)

    if (!topPriorities || !Array.isArray(topPriorities)) {
      return NextResponse.json(
        { error: 'Invalid exam results format' },
        { status: 400 }
      )
    }

    // Get top 3 domains (already calculated by priority-calculator)
    const top3Domains = topPriorities.slice(0, 3) as PriorityDomainRecommendation[]

    // Build simplified markdown response
    let markdown = `## Overall Performance\n\n`
    markdown += `You scored ${score}/${totalQuestions} (${Math.round((score / totalQuestions) * 100)}%). `
    markdown += `This diagnostic provides a clear roadmap showing where your study time can be most valuable.\n\n`

    // Domain breakdown table
    markdown += `## Domain Breakdown\n\n`
    markdown += `| Domain | Performance | % Wrong | Weight | Priority Score | Focus Level |\n`
    markdown += `|--------|-------------|---------|--------|-----------------|-------------|\n`

    if (allResults && Array.isArray(allResults)) {
      allResults.forEach((domain: PriorityDomainRecommendation) => {
        // Use actual domain performance from calculations
        const totalInDomain = domain.totalQuestionsInDomain || 1
        const wrongInDomain = domain.totalWrongInDomain || 0
        const correctInDomain = totalInDomain - wrongInDomain
        const correctPct = Math.round((correctInDomain / totalInDomain) * 100)

        let focusLevel = '✅ Building on strength'
        if (correctPct < 70 && correctPct >= 40) focusLevel = '🔵 Room to grow'
        if (correctPct < 40) focusLevel = '🟡 Priority focus area'

        markdown += `| **Domain ${domain.domainNumber}: ${domain.domainName}** | ${correctPct}% (${correctInDomain}/${totalInDomain}) | ${Math.round(domain.percentageWrong)}% | ${Math.round(domain.domainWeight)}% | ${domain.priorityScore} | ${focusLevel} |\n`
      })
    }

    markdown += `\n## Next Steps\n\n`
    markdown += `Based on your performance, focus on these domains:\n\n`

    top3Domains.forEach((domain, idx) => {
      markdown += `**${idx + 1}. ${domain.domainName}**\n`

      // List wrong topics
      const topicNames = domain.wrongKNs.map(kn => kn.knName).slice(0, 3)
      if (topicNames.length > 0) {
        markdown += `   - Focus on: ${topicNames.join(', ')}\n`
      }
      markdown += `\n`
    })

    // Save to Supabase if userId provided
    if (userId) {
      try {
        await supabase
          .from('study_priorities')
          .upsert({
            user_id: userId,
            top_domains: top3Domains,
            exam_score: score,
            total_questions: totalQuestions,
            created_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          })
      } catch (err) {
        console.error('Failed to save priorities to Supabase:', err)
      }
    }

    // Return both markdown and structured data as JSON
    const responseData = {
      markdown,
      structured: {
        score,
        totalQuestions,
        allResults: allResults || [],
        topPriorities: topPriorities || [],
        orgPsychPerformance,
        examQuestions: results.questions || [],
        selectedAnswers: results.selectedAnswers || {},
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error analyzing exam results:', error)
    return NextResponse.json(
      { error: 'Failed to analyze exam results' },
      { status: 500 }
    )
  }
}
