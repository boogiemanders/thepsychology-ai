'use client'

import { useEffect, useState } from 'react'
import type { Player, Room } from '@/lib/monikas/types'

type Phase =
  | { kind: 'name' }
  | { kind: 'joining' }
  | { kind: 'lobby'; room: Room; player: Player; playerToken: string; cardsSubmitted: number }
  | { kind: 'ingame'; room: Room; player: Player; playerToken: string; isActor: boolean }
  | { kind: 'error'; message: string }

const LS_KEY = (code: string) => `monikas:${code}`
const CARDS_REQUIRED = 5

export function JoinClient({ code }: { code: string }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'name' })
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY(code))
      if (!raw) return
      const parsed = JSON.parse(raw) as { room: Room; player: Player; playerToken: string }
      setPhase({ kind: 'lobby', ...parsed, cardsSubmitted: 0 })
    } catch {}
  }, [code])

  useEffect(() => {
    if (phase.kind !== 'lobby' && phase.kind !== 'ingame') return
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(`/api/monikas/rooms/${code}`, { cache: 'no-store' })
        if (cancelled) return
        if (!res.ok) return
        const data = (await res.json()) as {
          room: Room
          players: Player[]
          cardCounts?: Record<string, number>
        }
        setPhase((prev) => {
          if (prev.kind !== 'lobby' && prev.kind !== 'ingame') return prev
          const myId = prev.player.id
          const refreshedPlayer = data.players.find((p) => p.id === myId) ?? prev.player
          const count = data.cardCounts?.[myId] ?? 0
          if (data.room.status !== 'lobby') {
            return {
              kind: 'ingame',
              room: data.room,
              player: refreshedPlayer,
              playerToken: prev.playerToken,
              isActor: data.room.activeActorPlayerId === myId,
            }
          }
          return {
            kind: 'lobby',
            room: data.room,
            player: refreshedPlayer,
            playerToken: prev.playerToken,
            cardsSubmitted: count,
          }
        })
      } catch {}
    }
    poll()
    const id = setInterval(poll, 1500)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [phase.kind, code])

  async function onJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return
    setPhase({ kind: 'joining' })
    try {
      const res = await fetch(`/api/monikas/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), joinType: 'web_player' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Join failed' }))
        setPhase({ kind: 'error', message: body.error || 'Join failed' })
        return
      }
      const data = (await res.json()) as { room: Room; player: Player; playerToken: string }
      localStorage.setItem(LS_KEY(code), JSON.stringify(data))
      setPhase({ kind: 'lobby', ...data, cardsSubmitted: 0 })
    } catch (err) {
      setPhase({ kind: 'error', message: err instanceof Error ? err.message : 'Network error' })
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="px-5 pt-10 pb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 mb-2">Monikas</p>
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-400">Room</p>
        <h1 className="text-5xl font-bold tracking-tight mt-1 tabular-nums">{code}</h1>
      </header>

      <section className="px-5 pb-10 flex-1">
        {phase.kind === 'name' && (
          <form onSubmit={onJoin} className="space-y-4">
            <label className="block">
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-500">Your name</span>
              <input
                suppressHydrationWarning
                autoFocus
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={40}
                className="mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-[17px] text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-600"
                placeholder="What should we call you?"
              />
            </label>
            <button
              type="submit"
              disabled={!displayName.trim()}
              className="w-full bg-zinc-100 text-zinc-900 font-medium rounded-xl py-4 text-[17px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Join room
            </button>
          </form>
        )}

        {phase.kind === 'joining' && <p className="text-zinc-400 text-[15px]">Joining...</p>}

        {phase.kind === 'lobby' && (
          <CardSubmit
            code={code}
            playerName={phase.player.displayName}
            playerToken={phase.playerToken}
            alreadySubmitted={phase.cardsSubmitted}
            onLeave={() => {
              localStorage.removeItem(LS_KEY(code))
              setPhase({ kind: 'name' })
              setDisplayName('')
            }}
          />
        )}

        {phase.kind === 'ingame' && (
          <div className="space-y-4">
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              {phase.isActor ? 'Your turn' : 'Waiting'}
            </p>
            <p className="text-3xl font-bold">{phase.isActor ? 'You are up' : 'Watch the TV'}</p>
            <p className="text-zinc-400 text-[14px] leading-relaxed">
              Gameplay loop — timer, card, Got It / Skip — arrives next milestone.
            </p>
          </div>
        )}

        {phase.kind === 'error' && (
          <div className="space-y-4">
            <p className="text-red-400 text-[15px]">{phase.message}</p>
            <button
              onClick={() => setPhase({ kind: 'name' })}
              className="text-[13px] text-zinc-500 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}
      </section>

      <footer className="px-5 pb-8 text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-600">
        thepsychology.ai / monikas
      </footer>
    </main>
  )
}

function CardSubmit({
  code,
  playerName,
  playerToken,
  alreadySubmitted,
  onLeave,
}: {
  code: string
  playerName: string
  playerToken: string
  alreadySubmitted: number
  onLeave: () => void
}) {
  const [cards, setCards] = useState<string[]>(Array(CARDS_REQUIRED).fill(''))
  const [notes, setNotes] = useState<string[]>(Array(CARDS_REQUIRED).fill(''))
  const [showNote, setShowNote] = useState<boolean[]>(Array(CARDS_REQUIRED).fill(false))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedOnce, setSavedOnce] = useState(alreadySubmitted >= CARDS_REQUIRED)

  async function save() {
    const payload = cards
      .map((text, i) => ({ text: text.trim(), secretNote: notes[i].trim() || undefined }))
      .filter((c) => c.text.length > 0)

    if (payload.length === 0) {
      setSaveError('Write at least one card')
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/monikas/rooms/${code}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${playerToken}` },
        body: JSON.stringify({ cards: payload }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Save failed' }))
        setSaveError(body.error || 'Save failed')
      } else {
        setSavedOnce(true)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setSaving(false)
    }
  }

  const filledCount = cards.filter((c) => c.trim().length > 0).length

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-500">Joined as</p>
        <p className="text-2xl font-semibold mt-1">{playerName}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-400">Write 5 cards</p>
          <p className="text-[11px] font-mono text-zinc-500 tabular-nums">
            {filledCount}/{CARDS_REQUIRED}
          </p>
        </div>
        <p className="text-[12px] text-zinc-500 leading-relaxed">
          Anything — people everyone knows, oddly specific social moments, characters, objects. No censorship. Secret notes are optional and show up in the recap after the card is guessed.
        </p>

        {cards.map((text, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-600 tabular-nums w-5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <input
                suppressHydrationWarning
                value={text}
                onChange={(e) =>
                  setCards((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                }
                maxLength={280}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-3 text-[15px] outline-none focus:border-zinc-600"
                placeholder="A card..."
              />
              <button
                type="button"
                onClick={() => setShowNote((p) => p.map((v, idx) => (idx === i ? !v : v)))}
                className="text-[16px] text-zinc-500 w-6"
                aria-label={showNote[i] ? 'Hide secret note' : 'Add secret note'}
              >
                {showNote[i] ? '−' : '+'}
              </button>
            </div>
            {showNote[i] && (
              <input
                suppressHydrationWarning
                value={notes[i]}
                onChange={(e) =>
                  setNotes((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                }
                maxLength={200}
                className="ml-7 w-[calc(100%-1.75rem)] bg-zinc-950 border border-zinc-800/60 rounded-lg px-3 py-2 text-[13px] text-zinc-300 placeholder-zinc-600 outline-none focus:border-zinc-700"
                placeholder="secret note (shown after it's guessed)"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving || filledCount === 0}
        className="w-full bg-zinc-100 text-zinc-900 font-medium rounded-xl py-4 text-[16px] disabled:opacity-40"
      >
        {saving ? 'Saving...' : savedOnce ? 'Update cards' : 'Submit cards'}
      </button>

      {savedOnce && !saving && (
        <p className="text-emerald-400 text-[13px]">Saved. Wait for the host to start.</p>
      )}
      {saveError && <p className="text-red-400 text-[13px]">{saveError}</p>}

      <button onClick={onLeave} className="text-[12px] text-zinc-600 underline underline-offset-4">
        Leave room
      </button>
    </div>
  )
}
