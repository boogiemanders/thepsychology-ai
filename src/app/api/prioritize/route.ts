import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { PriorityDomainRecommendation } from '@/lib/priority-storage'
import { calculatePriorities } from '@/lib/priority-calculator'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
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

    // If topPriorities don't exist, calculate them from raw results
    let topPriorities, allResults, score, totalQuestions, orgPsychPerformance

    if (results.topPriorities && Array.isArray(results.topPriorities)) {
      // Already has priority calculations
      ({ topPriorities, allResults, score, totalQuestions, orgPsychPerformance } = results)
    } else {
      // Calculate priorities from raw exam results
      const calculated = calculatePriorities(results)
      topPriorities = calculated.topPriorities
      allResults = calculated.allResults
      score = calculated.score
      totalQuestions = calculated.totalQuestions
      orgPsychPerformance = calculated.orgPsychPerformance
    }

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
    markdown += `| Domain | Performance | Weight | Focus Level |\n`
    markdown += `|--------|-------------|--------|-------------|\n`

    if (allResults && Array.isArray(allResults)) {
      allResults.forEach((domain: PriorityDomainRecommendation) => {
        const correctCount = Math.round((domain.percentageWrong / 100) * totalQuestions)
        const wrongCount = totalQuestions - correctCount
        const correctPct = Math.round(((totalQuestions - wrongCount) / totalQuestions) * 100)

        let focusLevel = '✅ Building on strength'
        if (correctPct < 70 && correctPct >= 40) focusLevel = '🔵 Room to grow'
        if (correctPct < 40) focusLevel = '🟡 Priority focus area'

        markdown += `| **Domain ${domain.domainNumber}: ${domain.domainName}** | ${correctPct}% (${totalQuestions - wrongCount}/${totalQuestions}) | ${Math.round(domain.domainWeight * 100)}% | ${focusLevel} |\n`
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
