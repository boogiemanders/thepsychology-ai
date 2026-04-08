'use client'

import { useCallback, type DragEvent } from 'react'
import type { CalligraphyFont, FontGroup } from './fonts'
import { FontCard } from './font-card'

interface FontWallProps {
  groups: FontGroup[]
  getFontsByGroup: (key: 'brush' | 'pen') => CalligraphyFont[]
  selectedFont: string
  onSelectFont: (family: string) => void
  onMoveFont: (family: string, newStyle: 'brush' | 'pen') => void
  previewText: string
}

function DropZone({
  groupKey,
  fonts,
  selectedFont,
  onSelectFont,
  onMoveFont,
  previewText,
}: {
  groupKey: 'brush' | 'pen'
  fonts: CalligraphyFont[]
  selectedFont: string
  onSelectFont: (family: string) => void
  onMoveFont: (family: string, newStyle: 'brush' | 'pen') => void
  previewText: string
}) {
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    ;(e.currentTarget as HTMLElement).classList.add('drag-over')
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    const target = e.currentTarget as HTMLElement
    if (!target.contains(e.relatedTarget as Node)) {
      target.classList.remove('drag-over')
    }
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      ;(e.currentTarget as HTMLElement).classList.remove('drag-over')
      const family = e.dataTransfer.getData('text/plain')
      if (family) onMoveFont(family, groupKey)
    },
    [groupKey, onMoveFont],
  )

  return (
    <div
      className="cs-font-grid"
      data-group={groupKey}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {fonts.length > 0 ? (
        fonts.map(font => (
          <FontCard
            key={font.family}
            font={font}
            text={previewText}
            isSelected={font.family === selectedFont}
            onSelect={onSelectFont}
          />
        ))
      ) : (
        <p className="cs-font-grid-empty">Drag fonts here</p>
      )}
    </div>
  )
}

export function FontWall({ groups, getFontsByGroup, selectedFont, onSelectFont, onMoveFont, previewText }: FontWallProps) {
  return (
    <>
      <div className="cs-section-heading">
        <p className="cs-section-label">Font Wall</p>
        <p className="cs-section-note">Same text across every bundled font.</p>
      </div>
      <div className="cs-font-wall">
        {groups.map(group => {
          const groupFonts = getFontsByGroup(group.key)
          return (
            <div key={group.key}>
              <div className="cs-font-group-header">
                <p className="cs-font-group-label">{group.label}</p>
                <p className="cs-font-group-note">{group.note}</p>
                <span className="cs-font-group-count">{groupFonts.length}</span>
              </div>
              <DropZone
                groupKey={group.key}
                fonts={groupFonts}
                selectedFont={selectedFont}
                onSelectFont={onSelectFont}
                onMoveFont={onMoveFont}
                previewText={previewText}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}
