'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

type PracticeExam = {
  id: string
  created_at: string
  exam_mode: string
  score: number
  total_questions: number
}

interface ExamScoreTrendChartProps {
  exams: PracticeExam[]
}

const chartConfig = {
  percentage: {
    label: 'Score %',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export function ExamScoreTrendChart({ exams }: ExamScoreTrendChartProps) {
  const chartData = useMemo(() => {
    return [...exams]
      .reverse()
      .map((exam) => ({
        date: format(new Date(exam.created_at), 'MMM d'),
        percentage: exam.total_questions > 0 ? Math.round((exam.score / exam.total_questions) * 100) : 0,
        mode: exam.exam_mode,
      }))
  }, [exams])

  const trend = useMemo(() => {
    if (chartData.length < 2) return null
    const first = chartData[0].percentage
    const last = chartData[chartData.length - 1].percentage
    return last - first
  }, [chartData])

  if (exams.length < 2) return null

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">Exam Score Trend</CardTitle>
        <CardDescription className="text-xs">
          Performance over {exams.length} practice exams
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer config={chartConfig} className="h-[120px] w-full">
          <AreaChart data={chartData} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={10} width={40} tickFormatter={(v) => `${v}%`} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={(label) => label} />}
            />
            <defs>
              <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-percentage)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-percentage)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              dataKey="percentage"
              type="monotone"
              fill="url(#fillScore)"
              stroke="var(--color-percentage)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      {trend !== null && (
        <CardFooter className="py-2 px-6">
          <div className="flex items-center gap-2 text-xs">
            {trend > 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-600">+{trend}% improvement</span>
              </>
            ) : trend < 0 ? (
              <>
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-600">{trend}% decline</span>
              </>
            ) : (
              <>
                <Minus className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">No change</span>
              </>
            )}
            <span className="text-muted-foreground">since first exam</span>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
