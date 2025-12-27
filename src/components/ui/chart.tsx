'use client'

import * as React from 'react'
import { Tooltip, type TooltipProps } from 'recharts'

import { cn } from '@/lib/utils'

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    color?: string
  }
>

const ChartConfigContext = React.createContext<ChartConfig | null>(null)

function useChartConfig(): ChartConfig {
  return React.useContext(ChartConfigContext) ?? {}
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { config: ChartConfig }
>(({ className, config, style, children, ...props }, ref) => {
  const resolvedStyle = React.useMemo(() => {
    const cssVars: Record<string, string> = {}
    for (const [key, entry] of Object.entries(config)) {
      if (entry?.color) cssVars[`--color-${key}`] = entry.color
    }
    return cssVars as React.CSSProperties
  }, [config])

  return (
    <ChartConfigContext.Provider value={config}>
      <div
        ref={ref}
        className={cn('w-full', className)}
        style={{ ...resolvedStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    </ChartConfigContext.Provider>
  )
})
ChartContainer.displayName = 'ChartContainer'

const ChartTooltip = Tooltip

type ChartTooltipContentProps = Omit<TooltipProps<number, string>, 'content'> & {
  className?: string
  labelFormatter?: (label: unknown) => React.ReactNode
}

function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  className,
}: ChartTooltipContentProps) {
  const config = useChartConfig()

  if (!active || !payload || payload.length === 0) return null

  const formattedLabel = labelFormatter ? labelFormatter(label) : String(label ?? '')

  return (
    <div className={cn('rounded-md border bg-background px-3 py-2 text-xs shadow-sm', className)}>
      {formattedLabel ? (
        <div className="mb-2 font-medium text-foreground">{formattedLabel}</div>
      ) : null}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const key = String(entry.dataKey ?? entry.name ?? index)
          const cfg = config[key]
          const value = entry.value
          const color = cfg?.color || (typeof entry.color === 'string' ? entry.color : undefined)

          return (
            <div key={`${key}-${index}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: color || 'hsl(var(--muted-foreground))' }}
                />
                <span>{cfg?.label ?? key}</span>
              </div>
              <div className="font-medium text-foreground">{value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }

