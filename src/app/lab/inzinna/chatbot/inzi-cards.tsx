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
import type { SchedulingSubmit, ContactClinicianSubmit, HandoffIntent } from './inzi-data'

const TIME_CHIPS = ['weekday mornings', 'weekday afternoons', 'weekday evenings', 'saturdays', 'flexible']

export function SchedulingForm({ onSubmit, onCancel }: { onSubmit: (data: SchedulingSubmit) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [modality, setModality] = useState<'telehealth' | 'in-person' | 'either'>('either')
  const [times, setTimes] = useState<string[]>([])
  const [insurance, setInsurance] = useState('')
  const [concerns, setConcerns] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const toggleTime = (t: string) => {
    setTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const ready = name.trim() && email.trim() && times.length > 0 && concerns.trim()

  const handleSubmit = async () => {
    if (!ready || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, modality, preferredTimes: times, insurance: insurance.trim(), concerns: concerns.trim() })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="inz-form">
      <div className="inz-form__head">
        <div className="inz-form__title">Book a session</div>
        <div className="inz-form__sub">our scheduling team will confirm within 1 business day.</div>
      </div>
      <div className="inz-form__row">
        <label className="inz-form__field">
          <span>Your name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
        </label>
        <label className="inz-form__field">
          <span>Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
      </div>
      <label className="inz-form__field">
        <span>Phone (optional)</span>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="555 123 4567" />
      </label>
      <div className="inz-form__field">
        <span>Modality</span>
        <div className="inz-form__radio">
          {(['telehealth', 'in-person', 'either'] as const).map(m => (
            <button type="button" key={m} className={'inz-form__radio-btn' + (modality === m ? ' is-active' : '')} onClick={() => setModality(m)}>{m}</button>
          ))}
        </div>
      </div>
      <div className="inz-form__field">
        <span>Times that work (pick any)</span>
        <div className="inz-form__chips">
          {TIME_CHIPS.map(t => (
            <button type="button" key={t} className={'inz-form__chip' + (times.includes(t) ? ' is-active' : '')} onClick={() => toggleTime(t)}>{t}</button>
          ))}
        </div>
      </div>
      <label className="inz-form__field">
        <span>Insurance (optional)</span>
        <input value={insurance} onChange={e => setInsurance(e.target.value)} placeholder="e.g. Aetna, BCBS, self-pay" />
      </label>
      <label className="inz-form__field">
        <span>Briefly, what brings you in?</span>
        <textarea rows={3} value={concerns} onChange={e => setConcerns(e.target.value)} placeholder="anxiety at work, relationship stress, ADHD eval..." />
      </label>
      <div className="inz-form__actions">
        <button type="button" className="inz-form__cancel" onClick={onCancel} disabled={submitting}>cancel</button>
        <button type="button" className="inz-form__submit" onClick={handleSubmit} disabled={!ready || submitting}>
          {submitting ? 'sending...' : 'send to scheduling'}
        </button>
      </div>
    </div>
  )
}

export function ContactClinicianForm({ clinicians, onSubmit, onCancel }: { clinicians: string[]; onSubmit: (data: ContactClinicianSubmit) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [clinician, setClinician] = useState(clinicians[0] || '')
  const [message, setMessage] = useState('')
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'urgent'>('normal')
  const [submitting, setSubmitting] = useState(false)

  const ready = name.trim() && email.trim() && message.trim() && clinician

  const handleSubmit = async () => {
    if (!ready || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, clinician, message: message.trim(), urgency })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="inz-form">
      <div className="inz-form__head">
        <div className="inz-form__title">Message your clinician</div>
        <div className="inz-form__sub">they'll get an email and respond by next business day. for emergencies call 911 or 988.</div>
      </div>
      <div className="inz-form__row">
        <label className="inz-form__field">
          <span>Your name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
        </label>
        <label className="inz-form__field">
          <span>Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
      </div>
      <label className="inz-form__field">
        <span>Phone (optional)</span>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="555 123 4567" />
      </label>
      <label className="inz-form__field">
        <span>Send to</span>
        <select value={clinician} onChange={e => setClinician(e.target.value)}>
          {clinicians.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <div className="inz-form__field">
        <span>Urgency</span>
        <div className="inz-form__radio">
          {(['low', 'normal', 'urgent'] as const).map(u => (
            <button type="button" key={u} className={'inz-form__radio-btn' + (urgency === u ? ' is-active' : '')} onClick={() => setUrgency(u)}>{u}</button>
          ))}
        </div>
      </div>
      <label className="inz-form__field">
        <span>Message</span>
        <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="hi Dr. X, I wanted to ask about..." />
      </label>
      <div className="inz-form__actions">
        <button type="button" className="inz-form__cancel" onClick={onCancel} disabled={submitting}>cancel</button>
        <button type="button" className="inz-form__submit" onClick={handleSubmit} disabled={!ready || submitting}>
          {submitting ? 'sending...' : 'send message'}
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
