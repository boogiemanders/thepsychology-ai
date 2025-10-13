"use client";

import { SectionHeader } from "@/components/section-header";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function JoinSection() {
  const [selectedPlan, setSelectedPlan] = useState("free");

  return (
    <section
      id="join"
      className="flex flex-col items-center justify-center gap-10 py-20 w-full relative px-6"
    >
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          Join the Waitlist
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
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground"
          >
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
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-foreground"
          >
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
          </label>
          <div className="space-y-2">
            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                selectedPlan === "free"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <input
                type="radio"
                name="plan"
                value="free"
                checked={selectedPlan === "free"}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm">7-Day Free Trial</span>
            </label>

            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                selectedPlan === "pro-20"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <input
                type="radio"
                name="plan"
                value="pro-20"
                checked={selectedPlan === "pro-20"}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm">Pro - $20/month</span>
            </label>

            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                selectedPlan === "coaching-100-200"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <input
                type="radio"
                name="plan"
                value="coaching-100-200"
                checked={selectedPlan === "coaching-100-200"}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm">Coaching - $100–$200/month</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-foreground"
          >
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
          Join the waitlist
        </button>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Educational tool, not therapy. Not affiliated with ASPPB.
        </p>
      </form>
    </section>
  );
}
