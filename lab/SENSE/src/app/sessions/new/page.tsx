'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Copy, Save } from 'lucide-react'
import { DOMAINS, STATE_TAGS, BODY_SYSTEMS, CONTEXTS, SENSORY_MODIFIERS, PRACTICE_FREQUENCIES, RATING_LABELS } from '@/lib/enums'
import { INTERVENTIONS, getInterventionsByDomain, type Intervention } from '@/lib/interventions'
import { generateNote } from '@/lib/renderTemplate'

interface SessionData {
  // Step 1
  somaticRating: number
  emotionalRating: number
  neurologicalRating: number
  socialRating: number
  environmentalRating: number
  stateTag: string
  bodySystem: string
  context: string
  sensoryModifiers: string[]
  // Step 2
  hypothesis1: string
  hypothesis2: string
  // Step 3
  targets: string[]
  interventionId: string
  measure: string
  practiceFrequency: string
}

const initialData: SessionData = {
  somaticRating: 3,
  emotionalRating: 3,
  neurologicalRating: 3,
  socialRating: 3,
  environmentalRating: 3,
  stateTag: '',
  bodySystem: '',
  context: '',
  sensoryModifiers: [],
  hypothesis1: '',
  hypothesis2: '',
  targets: [''],
  interventionId: '',
  measure: '',
  practiceFrequency: '',
}

function SessionWizardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('clientId')

  const [step, setStep] = useState(1)
  const [data, setData] = useState<SessionData>(initialData)
  const [client, setClient] = useState<{ name: string; age?: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generatedNote, setGeneratedNote] = useState('')

  useEffect(() => {
    if (clientId) {
      fetch(`/SENSE/api/clients/${clientId}`)
        .then(res => res.json())
        .then(data => setClient(data))
        .catch(console.error)
    }
  }, [clientId])

  // Generate note when reaching step 4
  useEffect(() => {
    if (step === 4 && client) {
      const intervention = INTERVENTIONS.find(i => i.id === data.interventionId)
      const note = generateNote({
        clientName: client.name,
        clientAge: client.age,
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        context: CONTEXTS.find(c => c.id === data.context)?.label,
        somaticRating: data.somaticRating,
        emotionalRating: data.emotionalRating,
        neurologicalRating: data.neurologicalRating,
        socialRating: data.socialRating,
        environmentalRating: data.environmentalRating,
        stateTag: data.stateTag,
        bodySystem: data.bodySystem,
        sensoryModifiers: JSON.stringify(data.sensoryModifiers),
        hypothesis1: data.hypothesis1,
        hypothesis2: data.hypothesis2,
        targets: JSON.stringify(data.targets.filter(t => t.trim())),
        interventionId: data.interventionId,
        interventionName: intervention?.name,
        measure: data.measure,
        practiceFrequency: PRACTICE_FREQUENCIES.find(f => f.id === data.practiceFrequency)?.label,
      })
      setGeneratedNote(note)
    }
  }, [step, data, client])

  function validateHypothesis(text: string): boolean {
    const lower = text.toLowerCase()
    return lower.includes('may') || lower.includes('might')
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return !!data.stateTag
      case 2:
        return validateHypothesis(data.hypothesis1) && validateHypothesis(data.hypothesis2)
      case 3:
        return data.targets.some(t => t.trim()) && !!data.interventionId
      default:
        return true
    }
  }

  async function handleSave() {
    if (!clientId) return

    setLoading(true)
    try {
      const intervention = INTERVENTIONS.find(i => i.id === data.interventionId)
      const response = await fetch('/SENSE/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          ...data,
          sensoryModifiers: JSON.stringify(data.sensoryModifiers),
          targets: JSON.stringify(data.targets.filter(t => t.trim())),
          interventionName: intervention?.name,
          exportedNote: generatedNote,
          noteExportedAt: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        router.push(`/clients/${clientId}`)
      }
    } catch (error) {
      console.error('Failed to save session:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedNote)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!clientId) {
    return (
      <div className="text-center py-12">
        <p>No client selected</p>
        <Link href="/" className="text-[var(--primary)] underline mt-2 inline-block">
          Go back
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Link
          href={`/clients/${clientId}`}
          className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors tap-target"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Session</h1>
          {client && <p className="text-sm text-[var(--muted-foreground)]">{client.name}</p>}
        </div>
      </header>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full transition-colors ${
              s <= step ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
            }`}
          />
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between text-sm text-[var(--muted-foreground)]">
        <span className={step === 1 ? 'text-[var(--foreground)] font-medium' : ''}>Baseline</span>
        <span className={step === 2 ? 'text-[var(--foreground)] font-medium' : ''}>Hypotheses</span>
        <span className={step === 3 ? 'text-[var(--foreground)] font-medium' : ''}>Plan</span>
        <span className={step === 4 ? 'text-[var(--foreground)] font-medium' : ''}>Export</span>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <Step1Baseline data={data} setData={setData} />
      )}
      {step === 2 && (
        <Step2Hypotheses data={data} setData={setData} validateHypothesis={validateHypothesis} />
      )}
      {step === 3 && (
        <Step3Plan data={data} setData={setData} />
      )}
      {step === 4 && (
        <Step4Export
          note={generatedNote}
          onCopy={handleCopy}
          copied={copied}
        />
      )}

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--background)] border-t border-[var(--border)]">
        <div className="max-w-screen-md mx-auto flex gap-4">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-4 rounded-lg border border-[var(--border)] font-medium tap-target"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 py-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium disabled:opacity-50 tap-target flex items-center justify-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium disabled:opacity-50 tap-target flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Session'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Step 1: Baseline Profile
function Step1Baseline({
  data,
  setData
}: {
  data: SessionData
  setData: (d: SessionData) => void
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Baseline Profile</h2>

      {/* Domain Sliders */}
      <div className="space-y-6">
        {DOMAINS.map((domain) => {
          const key = `${domain.id}Rating` as keyof SessionData
          const value = data[key] as number

          return (
            <div key={domain.id} className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="font-medium">{domain.label}</label>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {RATING_LABELS.find(r => r.value === value)?.label}
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">{domain.description}</p>
              <input
                type="range"
                min="1"
                max="5"
                value={value}
                onChange={(e) => setData({ ...data, [key]: parseInt(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none bg-[var(--muted)] cursor-pointer"
              />
              <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* State Tag */}
      <div className="space-y-2">
        <label className="font-medium">State Tag *</label>
        <div className="grid grid-cols-2 gap-2">
          {STATE_TAGS.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setData({ ...data, stateTag: tag.id })}
              className={`p-3 rounded-lg border transition-colors tap-target ${
                data.stateTag === tag.id
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                  : 'border-[var(--border)]'
              }`}
              style={{
                borderColor: data.stateTag === tag.id ? tag.color : undefined,
                backgroundColor: data.stateTag === tag.id ? `${tag.color}15` : undefined,
              }}
            >
              <span
                className="font-medium"
                style={{ color: data.stateTag === tag.id ? tag.color : undefined }}
              >
                {tag.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Body System */}
      <div className="space-y-2">
        <label className="font-medium">Primary Body System</label>
        <select
          value={data.bodySystem}
          onChange={(e) => setData({ ...data, bodySystem: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] tap-target"
        >
          <option value="">Select...</option>
          {BODY_SYSTEMS.map((system) => (
            <option key={system.id} value={system.id}>{system.label}</option>
          ))}
        </select>
      </div>

      {/* Context */}
      <div className="space-y-2">
        <label className="font-medium">Session Context</label>
        <select
          value={data.context}
          onChange={(e) => setData({ ...data, context: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] tap-target"
        >
          <option value="">Select...</option>
          {CONTEXTS.map((ctx) => (
            <option key={ctx.id} value={ctx.id}>{ctx.label}</option>
          ))}
        </select>
      </div>

      {/* Sensory Modifiers */}
      <div className="space-y-2">
        <label className="font-medium">Sensory Modifiers</label>
        <p className="text-sm text-[var(--muted-foreground)]">Select all that apply</p>
        <div className="space-y-2">
          {SENSORY_MODIFIERS.map((modifier) => (
            <label
              key={modifier.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer tap-target ${
                data.sensoryModifiers.includes(modifier.id)
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                  : 'border-[var(--border)]'
              }`}
            >
              <input
                type="checkbox"
                checked={data.sensoryModifiers.includes(modifier.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setData({ ...data, sensoryModifiers: [...data.sensoryModifiers, modifier.id] })
                  } else {
                    setData({ ...data, sensoryModifiers: data.sensoryModifiers.filter(m => m !== modifier.id) })
                  }
                }}
                className="w-5 h-5 rounded"
              />
              <span>{modifier.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// Step 2: Hypothesis Builder
function Step2Hypotheses({
  data,
  setData,
  validateHypothesis
}: {
  data: SessionData
  setData: (d: SessionData) => void
  validateHypothesis: (text: string) => boolean
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Clinical Hypotheses</h2>

      <div className="p-4 rounded-lg bg-[var(--muted)] text-sm">
        <p>
          Frame hypotheses as possibilities using <strong>"may"</strong> or <strong>"might"</strong>.
        </p>
        <p className="mt-2 text-[var(--muted-foreground)]">
          Example: "Vestibular seeking behavior <em>may</em> be an attempt to regulate an underresponsive proprioceptive system."
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="font-medium">Hypothesis 1 *</label>
          <textarea
            value={data.hypothesis1}
            onChange={(e) => setData({ ...data, hypothesis1: e.target.value })}
            placeholder="Sensory processing may..."
            rows={3}
            className={`w-full px-4 py-3 rounded-lg border bg-[var(--background)] resize-none ${
              data.hypothesis1 && !validateHypothesis(data.hypothesis1)
                ? 'border-[var(--destructive)]'
                : 'border-[var(--border)]'
            }`}
          />
          {data.hypothesis1 && !validateHypothesis(data.hypothesis1) && (
            <p className="text-sm text-[var(--destructive)]">
              Must include "may" or "might"
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="font-medium">Hypothesis 2 *</label>
          <textarea
            value={data.hypothesis2}
            onChange={(e) => setData({ ...data, hypothesis2: e.target.value })}
            placeholder="Environmental factors might..."
            rows={3}
            className={`w-full px-4 py-3 rounded-lg border bg-[var(--background)] resize-none ${
              data.hypothesis2 && !validateHypothesis(data.hypothesis2)
                ? 'border-[var(--destructive)]'
                : 'border-[var(--border)]'
            }`}
          />
          {data.hypothesis2 && !validateHypothesis(data.hypothesis2) && (
            <p className="text-sm text-[var(--destructive)]">
              Must include "may" or "might"
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Step 3: Plan Builder
function Step3Plan({
  data,
  setData
}: {
  data: SessionData
  setData: (d: SessionData) => void
}) {
  const selectedIntervention = INTERVENTIONS.find(i => i.id === data.interventionId)

  // Get recommended interventions based on highest-rated domains
  const domainRatings = [
    { id: 'somatic' as const, rating: data.somaticRating },
    { id: 'emotional' as const, rating: data.emotionalRating },
    { id: 'neurological' as const, rating: data.neurologicalRating },
    { id: 'social' as const, rating: data.socialRating },
    { id: 'environmental' as const, rating: data.environmentalRating },
  ].sort((a, b) => b.rating - a.rating)

  const topDomain = domainRatings[0].id
  const recommendedInterventions = getInterventionsByDomain(topDomain)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Treatment Plan</h2>

      {/* Targets */}
      <div className="space-y-2">
        <label className="font-medium">Targets *</label>
        <p className="text-sm text-[var(--muted-foreground)]">What are the goals for this intervention?</p>
        {data.targets.map((target, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={target}
              onChange={(e) => {
                const newTargets = [...data.targets]
                newTargets[i] = e.target.value
                setData({ ...data, targets: newTargets })
              }}
              placeholder={`Target ${i + 1}`}
              className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] tap-target"
            />
            {data.targets.length > 1 && (
              <button
                onClick={() => setData({ ...data, targets: data.targets.filter((_, j) => j !== i) })}
                className="px-3 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] tap-target"
              >
                ×
              </button>
            )}
          </div>
        ))}
        {data.targets.length < 5 && (
          <button
            onClick={() => setData({ ...data, targets: [...data.targets, ''] })}
            className="w-full py-2 rounded-lg border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] tap-target"
          >
            + Add target
          </button>
        )}
      </div>

      {/* Intervention */}
      <div className="space-y-2">
        <label className="font-medium">Intervention *</label>
        <p className="text-sm text-[var(--muted-foreground)]">
          Based on profile, consider {DOMAINS.find(d => d.id === topDomain)?.label} domain interventions
        </p>

        {/* Recommended */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">Recommended:</p>
          {recommendedInterventions.map((intervention) => (
            <InterventionCard
              key={intervention.id}
              intervention={intervention}
              selected={data.interventionId === intervention.id}
              onSelect={() => setData({ ...data, interventionId: intervention.id })}
            />
          ))}
        </div>

        {/* All Interventions */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-[var(--primary)]">
            View all interventions
          </summary>
          <div className="mt-2 space-y-2">
            {INTERVENTIONS.filter(i => !recommendedInterventions.includes(i)).map((intervention) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                selected={data.interventionId === intervention.id}
                onSelect={() => setData({ ...data, interventionId: intervention.id })}
              />
            ))}
          </div>
        </details>
      </div>

      {/* Selected Intervention Details */}
      {selectedIntervention && (
        <div className="p-4 rounded-lg bg-[var(--muted)] space-y-2">
          <h3 className="font-medium">{selectedIntervention.name}</h3>
          <p className="text-sm">{selectedIntervention.description}</p>
          <div className="mt-4">
            <p className="text-sm font-medium">Protocol:</p>
            <pre className="text-sm whitespace-pre-wrap text-[var(--muted-foreground)] mt-1">
              {selectedIntervention.protocol}
            </pre>
          </div>
        </div>
      )}

      {/* Measure */}
      <div className="space-y-2">
        <label className="font-medium">Measure</label>
        <input
          type="text"
          value={data.measure}
          onChange={(e) => setData({ ...data, measure: e.target.value })}
          placeholder="How will you track progress?"
          className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] tap-target"
        />
      </div>

      {/* Practice Frequency */}
      <div className="space-y-2">
        <label className="font-medium">Practice Frequency</label>
        <select
          value={data.practiceFrequency}
          onChange={(e) => setData({ ...data, practiceFrequency: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] tap-target"
        >
          <option value="">Select...</option>
          {PRACTICE_FREQUENCIES.map((freq) => (
            <option key={freq.id} value={freq.id}>{freq.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function InterventionCard({
  intervention,
  selected,
  onSelect
}: {
  intervention: Intervention
  selected: boolean
  onSelect: () => void
}) {
  const domainLabel = DOMAINS.find(d => d.id === intervention.domain)?.label

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-colors tap-target ${
        selected
          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
          : 'border-[var(--border)] hover:bg-[var(--muted)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{intervention.name}</p>
          <p className="text-sm text-[var(--muted-foreground)]">{domainLabel}</p>
        </div>
        {selected && <Check className="w-5 h-5 text-[var(--primary)]" />}
      </div>
    </button>
  )
}

// Step 4: Export Note
function Step4Export({
  note,
  onCopy,
  copied
}: {
  note: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Export Session Note</h2>

      {/* Guardrail */}
      <div className="p-4 rounded-lg border border-amber-500/50 bg-amber-500/10">
        <p className="text-sm">
          <strong>Important:</strong> The SENSE framework provides a structured lens for considering
          how sensory processing may contribute to a client's presentation. It is intended to
          complement—not replace—comprehensive clinical assessment.
        </p>
      </div>

      {/* Copy Button */}
      <button
        onClick={onCopy}
        className="w-full py-3 rounded-lg border border-[var(--border)] font-medium flex items-center justify-center gap-2 tap-target hover:bg-[var(--muted)]"
      >
        <Copy className="w-4 h-4" />
        {copied ? 'Copied!' : 'Copy to Clipboard'}
      </button>

      {/* Note Preview */}
      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]">
        <pre className="text-sm whitespace-pre-wrap font-mono">
          {note}
        </pre>
      </div>
    </div>
  )
}

export default function SessionWizardPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <SessionWizardContent />
    </Suspense>
  )
}
