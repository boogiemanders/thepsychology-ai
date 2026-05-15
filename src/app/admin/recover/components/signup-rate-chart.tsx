'use client'

import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

type SignupRatePoint = {
  date: string
  signups: number
  paid: number
}

const chartConfig = {
  signups: {
    label: 'New signups',
    color: 'hsl(217 91% 60%)',
  },
  paid: {
    label: 'Stripe paid',
    color: 'hsl(142 71% 45%)',
  },
} satisfies ChartConfig

export function SignupRateChart({ data }: { data: SignupRatePoint[] }) {
  const chartData = useMemo(
    () =>
      data.map((p) => ({
        ...p,
        label: format(new Date(p.date + 'T00:00:00'), 'MMM d'),
      })),
    [data]
  )

  const totalSignups = useMemo(() => data.reduce((sum, p) => sum + p.signups, 0), [data])
  const totalPaid = useMemo(() => data.reduce((sum, p) => sum + p.paid, 0), [data])
  const conversionRate = totalSignups > 0 ? (totalPaid / totalSignups) * 100 : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm">Signup rate</CardTitle>
            <CardDescription className="text-xs">
              New signups vs. Stripe paid users per day
            </CardDescription>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <div className="text-xs text-muted-foreground">Signups</div>
              <div className="text-lg font-semibold" style={{ color: 'hsl(217 91% 60%)' }}>
                {totalSignups}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Paid</div>
              <div className="text-lg font-semibold" style={{ color: 'hsl(142 71% 45%)' }}>
                {totalPaid}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Conv.</div>
              <div className="text-lg font-semibold">{conversionRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <LineChart data={chartData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              minTickGap={20}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={10}
              width={32}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeOpacity: 0.2 }}
              content={<ChartTooltipContent labelFormatter={(label) => label} />}
            />
            <Line
              dataKey="signups"
              type="monotone"
              stroke="var(--color-signups)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              dataKey="paid"
              type="monotone"
              stroke="var(--color-paid)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
