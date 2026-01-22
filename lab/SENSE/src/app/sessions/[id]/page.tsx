import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ArrowLeft, Copy } from 'lucide-react'
import { DOMAINS, STATE_TAGS, BODY_SYSTEMS, CONTEXTS, SENSORY_MODIFIERS, RATING_LABELS } from '@/lib/enums'
import { CopyButton } from './copy-button'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      client: true
    }
  })

  if (!session) {
    notFound()
  }

  const stateTag = STATE_TAGS.find(t => t.id === session.stateTag)
  const bodySystem = BODY_SYSTEMS.find(s => s.id === session.bodySystem)
  const context = CONTEXTS.find(c => c.id === session.context)

  let sensoryModifiersList: string[] = []
  try {
    sensoryModifiersList = session.sensoryModifiers ? JSON.parse(session.sensoryModifiers) : []
  } catch {
    sensoryModifiersList = []
  }

  let targetsList: string[] = []
  try {
    targetsList = session.targets ? JSON.parse(session.targets) : []
  } catch {
    targetsList = []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Link
          href={`/clients/${session.clientId}`}
          className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors tap-target"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Session Details</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {session.client.name} •{' '}
            {new Date(session.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      </header>

      {/* SENSE Profile */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">SENSE Profile</h2>
        <div className="space-y-3">
          {DOMAINS.map((domain) => {
            const key = `${domain.id}Rating` as keyof typeof session
            const value = session[key] as number | null
            const label = RATING_LABELS.find(r => r.value === value)

            return (
              <div key={domain.id} className="flex items-center gap-4">
                <span className="w-28 font-medium">{domain.label}</span>
                <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full"
                    style={{ width: `${(value || 0) * 20}%` }}
                  />
                </div>
                <span className="w-20 text-sm text-right text-[var(--muted-foreground)]">
                  {value}/5
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* State & Context */}
      <section className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-[var(--border)]">
          <p className="text-sm text-[var(--muted-foreground)]">State Tag</p>
          {stateTag && (
            <span
              className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${stateTag.color}20`,
                color: stateTag.color
              }}
            >
              {stateTag.label}
            </span>
          )}
        </div>
        <div className="p-4 rounded-lg border border-[var(--border)]">
          <p className="text-sm text-[var(--muted-foreground)]">Body System</p>
          <p className="mt-1 font-medium">{bodySystem?.label || 'Not specified'}</p>
        </div>
      </section>

      {/* Sensory Modifiers */}
      {sensoryModifiersList.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Sensory Modifiers</h2>
          <div className="flex flex-wrap gap-2">
            {sensoryModifiersList.map((modifierId) => {
              const modifier = SENSORY_MODIFIERS.find(m => m.id === modifierId)
              return (
                <span
                  key={modifierId}
                  className="px-3 py-1 rounded-full text-sm bg-[var(--muted)]"
                >
                  {modifier?.label || modifierId}
                </span>
              )
            })}
          </div>
        </section>
      )}

      {/* Hypotheses */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Clinical Hypotheses</h2>
        <div className="space-y-3">
          {session.hypothesis1 && (
            <div className="p-4 rounded-lg border border-[var(--border)]">
              <p className="text-sm text-[var(--muted-foreground)]">Hypothesis 1</p>
              <p className="mt-1">{session.hypothesis1}</p>
            </div>
          )}
          {session.hypothesis2 && (
            <div className="p-4 rounded-lg border border-[var(--border)]">
              <p className="text-sm text-[var(--muted-foreground)]">Hypothesis 2</p>
              <p className="mt-1">{session.hypothesis2}</p>
            </div>
          )}
        </div>
      </section>

      {/* Plan */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Treatment Plan</h2>
        <div className="space-y-3">
          {targetsList.length > 0 && (
            <div className="p-4 rounded-lg border border-[var(--border)]">
              <p className="text-sm text-[var(--muted-foreground)]">Targets</p>
              <ul className="mt-2 space-y-1">
                {targetsList.map((target, i) => (
                  <li key={i}>• {target}</li>
                ))}
              </ul>
            </div>
          )}
          {session.interventionName && (
            <div className="p-4 rounded-lg border border-[var(--border)]">
              <p className="text-sm text-[var(--muted-foreground)]">Intervention</p>
              <p className="mt-1 font-medium">{session.interventionName}</p>
            </div>
          )}
          {session.measure && (
            <div className="p-4 rounded-lg border border-[var(--border)]">
              <p className="text-sm text-[var(--muted-foreground)]">Measure</p>
              <p className="mt-1">{session.measure}</p>
            </div>
          )}
          {session.practiceFrequency && (
            <div className="p-4 rounded-lg border border-[var(--border)]">
              <p className="text-sm text-[var(--muted-foreground)]">Practice Frequency</p>
              <p className="mt-1">{session.practiceFrequency}</p>
            </div>
          )}
        </div>
      </section>

      {/* Exported Note */}
      {session.exportedNote && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Exported Note</h2>
            <CopyButton text={session.exportedNote} />
          </div>
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {session.exportedNote}
            </pre>
          </div>
        </section>
      )}
    </div>
  )
}
