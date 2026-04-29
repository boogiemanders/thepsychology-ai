'use client'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import type { InziState, Message, Variation, AccentName } from './inzi-data'
import { BrainAnim, Ico, LoopSquiggle, TypingDots } from './inzi-icons'
import { AssessmentQuestion, Chips, ClinicianCard, Composer, CrisisActions, HandoffLoading, HistoryList, ResultsCard, SchedulingForm, ContactClinicianForm, HandoffSuccess } from './inzi-cards'
import type { SchedulingSubmit, ContactClinicianSubmit, HandoffIntent } from './inzi-data'

function iconMonoFor(variation: Variation, dark: boolean, accent: AccentName): string {
  const accentColor = ({ royal: '#3362FF', peach: '#D67263', plum: '#5F396D', mint: '#3F8E45' } as const)[accent] || '#3362FF'
  if (variation === 'expressive') return dark ? '#FCF9EB' : accentColor
  if (variation === 'experimental') return '#FCF9EB'
  if (dark) return '#FCF9EB'
  return accentColor
}

function docLabel(doc: string): string {
  if (doc === 'clinic-manual') return 'Clinic Manual'
  if (doc === 'employee-handbook') return 'Employee Handbook'
  if (doc === 'brand-strategy') return 'Brand Strategy'
  return doc
}

function cleanTitle(t: string): string {
  return t.replace(/^\d+\\?\.\s*/, '').replace(/:$/, '').trim()
}

function CiteBadge({ n, doc }: { n: number; doc: string }) {
  return <span className={'inz-cite inz-cite--' + doc}>{n}</span>
}

function withCitations(node: any, sources: { title: string; doc: string }[]): any {
  if (typeof node === 'string') {
    const parts = node.split(/(\[\d+\])/g)
    if (parts.length === 1) return node
    return parts.map((part, i) => {
      const m = part.match(/^\[(\d+)\]$/)
      if (m) {
        const n = Number(m[1])
        const src = sources[n - 1]
        return <CiteBadge key={i} n={n} doc={src?.doc || 'unknown'} />
      }
      return part
    })
  }
  if (Array.isArray(node)) return node.map((c: any) => withCitations(c, sources))
  return node
}

function SourceTags({ sources }: { sources: { title: string; doc: string }[] }) {
  const top = sources.slice(0, 4)
  return (
    <div className="inz-sources">
      <div className="inz-sources__label">sources</div>
      {top.map((s, i) => (
        <span key={i} className={'inz-source-tag inz-source-tag--' + s.doc} title={`${cleanTitle(s.title)} · ${docLabel(s.doc)}`}>
          <span className="inz-source-tag__num">{i + 1}</span>
          <span className="inz-source-tag__title">{cleanTitle(s.title)}</span>
        </span>
      ))}
    </div>
  )
}

interface BubbleProps {
  msg: Message
  dark: boolean
  variation: Variation
  accent: AccentName
  onSchedulingSubmit?: (data: SchedulingSubmit) => Promise<void>
  onContactClinicianSubmit?: (data: ContactClinicianSubmit) => Promise<void>
  onCancelHandoff?: () => void
}

function Bubble({ msg, dark, variation, accent, onSchedulingSubmit, onContactClinicianSubmit, onCancelHandoff }: BubbleProps) {
  const mono = iconMonoFor(variation, dark, accent)
  if (msg.from === 'system') {
    return (
      <div className="inz-msg-system">
        <span className="inz-msg-system__line" />
        <span className="inz-msg-system__text">{msg.text}</span>
        <span className="inz-msg-system__line" />
      </div>
    )
  }

  if (msg.from === 'bot' && msg.kind === 'assessment-question') {
    return (
      <div className="inz-msg">
        <div className="inz-msg__avatar"><BrainAnim size={28} mono={mono} /></div>
        <div className="inz-msg__body"><AssessmentQuestion {...msg} /></div>
      </div>
    )
  }
  if (msg.from === 'bot' && msg.kind === 'results') {
    return (
      <div className="inz-msg inz-msg--wide">
        <div className="inz-msg__avatar"><BrainAnim size={28} mono={mono} /></div>
        <div className="inz-msg__body"><ResultsCard {...msg} /></div>
      </div>
    )
  }
  if (msg.from === 'bot' && msg.kind === 'clinician-card') {
    return (
      <div className="inz-msg inz-msg--wide">
        <div className="inz-msg__avatar"><BrainAnim size={28} mono={mono} /></div>
        <div className="inz-msg__body"><ClinicianCard clinician={msg.clinician} /></div>
      </div>
    )
  }
  if (msg.from === 'bot' && msg.kind === 'crisis-actions') {
    return (
      <div className="inz-msg inz-msg--wide">
        <div className="inz-msg__avatar"><BrainAnim size={28} active mono={mono} /></div>
        <div className="inz-msg__body"><CrisisActions actions={msg.actions} /></div>
      </div>
    )
  }
  if (msg.from === 'bot' && msg.kind === 'handoff-loading') {
    return (
      <div className="inz-msg">
        <div className="inz-msg__avatar"><BrainAnim size={28} active mono={mono} /></div>
        <div className="inz-msg__body"><HandoffLoading text={msg.text} /></div>
      </div>
    )
  }
  if (msg.from === 'bot' && msg.kind === 'scheduling-form') {
    return (
      <div className="inz-msg inz-msg--wide">
        <div className="inz-msg__avatar"><BrainAnim size={28} mono={mono} /></div>
        <div className="inz-msg__body">
          <SchedulingForm
            onSubmit={async d => { if (onSchedulingSubmit) await onSchedulingSubmit(d) }}
            onCancel={() => onCancelHandoff?.()}
          />
        </div>
      </div>
    )
  }
  if (msg.from === 'bot' && msg.kind === 'contact-clinician-form') {
    return (
      <div className="inz-msg inz-msg--wide">
        <div className="inz-msg__avatar"><BrainAnim size={28} mono={mono} /></div>
        <div className="inz-msg__body">
          <ContactClinicianForm
            clinicians={msg.clinicians}
            onSubmit={async d => { if (onContactClinicianSubmit) await onContactClinicianSubmit(d) }}
            onCancel={() => onCancelHandoff?.()}
          />
        </div>
      </div>
    )
  }
  if (msg.from === 'bot' && msg.kind === 'handoff-success') {
    return (
      <div className="inz-msg">
        <div className="inz-msg__avatar"><BrainAnim size={28} mono={mono} /></div>
        <div className="inz-msg__body"><HandoffSuccess intent={msg.intent} etaText={msg.etaText} /></div>
      </div>
    )
  }

  if (msg.from === 'human') {
    return (
      <div className="inz-msg">
        <div className="inz-msg__avatar inz-msg__avatar--human">{msg.avatar}</div>
        <div className="inz-msg__body">
          <div className="inz-msg__name">{msg.name} · care coordinator</div>
          <div className="inz-bubble inz-bubble--human">{msg.text}</div>
        </div>
      </div>
    )
  }

  if (msg.from === 'user') {
    return (
      <div className="inz-msg inz-msg--user">
        <div className="inz-msg__body" style={{ alignItems: 'flex-end' }}>
          <div className="inz-bubble inz-bubble--user">{msg.text}</div>
        </div>
      </div>
    )
  }

  // bot default / intro / crisis
  return (
    <div className="inz-msg">
      <div className="inz-msg__avatar"><BrainAnim size={28} mono={mono} /></div>
      <div className="inz-msg__body">
        {msg.kind === 'intro' ? (
          <div className="inz-bubble inz-bubble--bot inz-bubble--intro">
            <div className="inz-intro__hi">{msg.text}</div>
            {msg.sub && <div className="inz-intro__sub">{msg.sub}</div>}
          </div>
        ) : msg.kind === 'crisis' ? (
          <div className="inz-bubble inz-bubble--bot inz-bubble--crisis">
            <div className="inz-bubble--crisis-title">{msg.text}</div>
            {msg.sub && <div className="inz-bubble--crisis-sub">{msg.sub}</div>}
          </div>
        ) : (
          <>
            <div className="inz-bubble inz-bubble--bot">
              <div className="inz-md">
                <ReactMarkdown components={msg.sources && msg.sources.length > 0 ? {
                  p: ({ children }) => <p>{withCitations(children, msg.sources!)}</p>,
                  li: ({ children }) => <li>{withCitations(children, msg.sources!)}</li>,
                  strong: ({ children }) => <strong>{withCitations(children, msg.sources!)}</strong>,
                } : undefined}>
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
            {msg.sources && msg.sources.length > 0 && <SourceTags sources={msg.sources} />}
          </>
        )}
      </div>
    </div>
  )
}

function PanelHeader({ variation, dark, accent, onMinimize, onCall }: { variation: Variation; dark: boolean; accent: AccentName; onMinimize: () => void; onCall?: () => void }) {
  const mono = iconMonoFor(variation, dark, accent)
  return (
    <div className={'inz-header inz-header--' + variation + (dark ? ' is-dark' : '')}>
      <div className="inz-header__brand">
        <div className="inz-header__avatar">
          <BrainAnim size={variation === 'experimental' ? 38 : 32} mono={mono} />
        </div>
        <div>
          <div className="inz-header__name">Inzi</div>
          <div className="inz-header__status">
            <span className="inz-status-dot" />
            {variation === 'experimental' ? 'always here · always confidential' : 'usually replies in seconds'}
          </div>
        </div>
      </div>
      <div className="inz-header__actions">
        {onCall && (
          <button type="button" className="inz-header__btn inz-header__btn--call" title="Voice call" onClick={onCall} aria-label="Start voice call">
            <Ico.Phone size={16} />
            <span className="inz-header__btn-label">Call</span>
          </button>
        )}
        {variation !== 'experimental' && (
          <button type="button" className="inz-header__btn" title="History" aria-label="Conversation history">
            <Ico.Clock size={18} />
          </button>
        )}
        <button type="button" className="inz-header__btn" title="Minimize" onClick={onMinimize} aria-label="Minimize">
          <Ico.Minus size={18} />
        </button>
      </div>
    </div>
  )
}

interface ChatPanelProps {
  state: InziState
  variation: Variation
  accent: AccentName
  dark: boolean
  onMinimize: () => void
  onPickChip: (label: string) => void
  composerValue: string
  onComposerChange: (v: string) => void
  onComposerSend: () => void
  onCall?: () => void
  onSchedulingSubmit?: (data: SchedulingSubmit) => Promise<void>
  onContactClinicianSubmit?: (data: ContactClinicianSubmit) => Promise<void>
  onCancelHandoff?: () => void
}

export function ChatPanel({ state, variation, accent, dark, onMinimize, onPickChip, composerValue, onComposerChange, onComposerSend, onCall, onSchedulingSubmit, onContactClinicianSubmit, onCancelHandoff }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [state.id])

  const isHistory = state.view === 'history'
  const themeClass: 'light' | 'dark' = dark ? 'dark' : 'light'
  const mono = iconMonoFor(variation, dark, accent)
  const liveComposer = state.composer ? { ...state.composer, value: composerValue || state.composer.value } : null

  return (
    <div className={'inz-panel inz-panel--' + variation + ' accent-' + accent + (dark ? ' is-dark' : '')} role="dialog" aria-label="Inzi chat assistant">
      {variation === 'expressive' && (
        <>
          <div className="inz-deco inz-deco--top">
            <LoopSquiggle width={170} height={170} color="var(--inz-terra)" strokeWidth={3.5} opacity={0.35} />
          </div>
          <div className="inz-deco inz-deco--bottom">
            <LoopSquiggle width={150} height={150} color="var(--inz-peri)" strokeWidth={3.5} opacity={0.35} style={{ transform: 'rotate(180deg)' }} />
          </div>
        </>
      )}
      {variation === 'experimental' && (
        <div className="inz-deco--orb" aria-hidden="true">
          <div className="inz-orb" />
          <div className="inz-orb" />
          <div className="inz-orb" />
        </div>
      )}

      <PanelHeader variation={variation} dark={dark} accent={accent} onMinimize={onMinimize} onCall={onCall} />

      <div className="inz-stream" ref={scrollRef}>
        {state.id === 'welcome' && (
          <div className="inz-trust">
            <span><Ico.Lock size={11} /> private</span>
            <span>·</span>
            <span>not a diagnosis</span>
            <span>·</span>
            <span>real humans nearby</span>
          </div>
        )}

        {isHistory ? (
          <HistoryList threads={state.threads || []} />
        ) : (
          <>
            {(state.messages || []).map((m, i) => (
              <Bubble
                key={i}
                msg={m}
                dark={dark}
                variation={variation}
                accent={accent}
                onSchedulingSubmit={onSchedulingSubmit}
                onContactClinicianSubmit={onContactClinicianSubmit}
                onCancelHandoff={onCancelHandoff}
              />
            ))}
            {state.botTyping && (
              <div className="inz-msg">
                <div className="inz-msg__avatar"><BrainAnim size={28} active mono={mono} /></div>
                <div className="inz-msg__body">
                  <div className="inz-bubble inz-bubble--bot inz-bubble--typing"><TypingDots /></div>
                </div>
              </div>
            )}
            {state.chips && state.chips.length > 0 && (
              <Chips items={state.chips} theme={themeClass} onPick={onPickChip} />
            )}
          </>
        )}
      </div>

      {liveComposer && (
        <div className="inz-foot">
          <Composer
            value={liveComposer.value}
            placeholder={liveComposer.placeholder}
            theme={themeClass}
            typingCaret={liveComposer.typing}
            onChange={onComposerChange}
            onSend={onComposerSend}
          />
          <div className="inz-foot__legal">
            <span>powered by Inzi · <a>privacy</a> · <a>crisis resources</a></span>
          </div>
        </div>
      )}
    </div>
  )
}
