import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Plus, Users, BookOpen, Brain } from 'lucide-react'
import { DemoDataButton } from './demo-data-button'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const clients = await prisma.client.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { sessions: true }
      }
    }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold">SENSE</h1>
        <p className="text-[var(--muted-foreground)]">
          Sensory-Informed Clinical Framework
        </p>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/clients/new"
          className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors tap-target"
        >
          <Plus className="w-6 h-6 text-[var(--primary)]" />
          <span className="font-medium">New Client</span>
        </Link>
        <Link
          href="/library/interventions"
          className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors tap-target"
        >
          <BookOpen className="w-6 h-6 text-[var(--primary)]" />
          <span className="font-medium">Interventions</span>
        </Link>
      </div>

      {/* Library Link */}
      <Link
        href="/library/patterns"
        className="flex items-center justify-center gap-2 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors tap-target"
      >
        <Brain className="w-5 h-5 text-[var(--primary)]" />
        <span className="font-medium">Clinical Patterns Library</span>
      </Link>

      {/* Clients Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Clients
          </h2>
          {clients.length === 0 && <DemoDataButton />}
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-lg">
            <p className="text-[var(--muted-foreground)]">No clients yet</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Add your first client or load demo data
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors tap-target"
              >
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {client.age ? `Age ${client.age}` : 'Age not specified'}
                    {client.settingDefault && ` • ${client.settingDefault}`}
                  </p>
                </div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  {client._count.sessions} session{client._count.sessions !== 1 ? 's' : ''}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-[var(--muted-foreground)] pt-8 border-t border-[var(--border)]">
        <p>SENSE is a clinical decision support tool.</p>
        <p className="mt-1">
          Sensory processing is one contributing factor among many.
        </p>
      </footer>
    </div>
  )
}
