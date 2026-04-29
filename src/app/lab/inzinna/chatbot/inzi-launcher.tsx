'use client'
import type { LauncherStyle, Variation } from './inzi-data'
import { BrainIcon, Ico } from './inzi-icons'

interface LauncherProps {
  style: LauncherStyle
  variation: Variation
  open: boolean
  onToggle: () => void
}

export function Launcher({ style, variation, open, onToggle }: LauncherProps) {
  return (
    <button
      type="button"
      className={'inz-launcher inz-launcher--' + style + ' inz-launcher--' + variation + (open ? ' is-open' : '')}
      onClick={onToggle}
      aria-label={open ? 'Close Inzi chat' : 'Open Inzi chat'}
    >
      <span className="inz-launcher__bg" />
      <span className="inz-launcher__icon">
        {open ? <Ico.Close size={22} /> : <BrainIcon size={28} mono="#fff" />}
      </span>
      {style === 'pill' && !open && <span className="inz-launcher__label">talk to Inzi</span>}
      {style === 'pulse' && !open && <span className="inz-launcher__dot" />}
    </button>
  )
}

export function HomepageBackdrop({ dim = true }: { dim?: boolean }) {
  return (
    <div id="site-backdrop" className={dim ? 'is-dim' : ''} aria-hidden="true">
      <img src="/inzinna/inzinna-homepage-full.png" alt="" />
    </div>
  )
}
