import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ArrowLeft, Plus, Calendar, Clock } from 'lucide-react'
import { STATE_TAGS } from '@/lib/enums'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientProfilePage({ params }: PageProps) {
  const { id } = await params

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!client) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors tap-target"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {client.age ? `Age ${client.age}` : 'Age not specified'}
            {client.settingDefault && ` • ${client.settingDefault}`}
          </p>
        </div>
      </header>

      {/* New Session Button */}
      <Link
        href={`/sessions/new?clientId=${client.id}`}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium tap-target"
      >
        <Plus className="w-5 h-5" />
        Start New Session
      </Link>

      {/* Sessions */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Session History</h2>

        {client.sessions.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-lg">
            <p className="text-[var(--muted-foreground)]">No sessions yet</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Start a new session to begin
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {client.sessions.map((session) => {
              const stateTag = STATE_TAGS.find(t => t.id === session.stateTag)
              const hasExport = !!session.noteExportedAt

              return (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <span className="font-medium">
                          {new Date(session.createdAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                        {stateTag && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${stateTag.color}20`,
                              color: stateTag.color
                            }}
                          >
                            {stateTag.label}
                          </span>
                        )}
                        {session.interventionName && (
                          <span>{session.interventionName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                      {hasExport && (
                        <span className="text-green-600 dark:text-green-400">Exported</span>
                      )}
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>

                  {/* SENSE Profile Mini Display */}
                  <div className="mt-3 flex items-center gap-1">
                    {[
                      { label: 'S', value: session.somaticRating },
                      { label: 'E', value: session.emotionalRating },
                      { label: 'N', value: session.neurologicalRating },
                      { label: 'S', value: session.socialRating },
                      { label: 'E', value: session.environmentalRating },
                    ].map((domain, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center w-10"
                      >
                        <span className="text-[10px] text-[var(--muted-foreground)]">{domain.label}</span>
                        <div
                          className="w-full h-1.5 rounded-full bg-[var(--muted)]"
                        >
                          <div
                            className="h-full rounded-full bg-[var(--primary)]"
                            style={{ width: `${(domain.value || 0) * 20}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
