'use client'
import type { ReactNode } from 'react'
import type { AccentName, LauncherStyle, Variation } from './inzi-data'

interface RadioOption<T extends string> { value: T; label: string }

export function TweakSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="tweak-section">
      <div className="tweak-section__label">{label}</div>
      {children}
    </div>
  )
}

export function TweakRadio<T extends string>({ value, options, onChange }: { value: T; options: RadioOption<T>[]; onChange: (v: T) => void }) {
  return (
    <div className="tweak-radio">
      {options.map(o => (
        <button key={o.value} type="button" className={'tweak-radio__btn' + (o.value === value ? ' is-active' : '')} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function TweakSelect<T extends string>({ value, options, onChange }: { value: T; options: RadioOption<T>[]; onChange: (v: T) => void }) {
  return (
    <select className="tweak-select" value={value} onChange={e => onChange(e.target.value as T)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function TweakToggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" className={'tweak-toggle' + (value ? ' is-on' : '')} onClick={() => onChange(!value)}>
      <span className="tweak-toggle__dot" />
      {label}
    </button>
  )
}

interface TweaksPanelProps {
  variation: Variation
  launcherStyle: LauncherStyle
  stateId: string
  stateOptions: RadioOption<string>[]
  accent: AccentName
  dark: boolean
  open: boolean
  onSet: <K extends string>(key: K, value: any) => void
}

export function TweaksPanel({ variation, launcherStyle, stateId, stateOptions, accent, dark, open, onSet }: TweaksPanelProps) {
  const variationHelp = variation === 'safe'
    ? 'Clean cream + navy. Closest to the brand mockups.'
    : variation === 'expressive'
    ? 'Cream + peach with hand-drawn squiggles. Warmer, more playful.'
    : 'Dark navy with periwinkle accents. Companion, not utility.'

  return (
    <div className="tweaks-panel">
      <div className="tweaks-panel__title">Tweaks</div>

      <TweakSection label="Variation">
        <TweakRadio<Variation>
          value={variation}
          onChange={v => onSet('variation', v)}
          options={[
            { value: 'safe', label: 'Safe' },
            { value: 'expressive', label: 'Expressive' },
            { value: 'experimental', label: 'Experimental' },
          ]}
        />
        <p className="tweak-help">{variationHelp}</p>
      </TweakSection>

      <TweakSection label="Launcher style">
        <TweakRadio<LauncherStyle>
          value={launcherStyle}
          onChange={v => onSet('launcherStyle', v)}
          options={[
            { value: 'circle', label: 'Circle' },
            { value: 'pill', label: 'Pill' },
            { value: 'pulse', label: 'Pulse dot' },
          ]}
        />
      </TweakSection>

      <TweakSection label="Bot state">
        <TweakSelect<string>
          value={stateId}
          onChange={v => onSet('stateId', v)}
          options={stateOptions}
        />
      </TweakSection>

      <TweakSection label="Accent">
        <TweakRadio<AccentName>
          value={accent}
          onChange={v => onSet('accent', v)}
          options={[
            { value: 'royal', label: 'Royal' },
            { value: 'peach', label: 'Peach' },
            { value: 'plum', label: 'Plum' },
            { value: 'mint', label: 'Mint' },
          ]}
        />
      </TweakSection>

      <TweakSection label="Dark panel">
        <TweakToggle value={dark} onChange={v => onSet('dark', v)} label={dark ? 'on' : 'off'} />
      </TweakSection>

      <TweakSection label="Panel">
        <TweakToggle value={open} onChange={v => onSet('open', v)} label={open ? 'open' : 'closed'} />
      </TweakSection>
    </div>
  )
}
