'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { DOMAINS, type DomainId } from '@/lib/enums'
import { INTERVENTIONS, type Intervention } from '@/lib/interventions'

export default function InterventionsLibraryPage() {
  const [search, setSearch] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<DomainId | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredInterventions = INTERVENTIONS.filter((intervention) => {
    const matchesSearch =
      search === '' ||
      intervention.name.toLowerCase().includes(search.toLowerCase()) ||
      intervention.description.toLowerCase().includes(search.toLowerCase())

    const matchesDomain =
      selectedDomain === 'all' || intervention.domain === selectedDomain

    return matchesSearch && matchesDomain
  })

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
        <h1 className="text-2xl font-bold">Interventions Library</h1>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search interventions..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] tap-target"
        />
      </div>

      {/* Domain Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedDomain('all')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors tap-target ${
            selectedDomain === 'all'
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
              : 'bg-[var(--muted)]'
          }`}
        >
          All
        </button>
        {DOMAINS.map((domain) => (
          <button
            key={domain.id}
            onClick={() => setSelectedDomain(domain.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors tap-target ${
              selectedDomain === domain.id
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'bg-[var(--muted)]'
            }`}
          >
            {domain.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-[var(--muted-foreground)]">
        {filteredInterventions.length} intervention{filteredInterventions.length !== 1 ? 's' : ''}
      </p>

      {/* Interventions List */}
      <div className="space-y-3">
        {filteredInterventions.map((intervention) => (
          <InterventionCard
            key={intervention.id}
            intervention={intervention}
            expanded={expandedId === intervention.id}
            onToggle={() => setExpandedId(expandedId === intervention.id ? null : intervention.id)}
          />
        ))}
      </div>

      {filteredInterventions.length === 0 && (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-lg">
          <p className="text-[var(--muted-foreground)]">No interventions found</p>
        </div>
      )}
    </div>
  )
}

function InterventionCard({
  intervention,
  expanded,
  onToggle
}: {
  intervention: Intervention
  expanded: boolean
  onToggle: () => void
}) {
  const domain = DOMAINS.find(d => d.id === intervention.domain)

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-[var(--muted)] transition-colors tap-target"
      >
        <div>
          <h3 className="font-medium">{intervention.name}</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {domain?.label} • {intervention.description.slice(0, 80)}...
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-[var(--border)]">
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Description</p>
            <p className="mt-1">{intervention.description}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Protocol</p>
            <pre className="mt-1 text-sm whitespace-pre-wrap">{intervention.protocol}</pre>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Indications</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {intervention.indications.map((indication, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-sm rounded bg-green-500/10 text-green-700 dark:text-green-400"
                >
                  {indication}
                </span>
              ))}
            </div>
          </div>

          {intervention.contraindications.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Contraindications</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {intervention.contraindications.map((contraindication, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-sm rounded bg-red-500/10 text-red-700 dark:text-red-400"
                  >
                    {contraindication}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
