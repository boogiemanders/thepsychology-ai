"use client"

import { SectionHeader } from "@/components/section-header"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import Link from "next/link"

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    features: [
      "5 active clients",
      "AI matching",
      "Insurance verification",
      "HIPAA telehealth",
      "Profile listing",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    features: [
      "Unlimited clients",
      "Priority in matching results",
      "Analytics dashboard",
      "Calendar sync",
      "Everything in Free",
    ],
    cta: "Set Up Your Profile",
    highlighted: true,
  },
]

export function ProviderPricingSection() {
  return (
    <section
      id="provider-pricing"
      className="flex flex-col items-center justify-center w-full relative"
    >
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance pb-1">
          What it costs. No asterisks.
        </h2>
      </SectionHeader>

      <div className="w-full max-w-3xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.name}
            className={cn(
              "rounded-xl border p-6 flex flex-col gap-6",
              tier.highlighted
                ? "border-primary/50 bg-primary/[0.02] shadow-sm"
                : "border-border"
            )}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <div>
              <h3 className="text-lg font-semibold tracking-tighter">
                {tier.name}
              </h3>
              <div className="mt-2">
                <span className="text-4xl font-bold tracking-tighter">
                  {tier.price}
                </span>
                <span className="text-muted-foreground">{tier.period}</span>
              </div>
            </div>
            <ul className="space-y-2 flex-1">
              {tier.features.map((f) => (
                <li
                  key={f}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary mt-0.5">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/provider/onboarding">
              <InteractiveHoverButton
                text={tier.cta}
                hoverText="Let's go"
                inverted={tier.highlighted}
                className="w-full justify-center"
              />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-12 text-sm text-muted-foreground leading-relaxed">
        <p>
          The catch: there isn&apos;t one. No percentage of your sessions. No
          rate cuts after you&apos;re dependent on us. Psychology Today charges
          $29.95/month for 1 referral. Headway takes a cut, then cuts your
          rates. We charge a flat fee. That&apos;s it.
        </p>
      </div>
    </section>
  )
}
