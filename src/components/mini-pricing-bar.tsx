"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { siteConfig } from "@/lib/config"
import { cn } from "@/lib/utils"

type MiniPricingBarProps = {
  show: boolean
  onTierClick?: (tierName: string) => void
}

export function MiniPricingBar({ show, onTierClick }: MiniPricingBarProps) {
  const [isMounted, setIsMounted] = useState(false)

  const tiers = useMemo(() => siteConfig.pricing.pricingItems, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mb-3 flex justify-center px-3 sm:px-4"
        >
          <div className="pointer-events-auto flex w-full max-w-6xl flex-col gap-2 rounded-[28px] border border-border/80 bg-background/90 px-4 py-3 shadow-[0px_35px_90px_rgba(15,23,42,0.15)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              <span>Pricing</span>
              <span>Scroll for full view</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {tiers.map((tier) => {
                const cardClasses = cn(
                  "group relative flex h-full flex-col rounded-2xl border border-border bg-accent/90 px-3 py-2 text-left transition-all duration-150",
                  tier.isPopular &&
                    "shadow-[0px_61px_24px_-10px_rgba(0,0,0,0.01),0px_34px_20px_-8px_rgba(0,0,0,0.05),0px_15px_15px_-6px_rgba(0,0,0,0.09),0px_4px_8px_-2px_rgba(0,0,0,0.10),0px_0px_0px_1px_rgba(0,0,0,0.08)] border-border/60"
                )

                return (
                  <motion.button
                    key={tier.name}
                    type="button"
                    className={cardClasses}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => onTierClick?.(tier.name)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{tier.name}</span>
                        <span className="text-[11px] text-muted-foreground">Includes {tier.features.length}+ tools</span>
                      </div>
                      {tier.isPopular && (
                        <span className="brand-soft-blue-bg text-[11px] font-medium uppercase tracking-tight text-white px-2 py-0.5 rounded-full shadow-[0px_6px_6px_-3px_rgba(0,0,0,0.25)]">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-semibold text-foreground">{tier.price}</span>
                      <span className="text-xs text-muted-foreground">/{tier.period}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{tier.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs font-medium text-primary">
                      <span className="underline-offset-2 group-hover:underline">Select</span>
                      <span className="text-muted-foreground">→</span>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
