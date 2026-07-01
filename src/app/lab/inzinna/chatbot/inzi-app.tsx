'use client'
import { useEffect, useMemo, useState } from 'react'
import { CLINIC_PHONE, INZ_STATES, type AccentName, type CallbackSubmit, type InziState, type LauncherStyle, type Message, type Variation } from './inzi-data'
import { trackEvent } from './inzi-analytics'
import { ChatPanel } from './inzi-panel'
import type { IntakeOptionId } from './inzi-cards'
import { HomepageBackdrop, Launcher } from './inzi-launcher'
import { TweaksPanel } from './inzi-tweaks'
import { VoiceCall } from './voice-call'
import './inzi.css'

const LIVE_INTRO: Message = {
  from: 'bot',
  kind: 'intro',
  text: "hi, I'm Inzi",
  sub: "ask me anything from the Clinic Manual, Employee Handbook, or Brand Strategy. I cite my sources.",
}

export function InziApp() {
  const [variation, setVariation] = useState<Variation>('expressive')
  const [launcherStyle, setLauncherStyle] = useState<LauncherStyle>('circle')
  const [stateId, setStateId] = useState<string>('welcome')
  const [accent, setAccent] = useState<AccentName>('mint')
  const [dark, setDark] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(true)
  const [composerValue, setComposerValue] = useState<string>('')

  useEffect(() => {
    document.body.classList.add('inzi-page-active')
    return () => { document.body.classList.remove('inzi-page-active') }
  }, [])
  const [liveMessages, setLiveMessages] = useState<Message[]>([LIVE_INTRO])
  const [liveLoading, setLiveLoading] = useState<boolean>(false)
  const [liveActive, setLiveActive] = useState<boolean>(false)
  const [callOpen, setCallOpen] = useState<boolean>(false)

  const stateObj: InziState = useMemo(() => {
    if (liveActive) {
      return {
        id: 'live',
        label: 'Live',
        title: 'Live Q&A (DIPS knowledge base)',
        messages: liveMessages,
        botTyping: liveLoading,
        composer: { value: '', placeholder: 'ask the manual, handbook, or brand strategy...' },
      }
    }
    return INZ_STATES.find(s => s.id === stateId) || INZ_STATES[0]
  }, [liveActive, liveMessages, liveLoading, stateId])

  const stateOptions = useMemo(() => [
    { value: '__live__', label: 'Live Q&A (real KB)' },
    ...INZ_STATES.map(s => ({ value: s.id, label: s.title })),
  ], [])

  const onSet = (key: string, value: any) => {
    if (key === 'variation') setVariation(value)
    else if (key === 'launcherStyle') setLauncherStyle(value)
    else if (key === 'stateId') {
      if (value === '__live__') setLiveActive(true)
      else { setLiveActive(false); setStateId(value) }
    }
    else if (key === 'accent') setAccent(value)
    else if (key === 'dark') setDark(value)
    else if (key === 'open') setOpen(value)
  }

  const enterLive = (initial?: Message) => {
    setLiveActive(true)
    if (initial) setLiveMessages([LIVE_INTRO, initial])
  }

  // Interim HIPAA posture: intake is click-only. No free text, no name/email.
  // A callback request collects a phone number and nothing else.
  const onPickIntakeOption = (id: IntakeOptionId) => {
    trackEvent('inzi_intake_option_selected', { option: id })
    if (id === 'schedule') {
      setLiveMessages(prev => [...prev,
        { from: 'user', text: 'Schedule an appointment' },
        { from: 'bot', text: `the fastest way to book is to call us at ${CLINIC_PHONE}. or leave your number below and our scheduling team will call you back within one business day.` },
        { from: 'bot', kind: 'callback-form', topic: 'scheduling' },
      ])
    } else if (id === 'insurance') {
      setLiveMessages(prev => [...prev,
        { from: 'user', text: 'Insurance question' },
        { from: 'bot', text: "ask me your insurance or billing question right here. I answer from the clinic's own materials, and this chat isn't stored. if you'd rather talk to a person, tap 'Request a callback' above." },
      ])
    } else if (id === 'general') {
      setLiveMessages(prev => [...prev,
        { from: 'user', text: 'General question' },
        { from: 'bot', text: "ask me anything below: hours, location, how sessions work. I answer from the clinic's own materials, and this chat isn't stored. if you'd rather talk to a person, tap 'Request a callback' above." },
      ])
    } else {
      setLiveMessages(prev => [...prev,
        { from: 'user', text: 'Request a callback' },
        { from: 'bot', kind: 'callback-form', topic: 'general' },
      ])
    }
  }

  const startIntake = (preselect?: IntakeOptionId) => {
    trackEvent('inzi_intake_opened', preselect ? { preselect } : {})
    if (preselect) {
      enterLive()
      onPickIntakeOption(preselect)
      return
    }
    enterLive({ from: 'bot', text: "happy to get you to the right person. what do you need?" } as Message)
    setLiveMessages(prev => [...prev, { from: 'bot', kind: 'intake-options' }])
  }

  const onPickChip = (label: string) => {
    const t = label.toLowerCase()
    if (t.includes('schedule') || t.includes('book a session') || t.includes('book an appointment')) return startIntake('schedule')
    if (t.includes('message my') || t.includes('message a clinician') || t.includes('contact my therapist') || t.includes('send a message')) return startIntake()
    if (t.includes('callback') || t.includes('call me')) return startIntake('callback')
    if (liveActive) {
      askLive(label)
      return
    }
    if (t.includes('crisis')) return setStateId('crisis')
    if (t.includes('assessment') || t.includes("let's do it")) return setStateId('assessment-progress')
    if (t.includes('match') || t.includes('therapist') || t.includes('cbt clinicians')) return setStateId('booking')
    if (t.includes('real person')) return setStateId('handoff')
    if (t.includes('insurance') || t.includes('billing') || t.includes('cost') || t.includes('fee')) {
      enterLive()
      askLive(label)
      return
    }
    return setStateId('bot-typing')
  }

  const onCallbackSubmit = async (data: CallbackSubmit) => {
    setLiveMessages(prev => prev.map(m => 'kind' in m && m.kind === 'callback-form' ? { from: 'bot', kind: 'handoff-loading', text: 'sending...' } : m))
    try {
      const res = await fetch('/api/inzi/handoff', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic: data.topic, phone: data.phone }),
      })
      if (!res.ok) throw new Error('Handoff failed')
      trackEvent('inzi_callback_submitted', { topic: data.topic })
      const intent = data.topic === 'scheduling' ? 'scheduling' : data.topic === 'insurance' ? 'billing' : 'general'
      setLiveMessages(prev => prev.filter(m => !('kind' in m) || m.kind !== 'handoff-loading').concat([
        { from: 'bot', kind: 'handoff-success', intent, etaText: "we'll call you back within one business day." },
      ]))
    } catch (e) {
      setLiveMessages(prev => prev.filter(m => !('kind' in m) || m.kind !== 'handoff-loading').concat([
        { from: 'bot', text: `couldn't send that. mind trying again, or call us at ${CLINIC_PHONE}?` },
      ]))
    }
  }

  const onCancelHandoff = () => {
    setLiveMessages(prev => prev.filter(m => !('kind' in m) || m.kind !== 'callback-form').concat([
      { from: 'bot', text: 'no worries. anything else I can help with?' },
    ]))
  }

  const askLive = async (q: string) => {
    if (!q.trim() || liveLoading) return
    setLiveMessages(prev => [...prev, { from: 'user', text: q }])
    setLiveLoading(true)
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()

      if (data.crisis) {
        trackEvent('inzi_crisis_shown')
        setLiveMessages(prev => [...prev,
          { from: 'bot', kind: 'crisis', text: "I hear you, and I'm really glad you said that out loud.", sub: "what you're feeling deserves more support than I can give you in a chat. you're not alone, and there are people trained for exactly this moment, right now." },
          { from: 'bot', kind: 'crisis-actions', actions: [
            { label: 'Call or text 988', sub: 'Suicide & Crisis Lifeline. 24/7, free.', cta: 'tel:988', primary: true },
            { label: 'Text HOME to 741741', sub: 'Crisis Text Line. Confidential.', cta: 'sms:741741' },
            { label: 'Call the Inzinna office', sub: `${CLINIC_PHONE} · during business hours`, cta: `tel:${CLINIC_PHONE.replace(/\D/g, '')}` },
          ] },
        ])
        return
      }

      const rawAnswer: string = data.answer || "I don't have that in the manual."
      const allSources: { title: string; doc: string }[] = data.sources || []

      // Find citation numbers in order of first appearance, e.g. [2][3][5][6] -> [2,3,5,6]
      const order: number[] = []
      const seen = new Set<number>()
      const re = /\[(\d+)\]/g
      let m: RegExpExecArray | null
      while ((m = re.exec(rawAnswer)) !== null) {
        const n = Number(m[1])
        if (!seen.has(n) && n >= 1 && n <= allSources.length) { seen.add(n); order.push(n) }
      }

      // Renumber inline markers: [2] -> [1], [3] -> [2], etc. Cap at 4 — anything beyond is dropped.
      const renumbered = order.slice(0, 4)
      const idxMap = new Map<number, number>()
      renumbered.forEach((n, i) => idxMap.set(n, i + 1))
      const answer = rawAnswer.replace(/\[(\d+)\]/g, (full, num) => {
        const mapped = idxMap.get(Number(num))
        return mapped ? `[${mapped}]` : ''
      }).replace(/\s+/g, ' ').replace(/\s+([.,;:])/g, '$1').trim()

      // Reorder sources to match pill numbering. Fall back to first 4 if no citations were found.
      const sources = renumbered.length > 0
        ? renumbered.map(n => allSources[n - 1])
        : allSources.slice(0, 4)

      setLiveMessages(prev => [...prev, { from: 'bot', text: answer, sources }])
    } catch (err) {
      setLiveMessages(prev => [...prev, { from: 'bot', text: 'something went wrong. try again in a sec.' }])
    } finally {
      setLiveLoading(false)
    }
  }

  const onComposerSend = () => {
    if (!composerValue.trim()) return
    const q = composerValue
    setComposerValue('')
    if (liveActive) askLive(q)
    else {
      setLiveActive(true)
      setLiveMessages([LIVE_INTRO])
      askLive(q)
    }
  }

  return (
    <div className="inzi-root">
      <HomepageBackdrop dim={open} />

      {open && (
        <div className="inz-stage">
          <ChatPanel
            state={stateObj}
            variation={variation}
            accent={accent}
            dark={dark}
            onMinimize={() => setOpen(false)}
            onPickChip={onPickChip}
            composerValue={composerValue}
            onComposerChange={setComposerValue}
            onComposerSend={onComposerSend}
            onCall={() => { setLiveActive(true); setCallOpen(true) }}
            onPickIntakeOption={onPickIntakeOption}
            onCallbackSubmit={onCallbackSubmit}
            onCancelHandoff={onCancelHandoff}
          />
        </div>
      )}

      <Launcher style={launcherStyle} variation={variation} open={open} onToggle={() => setOpen(o => !o)} />

      {callOpen && (
        <VoiceCall
          accent={accent}
          dark={dark}
          onClose={() => setCallOpen(false)}
          onUserSaid={(text) => setLiveMessages(prev => [...prev, { from: 'user', text }])}
          onBotSaid={(msg) => setLiveMessages(prev => [...prev, msg])}
        />
      )}

      <TweaksPanel
        variation={variation}
        launcherStyle={launcherStyle}
        stateId={liveActive ? '__live__' : stateId}
        stateOptions={stateOptions}
        accent={accent}
        dark={dark}
        open={open}
        onSet={onSet}
      />
    </div>
  )
}

function docLabel(doc: string): string {
  if (doc === 'clinic-manual') return 'Clinic Manual'
  if (doc === 'employee-handbook') return 'Employee Handbook'
  if (doc === 'brand-strategy') return 'Brand Strategy'
  return doc
}
