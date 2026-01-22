'use client'

import { useState } from 'react'

const versions = [
  { id: 'v1', label: 'v1', active: true },
  { id: 'v2', label: 'v2', active: false, comingSoon: true },
]

export function VersionSelector() {
  const [selected, setSelected] = useState('v1')

  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-lg">
      {versions.map((version) => (
        <button
          key={version.id}
          onClick={() => version.active && setSelected(version.id)}
          disabled={!version.active}
          className={`
            relative px-4 py-1.5 text-sm font-medium rounded-md transition-all
            ${selected === version.id
              ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
              : version.active
                ? 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)]/50 cursor-not-allowed'
            }
          `}
        >
          {version.label}
          {version.comingSoon && (
            <span className="absolute -top-1 -right-1 px-1 py-0.5 text-[8px] font-medium bg-blue-500/20 text-blue-400 rounded">
              soon
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
