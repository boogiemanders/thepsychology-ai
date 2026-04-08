'use client'

import type { CalligraphyFont } from './fonts'

interface ControlsPanelProps {
  fonts: CalligraphyFont[]
  englishInput: string
  setEnglishInput: (v: string) => void
  targetVariant: string
  setTargetVariant: (v: string) => void
  selectedFont: string
  setSelectedFont: (v: string) => void
  onTranslate: () => void
  onSample: () => void
  isTranslating: boolean
  status: { message: string; type: 'idle' | 'error' | 'success' }
}

export function ControlsPanel({
  fonts,
  englishInput,
  setEnglishInput,
  targetVariant,
  setTargetVariant,
  selectedFont,
  setSelectedFont,
  onTranslate,
  onSample,
  isTranslating,
  status,
}: ControlsPanelProps) {
  return (
    <section className="cs-panel cs-controls-panel">
      <form
        className="cs-stack"
        onSubmit={e => {
          e.preventDefault()
          onTranslate()
        }}
      >
        <label className="cs-field">
          <span>English input</span>
          <textarea
            rows={7}
            placeholder="Write a phrase, line, quote, or short paragraph in English."
            value={englishInput}
            onChange={e => setEnglishInput(e.target.value)}
          />
        </label>

        <div className="cs-controls-grid">
          <label className="cs-field">
            <span>Chinese variant</span>
            <select value={targetVariant} onChange={e => setTargetVariant(e.target.value)}>
              <option value="simplified">Simplified Chinese</option>
              <option value="traditional">Traditional Chinese</option>
            </select>
          </label>

          <label className="cs-field">
            <span>Featured font</span>
            <select value={selectedFont} onChange={e => setSelectedFont(e.target.value)}>
              {fonts.map(f => (
                <option key={f.family} value={f.family}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="cs-actions">
          <button className="cs-btn-primary" type="submit" disabled={isTranslating}>
            {isTranslating ? 'Translating...' : 'Translate + Preview'}
          </button>
          <button className="cs-btn-secondary" type="button" onClick={onSample} disabled={isTranslating}>
            New sample
          </button>
        </div>

        <p className={`cs-status ${status.type}`}>{status.message}</p>
      </form>
    </section>
  )
}
