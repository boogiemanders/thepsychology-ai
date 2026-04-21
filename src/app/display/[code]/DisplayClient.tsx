'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Player, Room } from '@/lib/monikas/types'

// TV display: room code + QR + players. Auto-polls every 1.5s.
// Open in any browser pointed at a TV (smart TV, laptop-HDMI, Chromecast tab).

type State =
  | { phase: 'loading' }
  | { phase: 'ok'; room: Room; players: Player[] }
  | { phase: 'missing' }
  | { phase: 'error'; message: string }

export function DisplayClient({ code }: { code: string }) {
  const [state, setState] = useState<State>({ phase: 'loading' })

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const res = await fetch(`/api/monikas/rooms/${code}`, { cache: 'no-store' })
        if (cancelled) return
        if (res.status === 404) {
          setState({ phase: 'missing' })
          return
        }
        if (!res.ok) {
          setState({ phase: 'error', message: `HTTP ${res.status}` })
          return
        }
        const data = (await res.json()) as { room: Room; players: Player[] }
        setState({ phase: 'ok', room: data.room, players: data.players })
      } catch (err) {
        if (!cancelled) {
          setState({
            phase: 'error',
            message: err instanceof Error ? err.message : 'Network error',
          })
        }
      }
    }
    poll()
    const id = setInterval(poll, 1500)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [code])

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      {state.phase === 'ok' && <DisplayOK code={code} room={state.room} players={state.players} />}
      {state.phase === 'loading' && (
        <div className="min-h-screen flex items-center justify-center text-zinc-400 text-2xl">Loading...</div>
      )}
      {state.phase === 'missing' && (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-zinc-500 text-xl uppercase tracking-[0.2em] font-mono">Room</p>
          <p className="text-8xl font-bold tabular-nums">{code}</p>
          <p className="text-red-400 text-xl mt-6">Not found</p>
        </div>
      )}
      {state.phase === 'error' && (
        <div className="min-h-screen flex items-center justify-center text-red-400 text-xl">{state.message}</div>
      )}
    </main>
  )
}

function DisplayOK({ code, players }: { code: string; room: Room; players: Player[] }) {
  const joinUrl = useJoinUrl(code)
  const qrDataUrl = useQrDataUrl(joinUrl)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-12 pt-10 pb-6 flex items-baseline justify-between">
        <p className="text-[14px] font-mono uppercase tracking-[0.3em] text-zinc-500">Monikas</p>
        <p className="text-[14px] font-mono uppercase tracking-[0.3em] text-zinc-500">
          {players.length} {players.length === 1 ? 'player' : 'players'}
        </p>
      </header>

      {/* Big code + QR side by side */}
      <section className="flex-1 flex items-center justify-center px-12">
        <div className="flex items-center gap-24">
          <div>
            <p className="text-[18px] font-mono uppercase tracking-[0.3em] text-zinc-400 mb-4">Room code</p>
            <p
              className="font-bold tabular-nums leading-none tracking-[-0.02em]"
              style={{ fontSize: 'clamp(8rem, 20vw, 22rem)' }}
            >
              {code}
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Scan to join"
                className="bg-white p-6 rounded-2xl"
                style={{ width: 'min(28vw, 28vh)', height: 'min(28vw, 28vh)' }}
              />
            ) : (
              <div className="bg-white/5 rounded-2xl" style={{ width: 'min(28vw, 28vh)', height: 'min(28vw, 28vh)' }} />
            )}
            <p className="text-[16px] font-mono uppercase tracking-[0.3em] text-zinc-400">Scan to join</p>
          </div>
        </div>
      </section>

      {/* Player strip */}
      <footer className="px-12 py-10 border-t border-white/10">
        {players.length === 0 ? (
          <p className="text-zinc-500 text-xl">Waiting for players...</p>
        ) : (
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 text-sm font-medium">
                  {initials(p.displayName)}
                </div>
                <span className="text-2xl font-medium">{p.displayName}</span>
              </div>
            ))}
          </div>
        )}
      </footer>
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function useJoinUrl(code: string): string {
  return useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/join/${code}`
  }, [code])
}

// Lightweight QR generation without adding a package: use Google Chart API
// substitute via the `qrserver.com` public endpoint. Swap for a bundled lib
// if that URL ever goes down or gets rate-limited.
function useQrDataUrl(content: string): string | null {
  return useMemo(() => {
    if (!content) return null
    const encoded = encodeURIComponent(content)
    return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=0&data=${encoded}`
  }, [content])
}
