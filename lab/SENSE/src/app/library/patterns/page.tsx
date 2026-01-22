'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { DOMAINS, STATE_TAGS, type DomainId, type StateTagId } from '@/lib/enums'
import { CLINICAL_PATTERNS, type ClinicalPattern } from '@/lib/patterns'
import { getInterventionById } from '@/lib/interventions'

export default function PatternsLibraryPage() {
  const [search, setSearch] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<DomainId | 'all'>('all')
  const [selectedState, setSelectedState] = useState<StateTagId | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredPatterns = CLINICAL_PATTERNS.filter((pattern) => {
    const matchesSearch =
      search === '' ||
      pattern.name.toLowerCase().includes(search.toLowerCase()) ||
      pattern.description.toLowerCase().includes(search.toLowerCase())

    const matchesDomain =
      selectedDomain === 'all' || pattern.primaryDomains.includes(selectedDomain)

    const matchesState =
      selectedState === 'all' || pattern.typicalStateTag === selectedState

    return matchesSearch && matchesDomain && matchesState
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
        <h1 className="text-2xl font-bold">Clinical Patterns</h1>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patterns..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)] tap-target"
        />
      </div>

      {/* Domain Filter */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">Domain</p>
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
      </div>

      {/* State Filter */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--muted-foreground)]">State</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedState('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors tap-target ${
              selectedState === 'all'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'bg-[var(--muted)]'
            }`}
          >
            All
          </button>
          {STATE_TAGS.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedState(tag.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors tap-target ${
                selectedState === tag.id
                  ? ''
                  : 'bg-[var(--muted)]'
              }`}
              style={{
                backgroundColor: selectedState === tag.id ? tag.color : undefined,
                color: selectedState === tag.id ? 'white' : undefined,
              }}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-[var(--muted-foreground)]">
        {filteredPatterns.length} pattern{filteredPatterns.length !== 1 ? 's' : ''}
      </p>

      {/* Patterns List */}
      <div className="space-y-3">
        {filteredPatterns.map((pattern) => (
          <PatternCard
            key={pattern.id}
            pattern={pattern}
            expanded={expandedId === pattern.id}
            onToggle={() => setExpandedId(expandedId === pattern.id ? null : pattern.id)}
          />
        ))}
      </div>

      {filteredPatterns.length === 0 && (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-lg">
          <p className="text-[var(--muted-foreground)]">No patterns found</p>
        </div>
      )}
    </div>
  )
}

function PatternCard({
  pattern,
  expanded,
  onToggle
}: {
  pattern: ClinicalPattern
  expanded: boolean
  onToggle: () => void
}) {
  const stateTag = STATE_TAGS.find(t => t.id === pattern.typicalStateTag)
  const primaryDomainLabels = pattern.primaryDomains
    .map(id => DOMAINS.find(d => d.id === id)?.label)
    .filter(Boolean)
    .join(', ')

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left flex items-start justify-between gap-4 hover:bg-[var(--muted)] transition-colors tap-target"
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium">{pattern.name}</h3>
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
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {primaryDomainLabels} • {pattern.description.slice(0, 60)}...
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
            <p className="mt-1">{pattern.description}</p>
          </div>

          {/* SENSE Profile Range */}
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Typical SENSE Profile</p>
            <div className="mt-2 space-y-2">
              {DOMAINS.map((domain) => {
                const range = pattern.senseProfile[domain.id]
                return (
                  <div key={domain.id} className="flex items-center gap-2">
                    <span className="w-24 text-sm">{domain.label}</span>
                    <div className="flex-1 h-2 bg-[var(--muted)] rounded-full relative">
                      <div
                        className="absolute h-full bg-[var(--primary)] rounded-full"
                        style={{
                          left: `${(range[0] - 1) * 20}%`,
                          width: `${(range[1] - range[0] + 1) * 20}%`
                        }}
                      />
                    </div>
                    <span className="w-12 text-sm text-right text-[var(--muted-foreground)]">
                      {range[0]}-{range[1]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Common Modifiers */}
          {pattern.commonModifiers.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)]">Common Sensory Modifiers</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {pattern.commonModifiers.map((modifier, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-sm rounded bg-[var(--muted)]"
                  >
                    {modifier.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Differential Considerations */}
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Differential Considerations</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {pattern.differentialConsiderations.map((consideration, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-sm rounded bg-amber-500/10 text-amber-700 dark:text-amber-400"
                >
                  {consideration}
                </span>
              ))}
            </div>
          </div>

          {/* Suggested Interventions */}
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Suggested Interventions</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {pattern.suggestedInterventions.map((interventionId, i) => {
                const intervention = getInterventionById(interventionId)
                return (
                  <span
                    key={i}
                    className="px-2 py-1 text-sm rounded bg-[var(--primary)]/10 text-[var(--primary)]"
                  >
                    {intervention?.name || interventionId}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
