'use client'
import type { ReactNode } from 'react'
import type { AssessmentOption, Clinician, CrisisAction, HistoryThread, Recommendation } from './inzi-data'
import { Ico, TypingDots } from './inzi-icons'

export function IconCircle({ children, bg = 'var(--inz-oxford)', fg = '#fff', size = 36 }: { children: ReactNode; bg?: string; fg?: string; size?: number }) {
  return (
    <span className="inz-icon-circle" style={{ width: size, height: size, background: bg, color: fg }}>{children}</span>
  )
}

export function Chips({ items, theme = 'light', onPick }: { items: string[]; theme?: 'light' | 'dark'; onPick?: (s: string) => void }) {
  return (
    <div className={'inz-chips ' + theme}>
      {items.map((c, i) => (
        <button key={i} type="button" className="inz-chip" onClick={() => onPick?.(c)}>{c}</button>
      ))}
    </div>
  )
}

export function AssessmentQuestion({ step, total, question, options }: { step: number; total: number; question: string; options: AssessmentOption[] }) {
  const pct = (step / total) * 100
  return (
    <div className="inz-assessment">
      <div className="inz-assessment__head">
        <span>question {step} of {total}</span>
        <span className="inz-assessment__time">about 2 min left</span>
      </div>
      <div className="inz-progress"><div className="inz-progress__fill" style={{ width: pct + '%' }} /></div>
      <p className="inz-assessment__q">{question}</p>
      <div className="inz-assessment__opts">
        {options.map((o, i) => (
          <button key={i} type="button" className="inz-assessment__opt">
            <span className="inz-assessment__opt-radio" />
            <span className="inz-assessment__opt-label">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ResultsCard({ score, max, level, summary, recommendations }: { score: number; max: number; level: 'Mild' | 'Moderate' | 'Severe'; summary: string; recommendations: Recommendation[] }) {
  const pct = (score / max) * 100
  const tone = level === 'Mild' ? 'mint' : level === 'Severe' ? 'terra' : 'peach'
  return (
    <div className="inz-results">
      <div className="inz-results__head">
        <div>
          <div className="inz-results__eyebrow">your screener result</div>
          <div className="inz-results__title">{level} symptoms</div>
        </div>
        <div className={'inz-results__score tone-' + tone}>
          <div className="inz-results__score-num">{score}</div>
          <div className="inz-results__score-of">of {max}</div>
        </div>
      </div>
      <div className="inz-results__bar">
        <div className="inz-results__bar-fill" style={{ left: pct + '%' }} />
      </div>
      <div className="inz-results__bar-ticks">
        <span>none</span><span>mild</span><span>moderate</span><span>severe</span>
      </div>
      <p className="inz-results__summary">{summary}</p>
      <div className="inz-results__rec-title">what tends to help people in this range</div>
      <div className="inz-results__recs">
        {recommendations.map((r, i) => (
          <div key={i} className="inz-rec">
            <IconCircle bg="var(--inz-peri-10)" fg="var(--inz-royal)" size={32}>
              {r.icon === 'cbt' ? <Ico.CBT /> : <Ico.Group />}
            </IconCircle>
            <div>
              <div className="inz-rec__title">{r.title}</div>
              <div className="inz-rec__detail">{r.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="inz-results__cta">match me with a therapist <Ico.ArrowRight /></button>
      <div className="inz-results__disclaimer"><Ico.Lock /> not a diagnosis. we never share your answers.</div>
    </div>
  )
}

export function ClinicianCard({ clinician }: { clinician: Clinician }) {
  const initials = clinician.name.replace(/^Dr\.\s*/, '').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="inz-clin">
      <div className="inz-clin__head">
        <div className="inz-clin__avatar"><span>{initials}</span></div>
        <div className="inz-clin__info">
          <div className="inz-clin__name">{clinician.name}</div>
          <div className="inz-clin__spec">{clinician.specialty}</div>
          <div className="inz-clin__meta">
            <span><Ico.Heart size={12} /> {clinician.modality}</span>
          </div>
        </div>
        <div className="inz-clin__match">
          <div className="inz-clin__match-num">{clinician.match}%</div>
          <div className="inz-clin__match-label">match</div>
        </div>
      </div>
      <p className="inz-clin__bio">{clinician.bio}</p>
      <div className="inz-clin__slots-label">openings this week</div>
      <div className="inz-clin__slots">
        {clinician.slots.map((s, i) => (
          <button key={i} type="button" className={'inz-slot ' + (i === 0 ? 'is-pref' : '')}>
            <Ico.Calendar size={14} /> {s}
          </button>
        ))}
      </div>
      <div className="inz-clin__foot">
        <button type="button" className="inz-link">view full profile</button>
        <button type="button" className="inz-clin__book">book a free 15-min intro <Ico.ArrowRight /></button>
      </div>
    </div>
  )
}

export function CrisisActions({ actions }: { actions: CrisisAction[] }) {
  return (
    <div className="inz-crisis">
      <div className="inz-crisis__pin"><Ico.Heart size={12} /> support, right now</div>
      {actions.map((a, i) => (
        <a key={i} href={a.cta} className={'inz-crisis__btn ' + (a.primary ? 'primary' : '')}>
          <div>
            <div className="inz-crisis__btn-title">{a.label}</div>
            <div className="inz-crisis__btn-sub">{a.sub}</div>
          </div>
          <Ico.ArrowRight size={18} />
        </a>
      ))}
      <div className="inz-crisis__note">you don't have to go through this alone. we're here, and so are they.</div>
    </div>
  )
}

export function HistoryList({ threads }: { threads: HistoryThread[] }) {
  return (
    <div className="inz-history">
      <div className="inz-history__head">
        <div className="inz-history__title">your conversations</div>
        <button type="button" className="inz-history__new"><Ico.Plus size={14} /> new chat</button>
      </div>
      {threads.map(t => (
        <button key={t.id} type="button" className="inz-thread">
          <div className="inz-thread__main">
            <div className="inz-thread__title">{t.title}</div>
            <div className="inz-thread__preview">{t.preview}</div>
          </div>
          <div className="inz-thread__meta">
            <span className={'inz-thread__tag tone-' + t.tagColor}>{t.tag}</span>
            <span className="inz-thread__when">{t.when}</span>
          </div>
        </button>
      ))}
      <div className="inz-history__foot">
        <Ico.Lock size={12} /> conversations are encrypted and only visible to you
      </div>
    </div>
  )
}

export function Composer({ value, placeholder, theme = 'light', typingCaret = false, onChange, onSend }: { value: string; placeholder: string; theme?: 'light' | 'dark'; typingCaret?: boolean; onChange?: (v: string) => void; onSend?: () => void }) {
  const isActive = !!(value && value.trim())
  return (
    <div className={'inz-composer ' + theme}>
      <button type="button" className="inz-composer__icon" title="attach"><Ico.Plus /></button>
      <div className="inz-composer__field">
        {onChange ? (
          <input
            type="text"
            className="inz-composer__input"
            value={value}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && isActive) onSend?.() }}
          />
        ) : (
          <>
            <span>{value}</span>
            {typingCaret && <span className="inz-caret" />}
            {!value && !typingCaret && <span className="inz-placeholder">{placeholder}</span>}
          </>
        )}
      </div>
      <button type="button" className="inz-composer__icon" title="voice"><Ico.Mic /></button>
      <button type="button" className={'inz-composer__send' + (isActive ? ' is-active' : '')} title="send" onClick={onSend} disabled={!isActive}><Ico.Send /></button>
    </div>
  )
}

export function HandoffLoading({ text }: { text: string }) {
  return (
    <div className="inz-handoff-loading">
      <span className="inz-handoff-spinner" />
      <span>{text}</span>
    </div>
  )
}

import { useState } from 'react'
import type { CallbackSubmit, HandoffIntent, IntakeTopic } from './inzi-data'

// Interim HIPAA posture: intake is click-only, no free text, no name/email.
// The four preset options below are the whole intake surface.
export type IntakeOptionId = 'schedule' | 'insurance' | 'general' | 'callback'

const INTAKE_OPTIONS: { id: IntakeOptionId; label: string; sub: string }[] = [
  { id: 'schedule', label: 'Schedule an appointment', sub: 'call us, or have us call you' },
  { id: 'insurance', label: 'Insurance question', sub: 'coverage, billing, fees' },
  { id: 'general', label: 'General question', sub: 'hours, location, how therapy works' },
  { id: 'callback', label: 'Request a callback', sub: 'leave a number, we call you' },
]

export function IntakeOptions({ onPick }: { onPick: (id: IntakeOptionId) => void }) {
  return (
    <div className="inz-intake">
      {INTAKE_OPTIONS.map(o => (
        <button key={o.id} type="button" className="inz-intake__btn" onClick={() => onPick(o.id)}>
          <div>
            <div className="inz-intake__btn-title">{o.label}</div>
            <div className="inz-intake__btn-sub">{o.sub}</div>
          </div>
          <Ico.ArrowRight size={16} />
        </button>
      ))}
    </div>
  )
}

export function CallbackForm({ topic, onSubmit, onCancel }: { topic: IntakeTopic; onSubmit: (data: CallbackSubmit) => Promise<void>; onCancel: () => void }) {
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const digits = phone.replace(/\D/g, '')
  const ready = digits.length >= 10 && digits.length <= 15

  const handleSubmit = async () => {
    if (!ready || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({ topic, phone: phone.trim() })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="inz-form">
      <div className="inz-form__head">
        <div className="inz-form__title">Request a callback</div>
        <div className="inz-form__sub">we'll call you back within one business day. your number is the only thing we ask for.</div>
      </div>
      <label className="inz-form__field">
        <span>Phone number</span>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={e => setPhone(e.target.value.replace(/[^\d\s().+-]/g, ''))}
          onKeyDown={e => { if (e.key === 'Enter' && ready) handleSubmit() }}
          placeholder="555 123 4567"
        />
      </label>
      <div className="inz-form__actions">
        <button type="button" className="inz-form__cancel" onClick={onCancel} disabled={submitting}>cancel</button>
        <button type="button" className="inz-form__submit" onClick={handleSubmit} disabled={!ready || submitting}>
          {submitting ? 'sending...' : 'request callback'}
        </button>
      </div>
    </div>
  )
}

export function HandoffSuccess({ intent, etaText }: { intent: HandoffIntent; etaText: string }) {
  const title = intent === 'scheduling' ? 'sent to scheduling'
    : intent === 'clinical' ? 'sent to your clinician'
    : intent === 'billing' ? 'sent to billing'
    : 'sent to the team'
  return (
    <div className="inz-success">
      <div className="inz-success__check"><Ico.Check size={20} /></div>
      <div>
        <div className="inz-success__title">{title}</div>
        <div className="inz-success__sub">{etaText}</div>
      </div>
    </div>
  )
}
