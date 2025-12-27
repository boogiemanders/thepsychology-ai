'use client'

import { useMemo, useState, useEffect } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

interface StudyProgressChartProps {
  recentScores: number[]
  averageScore: number
}

const chartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

export function StudyProgressChart({ recentScores, averageScore }: StudyProgressChartProps) {
  // Use brand color that's visible in both light and dark mode
  const chartColor = '#6a9bcc' // Soft Blue - brand color
  const [mutedForeground, setMutedForeground] = useState('hsl(215.4, 16.3%, 46.9%)')
  const [borderColor, setBorderColor] = useState('hsl(214.3, 31.8%, 91.4%)')

  useEffect(() => {
    const updateColors = () => {
      const styles = getComputedStyle(document.documentElement)
      const muted = styles.getPropertyValue('--muted-foreground').trim()
      const border = styles.getPropertyValue('--border').trim()
      if (muted) setMutedForeground(`hsl(${muted})`)
      if (border) setBorderColor(`hsl(${border})`)
    }

    updateColors()

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' || mutation.attributeName === 'style') {
          updateColors()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])
  const chartData = useMemo(() => {
    return recentScores.map((score, idx) => ({
      quiz: `#${idx + 1}`,
      score,
    }))
  }, [recentScores])

  const trend = useMemo(() => {
    if (recentScores.length < 2) return null
    const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2))
    const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    return Math.round(secondAvg - firstAvg)
  }, [recentScores])

  if (recentScores.length < 2) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quiz Performance</CardTitle>
        <CardDescription className="text-xs">
          Last {recentScores.length} quizzes • {averageScore}% average
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer config={chartConfig} className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={borderColor} strokeOpacity={0.3} />
              <XAxis
                dataKey="quiz"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={10}
                tick={{ fill: mutedForeground }}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                fontSize={10}
                width={35}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: mutedForeground }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent labelFormatter={(label) => `Quiz ${label}`} />}
              />
              <defs>
                <linearGradient id="fillProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                dataKey="score"
                type="monotone"
                fill="url(#fillProgress)"
                stroke={chartColor}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      {trend !== null && (
        <CardFooter className="pt-0 pb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {trend > 3 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600">Improving (+{trend}%)</span>
              </>
            ) : trend < -3 ? (
              <>
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-600">Declining ({trend}%)</span>
              </>
            ) : (
              <>
                <Minus className="h-3 w-3" />
                <span>Steady performance</span>
              </>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
