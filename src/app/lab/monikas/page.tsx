import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Monikas | Lab',
  description: 'A party game platform for local group play. iPhone hosts the room, TV shows the public scene, phone stays private.',
}

export default function MonikasLabPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-12">
        <Link
          href="/lab"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
        >
          &larr; Lab
        </Link>
      </div>

      <header className="mb-16">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500 mb-3">
          03 Creative
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
          Monikas
        </h1>
        <p className="text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-xl">
          A party game platform for local group play. The iPhone hosts the room and AirPlays a public scene to the TV. The phone stays private for the actor. Replayable decks, legend cards, callbacks, no censorship.
        </p>
      </header>

      <section className="mt-16 border-t border-zinc-100 dark:border-zinc-800/50 pt-12 mb-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-5">
          Core idea
        </h2>
        <div className="space-y-3 text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          <p>
            Monikas and charades but built for how groups actually play in a living room. One phone, one TV, no printed cards, no scoresheet on paper.
          </p>
          <p>
            The iPhone app is the host. It creates the room, shows a code and a QR, renders the public scene to the TV via AirPlay, and stays as the private controller when the host is the actor. Other players join by scanning the QR from their own phones.
          </p>
          <p>
            The game lives on the backend so pause, quit, and resume work. You can lose a signal, re-open the app, and the room picks up where it stopped.
          </p>
        </div>
      </section>

      <section className="mt-16 border-t border-zinc-100 dark:border-zinc-800/50 pt-12 mb-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-5">
          What makes it different
        </h2>
        <ol className="space-y-4 text-[14px] text-zinc-500 dark:text-zinc-400">
          {[
            { title: 'TV public, phone private.', body: 'The actor never has to hide a screen. The TV only shows room state. The phone shows card, skip, got-it, pause.' },
            { title: 'No censorship.', body: 'Cards stay as submitted. Only technical validation (length, escape, no floods). The humor is the group, not the filter.' },
            { title: 'Replayable decks.', body: 'Same cards across three rounds: describe, one word, act only. All state preserved — legend votes, secret notes, callbacks.' },
            { title: 'Funny layer, not noise.', body: 'Quotes, legend votes, broke-the-room badges, short roast recap lines. Quick to use, easy to skip.' },
            { title: 'Callbacks and sudden death.', body: 'A few legendary cards come back later in the game. The greatest-hits finale replays only the cards that broke the room.' },
            { title: 'Character commitment prompts.', body: 'Optional acting modifier per turn — do it like a divorced magician, a church auntie, a spy hiding something. Off by default.' },
          ].map((item, index) => (
            <li key={item.title} className="flex gap-3">
              <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 pt-0.5 shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-zinc-900 dark:text-zinc-100 text-[14px] font-medium">{item.title}</p>
                <p className="mt-1">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 border-t border-zinc-100 dark:border-zinc-800/50 pt-12 mb-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-5">
          Stack
        </h2>
        <div className="grid grid-cols-2 gap-3 text-[14px] text-zinc-500 dark:text-zinc-400">
          {[
            { name: 'iOS Host', note: 'SwiftUI, AirPlay' },
            { name: 'Web Join', note: 'Next.js, mobile-first' },
            { name: 'Realtime', note: 'Supabase Channels' },
            { name: 'Database', note: 'Postgres, 15 tables' },
            { name: 'AI Clues', note: 'Optional backend endpoint' },
            { name: 'Future', note: 'Android host, tvOS' },
          ].map((item) => (
            <div key={item.name} className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2.5">
              <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{item.name}</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-800/50">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
          Status: in development. More notes, screenshots, and the join link will land here as the app fills in.
        </p>
      </footer>
    </main>
  )
}
