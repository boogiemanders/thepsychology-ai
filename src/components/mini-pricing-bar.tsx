"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { siteConfig } from "@/lib/config"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

type MiniPricingBarProps = {
  show: boolean
  onTierClick?: (tierName: string) => void
}

export function MiniPricingBar({ show, onTierClick }: MiniPricingBarProps) {
  const [isMounted, setIsMounted] = useState(false)

  const tiers = useMemo(() => siteConfig.pricing.pricingItems, [])
  const tierStyles = useMemo(
    () => ({
      "7-Day Free Trial": "brand-pill-olive",
      Pro: "brand-pill-coral",
      "Pro + Coaching": "brand-pill-dusty-rose",
    }),
    []
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const scrollToPricing = () => {
    if (typeof window === "undefined") return
    const section = document.getElementById("get-started")
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  const handleSelect = (tierName: string) => {
    onTierClick?.(tierName)
    scrollToPricing()
  }

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
          <div className="pointer-events-auto w-full max-w-4xl rounded-2xl border border-border/90 bg-background/95 px-4 py-3 shadow-[0px_20px_60px_rgba(15,23,42,0.18)] backdrop-blur supports-[backdrop-filter]:bg-background/85">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              <span>Plans</span>
              <button
                type="button"
                onClick={scrollToPricing}
                className="flex items-center gap-1 text-[0.75rem] font-semibold text-primary"
              >
                See full pricing
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              {tiers.map((tier) => {
                const pillClass = tierStyles[tier.name] ?? "border border-border bg-accent"
                const [amount, period] = tier.displayPrice
                  ? tier.displayPrice.split("/").map((part) => part.trim())
                  : [tier.price, tier.period]

                return (
                  <button
                    key={tier.name}
                    type="button"
                    onClick={() => handleSelect(tier.name)}
                    className={cn(
                      "flex-1 rounded-2xl px-3 py-2 text-left transition-all duration-150 bg-background/80 shadow-sm",
                      pillClass
                    )}
                  >
                    <div className="flex items-center justify-between text-[0.7rem] font-semibold">
                      <span>{tier.name}</span>
                      <span className="text-[0.65rem] text-muted-foreground uppercase tracking-wide">Tap</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-semibold text-current">{amount}</span>
                      {period && <span className="text-[0.7rem] text-muted-foreground">/{period}</span>}
                    </div>
                    <p className="mt-1 text-[0.65rem] leading-4 text-muted-foreground">
                      {tier.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
