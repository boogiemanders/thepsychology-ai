"use client"

import { SectionHeader } from "@/components/section-header"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function JoinSection() {
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])

  const togglePlan = (plan: string) => {
    setSelectedPlans((prev) => (prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]))
  }

  return (
    <section id="join" className="flex flex-col items-center justify-center gap-10 py-20 w-full relative px-6">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          Get Started Today
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">
          Start your journey to passing the EPPP
        </p>
      </SectionHeader>

      <form
        action="https://formspree.io/f/YOUR_ID"
        method="POST"
        className="w-full max-w-md mx-auto space-y-6 bg-card border border-border rounded-xl p-8 shadow-sm"
      >
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="your.email@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">
            Phone (optional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Plan <span className="text-red-500">*</span>
            <span className="text-xs text-muted-foreground ml-2">(Select all that interest you)</span>
          </label>
          <div className="space-y-2">
            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                selectedPlans.includes("free") ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
              )}
            >
              <input
                type="checkbox"
                name="plan"
                value="free"
                checked={selectedPlans.includes("free")}
                onChange={() => togglePlan("free")}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary rounded"
              />
              <span className="text-sm">7-Day Free Trial</span>
            </label>

            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                selectedPlans.includes("pro-20") ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
              )}
            >
              <input
                type="checkbox"
                name="plan"
                value="pro-20"
                checked={selectedPlans.includes("pro-20")}
                onChange={() => togglePlan("pro-20")}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary rounded"
              />
              <span className="text-sm">Pro - $20/month</span>
            </label>

            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                selectedPlans.includes("coaching-200")
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <input
                type="checkbox"
                name="plan"
                value="coaching-200"
                checked={selectedPlans.includes("coaching-200")}
                onChange={() => togglePlan("coaching-200")}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary rounded"
              />
              <span className="text-sm">Coaching - $200/month</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="block text-sm font-medium text-foreground">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            placeholder="Tell us about your study goals or any questions you have..."
          />
        </div>

        <button
          type="submit"
          className="w-full h-11 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity shadow-md"
        >
          Get Started Today
        </button>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Educational tool, not therapy. Not affiliated with ASPPB.
        </p>
      </form>
    </section>
  )
}
