"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface ProviderWaitlistFormProps {
  source?: string
}

export function ProviderWaitlistForm({ source }: ProviderWaitlistFormProps) {
  const [email, setEmail] = useState("")
  const [note, setNote] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("submitting")
    setErrorMsg(null)
    try {
      const res = await fetch("/api/provider/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, note, source }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data?.error || "Something went wrong.")
        setStatus("error")
        return
      }
      setStatus("success")
    } catch {
      setErrorMsg("Network error. Try again.")
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="w-full max-w-md mx-auto rounded-lg border border-border bg-card p-5 text-center">
        <p className="text-sm font-medium">Thanks. You are on the list.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          I will send pilot updates as we build. No spam.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-3 text-left">
      <div className="space-y-1.5">
        <Input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          aria-label="Email address"
        />
      </div>
      <div className="space-y-1.5">
        <Textarea
          placeholder="Optional: biggest problem you have with provider platforms"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={status === "submitting"}
          rows={2}
          aria-label="Optional note about your biggest platform problem"
        />
      </div>
      <Button
        type="submit"
        disabled={status === "submitting" || !email.trim()}
        className="w-full"
      >
        {status === "submitting" ? "Joining..." : "Join the early access list"}
      </Button>
      {errorMsg && (
        <p className="text-sm text-destructive text-center">{errorMsg}</p>
      )}
      <p className="text-xs text-muted-foreground text-center">
        Email only. No account needed. Unsubscribe anytime.
      </p>
    </form>
  )
}
