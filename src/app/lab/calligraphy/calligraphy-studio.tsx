'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { FONTS, FONT_GROUPS } from './components/fonts'
import { SAMPLE_INPUTS } from './components/sample-inputs'
import { useFontGroups } from './components/use-font-groups'
import { useTranslate } from './components/use-translate'
import { HeroSection } from './components/hero-section'
import { ControlsPanel } from './components/controls-panel'
import { FeaturedPreview } from './components/featured-preview'
import { FontWall } from './components/font-wall'
import { useCalligraphyFont } from './components/use-calligraphy-font'
import './calligraphy-studio.css'

const DEFAULT_CHINESE = '\u4eca\u665a\u7684\u6708\u8272\u771f\u7f8e\uff0c\u6211\u4e00\u76f4\u5728\u60f3\u7740\u4f60\u3002'

export default function CalligraphyStudio() {
  const [englishInput, setEnglishInput] = useState(SAMPLE_INPUTS[0])
  const [targetVariant, setTargetVariant] = useState('simplified')
  const [selectedFont, setSelectedFont] = useState(FONTS[0].family)
  const [previewText, setPreviewText] = useState(DEFAULT_CHINESE)
  const [model, setModel] = useState<string | null>(null)
  const [status, setStatus] = useState<{ message: string; type: 'idle' | 'error' | 'success' }>({
    message: 'Ready.',
    type: 'idle',
  })

  const { getFontsByGroup, moveFont } = useFontGroups(FONTS)
  const { translate, isTranslating, error: translateError } = useTranslate()
  const selectedFontConfig = FONTS.find(font => font.family === selectedFont) ?? null

  useCalligraphyFont(selectedFontConfig, { priority: true })

  const handleTranslate = useCallback(async () => {
    const text = englishInput.trim()
    if (text.length < 2) {
      setStatus({ message: 'Enter more text before translating.', type: 'error' })
      return
    }

    setStatus({ message: 'Translating...', type: 'idle' })
    const result = await translate(text, targetVariant)

    if (result) {
      setPreviewText(result.translation)
      setModel(result.model)
      setStatus({ message: 'Translation complete.', type: 'success' })
    }
  }, [englishInput, targetVariant, translate])

  // Sync translate errors
  useEffect(() => {
    if (translateError) {
      setStatus({ message: translateError, type: 'error' })
    }
  }, [translateError])

  const handleSample = useCallback(() => {
    const current = englishInput.trim()
    const candidates = SAMPLE_INPUTS.filter(s => s !== current)
    const pool = candidates.length ? candidates : SAMPLE_INPUTS
    setEnglishInput(pool[Math.floor(Math.random() * pool.length)])
    setStatus({ message: 'Sample input updated.', type: 'idle' })
  }, [englishInput])

  const handleMoveFont = useCallback(
    (family: string, newStyle: 'brush' | 'pen') => {
      const font = FONTS.find(f => f.family === family)
      if (!font) return
      if ((getFontsByGroup(newStyle)).some(f => f.family === family)) return
      moveFont(family, newStyle)
    },
    [getFontsByGroup, moveFont],
  )

  return (
    <div className="calligraphy-studio">
      <div className="cs-page-shell">
        <div className="cs-breadcrumb">
          <Link href="/lab" className="cs-breadcrumb-link">
            &larr; Lab
          </Link>
        </div>
        <HeroSection />
        <main className="cs-layout">
          <ControlsPanel
            fonts={FONTS}
            englishInput={englishInput}
            setEnglishInput={setEnglishInput}
            targetVariant={targetVariant}
            setTargetVariant={setTargetVariant}
            selectedFont={selectedFont}
            setSelectedFont={setSelectedFont}
            onTranslate={handleTranslate}
            onSample={handleSample}
            isTranslating={isTranslating}
            status={status}
          />
          <section className="cs-panel cs-preview-panel">
            <FeaturedPreview text={previewText} fontFamily={selectedFont} model={model} />
            <FontWall
              groups={FONT_GROUPS}
              getFontsByGroup={getFontsByGroup}
              selectedFont={selectedFont}
              onSelectFont={setSelectedFont}
              onMoveFont={handleMoveFont}
              previewText={previewText}
            />
          </section>
        </main>
      </div>
    </div>
  )
}
