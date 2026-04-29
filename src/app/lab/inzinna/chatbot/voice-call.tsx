'use client'
import { useEffect, useRef, useState } from 'react'
import { Ico } from './inzi-icons'
import type { AccentName, Message } from './inzi-data'

type CallState = 'idle' | 'greeting' | 'listening' | 'thinking' | 'speaking' | 'error'

interface VoiceCallProps {
  accent: AccentName
  dark: boolean
  onClose: () => void
  onUserSaid: (text: string) => void
  onBotSaid: (msg: Message) => void
}

const GREETING = "hi, I'm Inzi. ask me anything from the clinic manual, employee handbook, or brand strategy."

function stripForTts(raw: string): string {
  return raw
    .replace(/\[\d+\]/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim()
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  const order = [
    (v: SpeechSynthesisVoice) => v.name === 'Samantha',
    (v: SpeechSynthesisVoice) => /Google US English/i.test(v.name),
    (v: SpeechSynthesisVoice) => /Natural/i.test(v.name) && v.lang.startsWith('en-US'),
    (v: SpeechSynthesisVoice) => v.lang === 'en-US',
    (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
  ]
  for (const test of order) {
    const v = voices.find(test)
    if (v) return v
  }
  return voices[0] || null
}

export function VoiceCall({ accent, dark, onClose, onUserSaid, onBotSaid }: VoiceCallProps) {
  const [callState, setCallState] = useState<CallState>('idle')
  const [interim, setInterim] = useState<string>('')
  const [lastBotLine, setLastBotLine] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const recognitionRef = useRef<any>(null)
  const callStateRef = useRef<CallState>('idle')
  const voicesReadyRef = useRef<boolean>(false)
  const endedRef = useRef<boolean>(false)

  useEffect(() => { callStateRef.current = callState }, [callState])

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setCallState('error')
      setErrorMsg('voice mode needs Chrome or Safari. try a different browser.')
      return
    }
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (e: any) => {
      let finalText = ''
      let interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t
        else interimText += t
      }
      if (interimText) setInterim(interimText)
      if (finalText.trim()) {
        setInterim('')
        handleUserSpeech(finalText.trim())
      }
    }

    rec.onerror = (e: any) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      console.warn('SR error:', e.error)
    }

    rec.onend = () => {
      if (callStateRef.current === 'listening' && !endedRef.current) {
        try { rec.start() } catch {}
      }
    }

    recognitionRef.current = rec

    const onVoices = () => { voicesReadyRef.current = true }
    window.speechSynthesis.addEventListener('voiceschanged', onVoices)
    if (window.speechSynthesis.getVoices().length > 0) voicesReadyRef.current = true

    return () => {
      endedRef.current = true
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices)
      try { rec.stop() } catch {}
      window.speechSynthesis.cancel()
    }
  }, [])

  const speak = (text: string, onDone?: () => void) => {
    if (!text) { onDone?.(); return }
    const clean = stripForTts(text)
    if (!clean) { onDone?.(); return }
    setLastBotLine(clean)
    const u = new SpeechSynthesisUtterance(clean)
    u.rate = 1.05
    u.pitch = 1
    u.volume = 1
    const v = pickVoice()
    if (v) u.voice = v
    u.onend = () => { onDone?.() }
    u.onerror = () => { onDone?.() }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  const startListening = () => {
    if (endedRef.current) return
    setCallState('listening')
    try { recognitionRef.current?.start() } catch {}
  }

  const handleUserSpeech = async (text: string) => {
    if (endedRef.current) return
    onUserSaid(text)
    setCallState('thinking')
    try { recognitionRef.current?.stop() } catch {}
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: text }),
      })
      const data = await res.json()
      const rawAnswer: string = data.answer || "I don't have that in the manual."
      const allSources: { title: string; doc: string }[] = data.sources || []

      const order: number[] = []
      const seen = new Set<number>()
      const re = /\[(\d+)\]/g
      let m: RegExpExecArray | null
      while ((m = re.exec(rawAnswer)) !== null) {
        const n = Number(m[1])
        if (!seen.has(n) && n >= 1 && n <= allSources.length) { seen.add(n); order.push(n) }
      }
      const renumbered = order.slice(0, 4)
      const idxMap = new Map<number, number>()
      renumbered.forEach((n, i) => idxMap.set(n, i + 1))
      const finalAnswer = rawAnswer.replace(/\[(\d+)\]/g, (_full, num) => {
        const mapped = idxMap.get(Number(num))
        return mapped ? `[${mapped}]` : ''
      }).replace(/\s+/g, ' ').replace(/\s+([.,;:])/g, '$1').trim()
      const sources = renumbered.length > 0
        ? renumbered.map(n => allSources[n - 1])
        : allSources.slice(0, 4)

      onBotSaid({ from: 'bot', text: finalAnswer, sources })
      if (endedRef.current) return
      setCallState('speaking')
      speak(finalAnswer, () => {
        if (!endedRef.current) startListening()
      })
    } catch (err) {
      onBotSaid({ from: 'bot', text: 'something went wrong. try again in a sec.' })
      if (endedRef.current) return
      setCallState('speaking')
      speak('something went wrong. try again.', () => {
        if (!endedRef.current) startListening()
      })
    }
  }

  const startCall = () => {
    setCallState('greeting')
    setLastBotLine(GREETING)
    speak(GREETING, () => {
      if (!endedRef.current) startListening()
    })
  }

  const endCall = () => {
    endedRef.current = true
    try { recognitionRef.current?.stop() } catch {}
    window.speechSynthesis.cancel()
    onClose()
  }

  const statusText = (() => {
    if (callState === 'idle') return 'tap to start the call'
    if (callState === 'greeting') return 'Inzi is greeting you...'
    if (callState === 'listening') return interim || 'listening...'
    if (callState === 'thinking') return 'thinking...'
    if (callState === 'speaking') return 'Inzi is speaking...'
    if (callState === 'error') return errorMsg
    return ''
  })()

  return (
    <div className={`inz-call accent-${accent} ${dark ? 'is-dark' : ''}`} role="dialog" aria-label="Voice call with Inzi">
      <div className="inz-call__bg" />
      <div className="inz-call__panel">
        <div className="inz-call__top">
          <div className="inz-call__brand">
            <span className="inz-call__brand-name">Inzi</span>
            <span className="inz-call__brand-sub">voice mode · demo</span>
          </div>
          <button className="inz-call__close" onClick={endCall} aria-label="End call">close</button>
        </div>

        <div className="inz-call__center">
          <div className={`inz-call__orb is-${callState}`} aria-hidden="true">
            <div className="inz-call__orb-core" />
            <div className="inz-call__orb-ring inz-call__orb-ring--1" />
            <div className="inz-call__orb-ring inz-call__orb-ring--2" />
            <div className="inz-call__orb-ring inz-call__orb-ring--3" />
          </div>

          <div className="inz-call__status">{statusText}</div>

          {lastBotLine && callState !== 'idle' && (
            <div className="inz-call__last-line">{lastBotLine}</div>
          )}
        </div>

        <div className="inz-call__actions">
          {callState === 'idle' && (
            <button className="inz-call__btn inz-call__btn--start" onClick={startCall}>
              <Ico.Phone size={18} />
              <span>Start call</span>
            </button>
          )}
          {callState !== 'idle' && callState !== 'error' && (
            <button className="inz-call__btn inz-call__btn--end" onClick={endCall}>
              <span>End call</span>
            </button>
          )}
          {callState === 'error' && (
            <button className="inz-call__btn inz-call__btn--end" onClick={endCall}>
              <span>Close</span>
            </button>
          )}
        </div>

        <div className="inz-call__legal">
          uses your browser microphone. nothing is recorded. demo only.
        </div>
      </div>
    </div>
  )
}
