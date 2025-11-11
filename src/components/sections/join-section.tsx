"use client"

import { SectionHeader } from "@/components/section-header"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { motion } from "motion/react"

export function JoinSection() {
  const [selectedPlans, setSelectedPlans] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)

  const togglePlan = (plan: string) => {
    setSelectedPlans((prev) => (prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]))
  }

  return (
    <section id="get-started" className="flex flex-col items-center justify-center gap-10 py-20 w-full relative px-6">
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          Get Started Today
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">
          Start your journey to passing the EPPP
        </p>
      </SectionHeader>

      <motion.form
        action="https://formspree.io/f/YOUR_ID"
        method="POST"
        className="w-full max-w-md mx-auto space-y-6 bg-card border border-border rounded-xl p-8 shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Email Section - Hidden until "Get Started" clicked */}
        <motion.div
          className="space-y-2 overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={showForm ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
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
        </motion.div>

        <motion.div
          className="space-y-2 overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={showForm ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut", delay: 0.1 }}
        >
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
        </motion.div>

        <motion.div
          className="space-y-3 overflow-hidden"
          initial={{ height: "auto", opacity: 1 }}
          animate={showForm ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Get Started Today
            </h3>
            <p className="text-sm text-muted-foreground">
              Create your account and choose your learning plan
            </p>
          </div>

          <label className="block text-sm font-medium text-foreground">
            Plan <span className="text-red-500">*</span>
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

          <motion.div
            className="space-y-2 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={showForm ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut", delay: 0.2 }}
          >
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
          </motion.div>
        </motion.div>

        <motion.button
          type={showForm ? "submit" : "button"}
          onClick={(e) => {
            if (!showForm) {
              e.preventDefault()
              setShowForm(true)
            }
          }}
          className="w-full h-11 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity shadow-md"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Get Started Today
        </motion.button>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Educational tool, not therapy. Not affiliated with ASPPB.
        </p>
      </motion.form>
    </section>
  )
}
