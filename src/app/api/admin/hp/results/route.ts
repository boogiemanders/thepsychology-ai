import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const experimentId = request.nextUrl.searchParams.get('experiment')
  if (!experimentId) {
    return NextResponse.json({ error: 'experiment param required' }, { status: 400 })
  }

  const supabase = getSupabaseClient(undefined, { requireServiceRole: true })
  if (!supabase) {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 500 })
  }

  try {
    // Get all variants for this experiment
    const { data: variants, error: varErr } = await supabase
      .from('hp_variants')
      .select('id, name, section_order')
      .eq('experiment_id', experimentId)

    if (varErr || !variants) {
      return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 })
    }

    // For each variant, count assignments and conversions (excluding excluded visitors)
    const results = await Promise.all(
      variants.map(async (variant) => {
        // Get all visitor IDs assigned to this variant
        const { data: assignments } = await supabase
          .from('hp_assignments')
          .select('visitor_id')
          .eq('variant_id', variant.id)

        if (!assignments || assignments.length === 0) {
          return {
            variantId: variant.id,
            variantName: variant.name,
            sectionOrder: variant.section_order,
            visitors: 0,
            conversions: 0,
            conversionRate: '0.00%',
            thompsonScore: '0.00%',
            avgTimeOnPageMs: null as number | null,
            topTriggerSection: null as string | null,
          }
        }

        const visitorIds = assignments.map((a) => a.visitor_id)

        // Get non-excluded visitors and their conversion status
        const { data: visitors } = await supabase
          .from('hp_visitors')
          .select('id, converted')
          .in('id', visitorIds)
          .or('excluded.is.null,excluded.eq.false')

        const validVisitors = visitors ?? []
        const visitorCount = validVisitors.length
        const conversionCount = validVisitors.filter((v) => v.converted).length
        const rate = visitorCount > 0 ? ((conversionCount / visitorCount) * 100).toFixed(2) : '0.00'

        // Thompson Sampling score: expected value of Beta(conversions+1, visitors-conversions+1)
        const alpha = conversionCount + 1
        const beta = visitorCount - conversionCount + 1
        const thompsonScore = ((alpha / (alpha + beta)) * 100).toFixed(2)

        // Get signup_complete events for this variant to extract metadata
        const { data: events } = await supabase
          .from('hp_events')
          .select('metadata')
          .eq('variant_id', variant.id)
          .eq('event_type', 'signup_complete')

        // Calculate avg time on page and most common trigger section
        let avgTimeOnPageMs: number | null = null
        let topTriggerSection: string | null = null

        if (events && events.length > 0) {
          const times: number[] = []
          const sectionCounts: Record<string, number> = {}

          for (const event of events) {
            const meta = event.metadata as Record<string, unknown> | null
            if (!meta) continue

            if (typeof meta.time_on_page_ms === 'number' && meta.time_on_page_ms > 0) {
              times.push(meta.time_on_page_ms)
            }

            if (typeof meta.trigger_section === 'string' && meta.trigger_section) {
              sectionCounts[meta.trigger_section] = (sectionCounts[meta.trigger_section] || 0) + 1
            }
          }

          if (times.length > 0) {
            avgTimeOnPageMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
          }

          const topEntry = Object.entries(sectionCounts).sort((a, b) => b[1] - a[1])[0]
          if (topEntry) {
            topTriggerSection = topEntry[0]
          }
        }

        return {
          variantId: variant.id,
          variantName: variant.name,
          sectionOrder: variant.section_order,
          visitors: visitorCount,
          conversions: conversionCount,
          conversionRate: `${rate}%`,
          thompsonScore: `${thompsonScore}%`,
          avgTimeOnPageMs,
          topTriggerSection,
        }
      })
    )

    return NextResponse.json({ experimentId, results })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
