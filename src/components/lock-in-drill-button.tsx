"use client"

import { useCallback, useMemo, useState } from "react"
import { Loader2, Zap, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type LockInDrillButtonProps = {
  topicName: string
  domainId: string | null
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  selectedAnswer: string
  relatedSections: string[] | null
  userId: string | null
}

type DrillLevel = "easier" | "same" | "harder"

type DrillQuestion = {
  level: DrillLevel
  stem: string
  options: string[]
  answer: string
  explanation: string
}

type LoadState = "idle" | "loading" | "ready" | "error"

function normalizeLockInLevel(value: unknown): DrillLevel | null {
  const normalized = String(value || "").trim().toLowerCase()
  if (normalized === "easier") return "easier"
  if (normalized === "harder") return "harder"
  return null
}

export function LockInDrillButton(props: LockInDrillButtonProps) {
  const [open, setOpen] = useState(false)
  const [loadState, setLoadState] = useState<LoadState>("idle")
  const [error, setError] = useState<string | null>(null)

  const [drillQuestions, setDrillQuestions] = useState<DrillQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<(boolean | null)[]>([])

  const score = useMemo(() => results.filter(Boolean).length, [results])
  const current = drillQuestions[index] ?? null
  const currentResult = results[index] ?? null

  const resetSession = useCallback(() => {
    setLoadState("idle")
    setError(null)
    setDrillQuestions([])
    setIndex(0)
    setSelected(null)
    setRevealed(false)
    setResults([])
  }, [])

  const startDrill = useCallback(async () => {
    if (loadState === "loading") return
    setLoadState("loading")
    setError(null)

    try {
      const response = await fetch("/api/lock-in-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: props.topicName,
          domain: props.domainId,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to load lock-in questions.")
      }

      const data = await response.json().catch(() => ({}))
      const bank = Array.isArray(data?.questions) ? data.questions : []

      const parsed = bank
        .map((q: any) => {
          const level = normalizeLockInLevel(q?.lock_in_level)
          const stem = String(q?.stem || "").trim()
          const options = Array.isArray(q?.options) ? q.options.map((o: any) => String(o || "").trim()).filter(Boolean) : []
          const answer = String(q?.answer || "").trim()
          const explanation = String(q?.explanation || "").trim()
          if (!level || !stem || options.length !== 4 || !answer || !options.includes(answer) || !explanation) return null
          return { level, stem, options, answer, explanation } satisfies DrillQuestion
        })
        .filter(Boolean) as DrillQuestion[]

      const easier = parsed.find((q) => q.level === "easier") ?? null
      const harder = parsed.find((q) => q.level === "harder") ?? null
      const base: DrillQuestion = {
        level: "same",
        stem: props.question,
        options: props.options,
        answer: props.correctAnswer,
        explanation: props.explanation,
      }

      const next = [easier, base, harder].filter(Boolean) as DrillQuestion[]
      if (next.length < 3) {
        throw new Error("Not enough lock-in questions found for this lesson.")
      }

      setDrillQuestions(next)
      setResults(new Array(next.length).fill(null))
      setIndex(0)
      setSelected(null)
      setRevealed(false)
      setLoadState("ready")
    } catch (err) {
      console.error("[LockInDrillButton] Error:", err)
      setError(err instanceof Error ? err.message : "Failed to load lock-in questions.")
      setLoadState("error")
    }
  }, [loadState, props.correctAnswer, props.domainId, props.explanation, props.options, props.question, props.topicName])

  const handleOpen = useCallback(() => {
    setOpen(true)
    if (loadState === "idle") startDrill()
  }, [loadState, startDrill])

  const handleCheck = useCallback(() => {
    if (!current || !selected || revealed) return
    const isCorrect = selected === current.answer
    setResults((prev) => {
      const next = [...prev]
      next[index] = isCorrect
      return next
    })
    setRevealed(true)
  }, [current, index, revealed, selected])

  const handleNext = useCallback(() => {
    setIndex((prev) => prev + 1)
    setSelected(null)
    setRevealed(false)
  }, [])

  const levelBadge =
    current?.level === "easier"
      ? { label: "Easier", variant: "secondary" as const }
      : current?.level === "harder"
        ? { label: "Harder", variant: "secondary" as const }
        : { label: "Same", variant: "outline" as const }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen} className="gap-2">
        <Zap className="h-4 w-4" style={{ color: '#d87758' }} />
        Lock‑In Drill
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetSession()
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lock‑In Drill</DialogTitle>
            <DialogDescription>3 questions: easier → same → harder</DialogDescription>
          </DialogHeader>

          {loadState === "loading" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading your drill…
            </div>
          )}

          {loadState === "error" && (
            <div className="space-y-3">
              <p className="text-sm text-red-500">{error || "Failed to load lock-in questions."}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    resetSession()
                    startDrill()
                  }}
                >
                  Retry
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {loadState === "ready" && current && index < drillQuestions.length && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={levelBadge.variant}>{levelBadge.label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Question {index + 1} of {drillQuestions.length}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">Score: {score}/{drillQuestions.length}</span>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="text-base font-medium leading-relaxed">{current.stem}</div>

                <div className="space-y-2">
                  {current.options.map((option, optionIndex) => {
                    const letter = String.fromCharCode(65 + optionIndex)
                    const isSelected = selected === option
                    const isCorrect = revealed && option === current.answer
                    const isWrongSelected = revealed && isSelected && option !== current.answer

                    return (
                      <Button
                        key={`${current.level}:${option}`}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className={[
                          "w-full justify-start text-left h-auto whitespace-normal",
                          isCorrect ? "border-[#788c5d] bg-[#788c5d]/10 text-foreground" : "",
                          isWrongSelected ? "border-[#d87758] bg-[#d87758]/10 text-foreground" : "",
                        ].join(" ")}
                        onClick={() => {
                          if (revealed) return
                          setSelected(option)
                        }}
                        disabled={revealed}
                      >
                        <span className="mr-2 font-mono">{letter}.</span>
                        <span>{option}</span>
                      </Button>
                    )
                  })}
                </div>

                {!revealed ? (
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button size="sm" onClick={handleCheck} disabled={!selected}>
                      Check
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      {currentResult ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-[#788c5d]" />
                          <span className="text-[#788c5d]">Correct</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-[#d87758]" />
                          <span className="text-[#d87758]">Not quite</span>
                        </>
                      )}
                      <span className="text-muted-foreground">Answer: {current.answer}</span>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                      {current.explanation}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" onClick={handleNext}>
                        {index === drillQuestions.length - 1 ? "Finish" : "Next"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {loadState === "ready" && index >= drillQuestions.length && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-base font-semibold">Drill complete</div>
                <div className="text-sm text-muted-foreground">
                  You got {score} of {drillQuestions.length} correct.
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    resetSession()
                    startDrill()
                  }}
                >
                  Run Again
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Fallback for unexpected state - prevents blank dialog */}
          {loadState === "ready" && !current && index < drillQuestions.length && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Something went wrong loading the question.</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    resetSession()
                    startDrill()
                  }}
                >
                  Retry
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
