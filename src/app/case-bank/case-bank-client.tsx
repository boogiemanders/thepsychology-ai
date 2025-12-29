"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Play, RotateCcw, ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"

type CaseSummary = {
  id: string
  title: string
  domainId: string
  domainLabel: string
  estimatedMinutes: number
  difficulty: "easy" | "medium" | "hard"
  isPremium: boolean
  tags: string[]
  version: number
}

type CaseOption = {
  id: string
  text: string
  nextNodeId: string
  scoreDelta: number
  rationale: string
  isBest?: boolean
}

type CaseNodeDecision = {
  id: string
  type: "decision"
  prompt: string
  options: CaseOption[]
}

type CaseNodeEnd = {
  id: string
  type: "end"
  summary: string
  takeaways: string[]
  recommendedLessons?: { topic: string; domainId?: string }[]
}

type CaseNode = CaseNodeDecision | CaseNodeEnd

type CaseScoring = {
  maxScore: number
  levels: { minScore: number; label: string; message: string }[]
}

type CaseVignette = CaseSummary & {
  rootNodeId: string
  scoring: CaseScoring
  nodes: CaseNode[]
}

type LoadState = "idle" | "loading" | "ready" | "error"

function getScoreLevel(scoring: CaseScoring, score: number) {
  const sorted = [...(scoring?.levels ?? [])].sort((a, b) => b.minScore - a.minScore)
  return sorted.find((level) => score >= level.minScore) ?? null
}

function clampScore(score: number, maxScore: number) {
  if (!Number.isFinite(score)) return 0
  if (!Number.isFinite(maxScore) || maxScore <= 0) return Math.max(0, score)
  return Math.max(0, Math.min(score, maxScore))
}

export function CaseBankClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get("id")
  const domainFilter = searchParams.get("domain")

  const { userProfile } = useAuth()
  const hasProAccess = userProfile?.subscription_tier === "pro" || userProfile?.subscription_tier === "pro_coaching"

  const [listState, setListState] = useState<LoadState>("idle")
  const [cases, setCases] = useState<CaseSummary[]>([])
  const [listError, setListError] = useState<string | null>(null)

  const [caseState, setCaseState] = useState<LoadState>("idle")
  const [activeCase, setActiveCase] = useState<CaseVignette | null>(null)
  const [caseError, setCaseError] = useState<string | null>(null)

  const [lockedDialogOpen, setLockedDialogOpen] = useState(false)
  const [lockedCaseTitle, setLockedCaseTitle] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setListState("loading")
    setListError(null)

    fetch("/api/case-bank")
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load case bank.")
        }
        return data
      })
      .then((data) => {
        if (cancelled) return
        const next = Array.isArray(data?.cases) ? data.cases : []
        setCases(next)
        setListState("ready")
      })
      .catch((err) => {
        if (cancelled) return
        setListError(err instanceof Error ? err.message : "Failed to load case bank.")
        setListState("error")
      })

    return () => {
      cancelled = true
    }
  }, [])

  const selectedSummary = useMemo(() => {
    if (!selectedId) return null
    return cases.find((c) => c.id === selectedId) ?? null
  }, [cases, selectedId])

  const filteredCases = useMemo(() => {
    if (!domainFilter) return cases
    return cases.filter((c) => c.domainId === domainFilter)
  }, [cases, domainFilter])

  const isSelectedLocked = Boolean(selectedSummary?.isPremium && !hasProAccess)

  const clearSelection = useCallback(() => {
    router.replace(domainFilter ? `/case-bank?domain=${encodeURIComponent(domainFilter)}` : "/case-bank")
    setActiveCase(null)
    setCaseState("idle")
    setCaseError(null)
  }, [domainFilter, router])

  const loadCase = useCallback(
    async (caseId: string) => {
      setCaseState("loading")
      setCaseError(null)
      setActiveCase(null)

      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? null

      const response = await fetch(`/api/case-bank?id=${encodeURIComponent(caseId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const error = new Error(payload?.error || "Failed to load case.")
        ;(error as any).requiresPro = payload?.requiresPro === true
        throw error
      }

      const loaded = payload?.case as CaseVignette | undefined
      if (!loaded?.id || !Array.isArray(loaded.nodes)) {
        throw new Error("Invalid case payload.")
      }

      setActiveCase(loaded)
      setCaseState("ready")
    },
    []
  )

  useEffect(() => {
    if (!selectedId) {
      setActiveCase(null)
      setCaseState("idle")
      setCaseError(null)
      return
    }

    if (selectedSummary && selectedSummary.isPremium && !hasProAccess) {
      setLockedCaseTitle(selectedSummary.title)
      setLockedDialogOpen(true)
      clearSelection()
      return
    }

    let cancelled = false

    Promise.resolve()
      .then(() => loadCase(selectedId))
      .catch((err) => {
        if (cancelled) return
        if ((err as any)?.requiresPro === true) {
          setLockedCaseTitle(null)
          setLockedDialogOpen(true)
          clearSelection()
          return
        }
        setCaseError(err instanceof Error ? err.message : "Failed to load case.")
        setCaseState("error")
      })

    return () => {
      cancelled = true
    }
  }, [clearSelection, hasProAccess, loadCase, selectedId, selectedSummary])

  const handleSelectCase = useCallback(
    (summary: CaseSummary) => {
      if (summary.isPremium && !hasProAccess) {
        setLockedCaseTitle(summary.title)
        setLockedDialogOpen(true)
        return
      }
      const href = domainFilter
        ? `/case-bank?domain=${encodeURIComponent(domainFilter)}&id=${encodeURIComponent(summary.id)}`
        : `/case-bank?id=${encodeURIComponent(summary.id)}`
      router.push(href)
    },
    [domainFilter, hasProAccess, router]
  )

  return (
    <main className="w-full px-6 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Branching Case Vignettes</h1>
          <p className="text-muted-foreground">
            Interactive EPPP-style ethics, diagnosis, and treatment scenarios with scoring and rationales.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold tracking-tight">Case Bank</h2>
              <div className="flex items-center gap-3">
                {domainFilter ? (
                  <Button variant="ghost" size="sm" onClick={() => router.replace("/case-bank")}>
                    Clear filter
                  </Button>
                ) : null}
                <Link href="/#get-started" className="text-sm text-primary underline underline-offset-4">
                  Unlock Pro
                </Link>
              </div>
            </div>

            {listState === "loading" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading cases…
              </div>
            )}

            {listState === "error" && (
              <Card className="bg-destructive/10 border-destructive/30">
                <CardContent className="p-4 text-sm text-destructive">
                  {listError || "Failed to load cases."}
                </CardContent>
              </Card>
            )}

            {listState === "ready" && (
              <div className="grid gap-3">
                {filteredCases.length === 0 ? (
                  <Card className="bg-accent/40">
                    <CardContent className="p-4 text-sm text-muted-foreground">
                      No cases found for this domain yet.
                    </CardContent>
                  </Card>
                ) : null}
                {filteredCases.map((c) => {
                  const locked = c.isPremium && !hasProAccess
                  const isActive = selectedId === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCase(c)}
                      className={[
                        "text-left rounded-xl border border-border bg-accent/40 px-4 py-4 hover:bg-accent/60 transition-colors",
                        isActive ? "ring-2 ring-primary/40" : "",
                        locked ? "opacity-90" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <p className="text-base font-semibold text-primary">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.domainLabel}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{c.difficulty}</Badge>
                            <Badge variant="secondary">{c.estimatedMinutes} min</Badge>
                            {c.isPremium ? (
                              <Badge variant="secondary" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Pro
                              </Badge>
                            ) : (
                              <Badge variant="outline">Free</Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">→</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            {!selectedId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pick a case</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Start with the free sample, or unlock Pro for the full case bank.
                </CardContent>
              </Card>
            )}

            {selectedId && caseState === "loading" && (
              <Card>
                <CardContent className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading case…
                </CardContent>
              </Card>
            )}

            {selectedId && caseState === "error" && (
              <Card className="bg-destructive/10 border-destructive/30">
                <CardContent className="p-4 text-sm text-destructive">
                  {caseError || "Failed to load case."}{" "}
                  <Button variant="link" className="px-1 h-auto" onClick={clearSelection}>
                    Back to list
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedId && caseState === "ready" && activeCase && (
              <CaseRunner vignette={activeCase} onBackToList={clearSelection} />
            )}

            {selectedId && listState === "ready" && !selectedSummary && (
              <Card className="bg-accent/40">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  Case not found.{" "}
                  <Button variant="link" className="px-1 h-auto" onClick={clearSelection}>
                    Back to list
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </div>

      <Dialog open={lockedDialogOpen} onOpenChange={setLockedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pro Case Bank</DialogTitle>
            <DialogDescription>
              {lockedCaseTitle ? `"${lockedCaseTitle}" is a Pro case.` : "This case is a Pro case."} Unlock Pro to access the full
              bank of branching vignettes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Link href="/#get-started">
              <Button>Unlock Pro</Button>
            </Link>
            <Button variant="outline" onClick={() => setLockedDialogOpen(false)}>
              Not now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function CaseRunner({ vignette, onBackToList }: { vignette: CaseVignette; onBackToList: () => void }) {
  const nodesById = useMemo(() => new Map(vignette.nodes.map((n) => [n.id, n])), [vignette.nodes])
  const decisionCount = useMemo(
    () => vignette.nodes.filter((n) => n.type === "decision").length,
    [vignette.nodes]
  )

  const [nodeId, setNodeId] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [history, setHistory] = useState<{ nodeId: string; optionId: string; scoreDelta: number; nextNodeId: string }[]>([])
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const start = useCallback(() => {
    setNodeId(vignette.rootNodeId)
    setScore(0)
    setHistory([])
    setSelectedOptionId(null)
    setRevealed(false)
  }, [vignette.rootNodeId])

  const restart = useCallback(() => start(), [start])

  const currentNode = nodeId ? nodesById.get(nodeId) ?? null : null
  const currentDecision = currentNode?.type === "decision" ? currentNode : null
  const currentEnd = currentNode?.type === "end" ? currentNode : null
  const selectedOption =
    currentDecision && selectedOptionId
      ? currentDecision.options.find((o) => o.id === selectedOptionId) ?? null
      : null

  const progressValue = useMemo(() => {
    if (!decisionCount) return 0
    if (currentEnd) return 100
    return Math.min(100, Math.round((history.length / decisionCount) * 100))
  }, [currentEnd, decisionCount, history.length])

  const scoreDisplay = clampScore(score, vignette.scoring.maxScore)
  const level = useMemo(() => getScoreLevel(vignette.scoring, scoreDisplay), [scoreDisplay, vignette.scoring])

  const handleChoose = useCallback(
    (option: CaseOption) => {
      if (!currentDecision || revealed) return
      setSelectedOptionId(option.id)
      setScore((prev) => prev + option.scoreDelta)
      setRevealed(true)
    },
    [currentDecision, revealed]
  )

  const handleContinue = useCallback(() => {
    if (!currentDecision || !selectedOption || !revealed) return
    setHistory((prev) => [
      ...prev,
      {
        nodeId: currentDecision.id,
        optionId: selectedOption.id,
        scoreDelta: selectedOption.scoreDelta,
        nextNodeId: selectedOption.nextNodeId,
      },
    ])
    setNodeId(selectedOption.nextNodeId)
    setSelectedOptionId(null)
    setRevealed(false)
  }, [currentDecision, revealed, selectedOption])

  const handleBack = useCallback(() => {
    if (history.length === 0) return
    const last = history[history.length - 1]
    setHistory((prev) => prev.slice(0, -1))
    setNodeId(last.nodeId)
    setScore((prev) => prev - last.scoreDelta)
    setSelectedOptionId(null)
    setRevealed(false)
  }, [history])

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl">{vignette.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{vignette.domainLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{vignette.difficulty}</Badge>
            {vignette.isPremium ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Pro
              </Badge>
            ) : (
              <Badge variant="outline">Free</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Score: {scoreDisplay}/{vignette.scoring.maxScore}
          </div>
          <div className="text-sm text-muted-foreground">{vignette.estimatedMinutes} min</div>
        </div>

        <Progress value={progressValue} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        {!nodeId ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You’ll make a few decisions. After each choice, you’ll see the rationale and how it affects your score.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={start} className="gap-2">
                <Play className="h-4 w-4" />
                Start case
              </Button>
              <Button variant="outline" onClick={onBackToList} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to list
              </Button>
            </div>
          </div>
        ) : currentDecision ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-base font-medium leading-relaxed">{currentDecision.prompt}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              {currentDecision.options.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id
                const letter = String.fromCharCode(65 + idx)
                const isCorrect = revealed && opt.isBest === true
                const showWrong = revealed && isSelected && opt.isBest !== true
                return (
                  <Button
                    key={`${currentDecision.id}:${opt.id}`}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={[
                      "w-full justify-start text-left h-auto whitespace-normal",
                      isCorrect ? "border-[#788c5d] bg-[#788c5d]/10 text-foreground" : "",
                      showWrong ? "border-[#d87758] bg-[#d87758]/10 text-foreground" : "",
                    ].join(" ")}
                    onClick={() => handleChoose(opt)}
                    disabled={revealed}
                  >
                    <span className="mr-2 font-mono">{letter}.</span>
                    <span>{opt.text}</span>
                  </Button>
                )
              })}
            </div>

            {revealed && selectedOption ? (
              <div className="space-y-3 pt-2">
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  <div className="font-semibold text-foreground">Rationale</div>
                  <div className="mt-1">{selectedOption.rationale}</div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">
                    {selectedOption.isBest ? (
                      <span className="text-[#788c5d] font-semibold">Best choice</span>
                    ) : (
                      <span className="text-[#d87758] font-semibold">Not the best</span>
                    )}{" "}
                    · Score change: {selectedOption.scoreDelta >= 0 ? `+${selectedOption.scoreDelta}` : selectedOption.scoreDelta}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleBack} disabled={history.length === 0}>
                      Back
                    </Button>
                    <Button size="sm" onClick={handleContinue}>
                      Continue
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 pt-2">
                <Button variant="outline" onClick={handleBack} disabled={history.length === 0}>
                  Back
                </Button>
                <Button variant="ghost" onClick={restart} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Restart
                </Button>
              </div>
            )}
          </div>
        ) : currentEnd ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-lg font-semibold">Case complete</div>
              {level ? (
                <div className="rounded-xl border border-border bg-accent/40 p-4 space-y-1">
                  <div className="text-sm font-semibold text-primary">{level.label}</div>
                  <div className="text-sm text-muted-foreground">{level.message}</div>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <div className="text-sm font-semibold text-foreground">Summary</div>
              <p className="text-sm text-muted-foreground">{currentEnd.summary}</p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-foreground">Key takeaways</div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {currentEnd.takeaways.map((t, idx) => (
                  <li key={`${currentEnd.id}:t${idx}`}>{t}</li>
                ))}
              </ul>
            </div>

            {Array.isArray(currentEnd.recommendedLessons) && currentEnd.recommendedLessons.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-foreground">Recommended review</div>
                <div className="flex flex-wrap gap-2">
                  {currentEnd.recommendedLessons.map((lesson) => {
                    const href = `/topic-teacher?topic=${encodeURIComponent(lesson.topic)}${
                      lesson.domainId ? `&domain=${encodeURIComponent(lesson.domainId)}` : ""
                    }`
                    return (
                      <Link key={`${lesson.topic}:${lesson.domainId ?? ""}`} href={href}>
                        <Button variant="outline" size="sm" className="gap-2">
                          {lesson.topic}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button onClick={restart} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Run again
              </Button>
              <Button variant="outline" onClick={onBackToList} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to list
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">This case has an invalid node reference.</p>
            <Button variant="outline" onClick={restart}>
              Restart
            </Button>
          </div>
        )}

        <Separator />

        <p className="text-xs text-muted-foreground">
          Educational only. Jurisdiction-specific laws and guidelines vary; always consult current regulations and supervision.
        </p>
      </CardContent>
    </Card>
  )
}
