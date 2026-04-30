import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sound Remake | Lab',
  description: 'Drop in audio, get the synth recipe. Analyzes sound and drives your real plugins to rebuild it.',
}

export default function SoundRemakePage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 sm:py-24">
      <div className="mb-10">
        <Link
          href="/lab"
          className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 cursor-pointer"
        >
          &larr; Lab
        </Link>
      </div>

      <div className="mb-10">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Creative
          </span>
          <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Concept
          </span>
          <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            v0.1
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-3">Sound Remake</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          A local sound-remake assistant that listens to audio, figures out the recipe, drives your real instruments, and saves the good results into your own library. Closest remake, not exact clone.
        </p>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          What We&apos;re Building First
        </h2>
        <ol className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
          {[
            'Drum tool -- detect hits, split kick/snare/hat, export MIDI and one-shots',
            '808 tool -- detect pitch, glide, envelope, saturation, rebuild internally then target Serum',
            'Simple synth remake -- plucks, leads, pads, basses via template-first matching',
            'Plugin targeting -- host Serum, move trusted knobs, use template patches',
            'Iteration macros -- closer / brighter / punchier / longer tail / more width',
            'Library saver -- presets, one-shots, MIDI clips, tagged favorites',
          ].map((item, index) => (
            <li key={item} className="flex gap-3">
              <span className="font-mono text-[11px] text-zinc-300 dark:text-zinc-600 mt-0.5 shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          Why This Tool
        </h2>
        <div className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
          <p>
            Nobody owns the full pipeline. Synplant matches sound but can&apos;t drive external plugins. MicroMusic outputs Serum presets but has no iteration UI. Emergent Drums generates but can&apos;t analyze existing audio.
          </p>
          <p>
            The gap: analyze + translate + drive your real plugin + iterate with smart macros + save to your library. All local-first.
          </p>
          <p>
            Template-first architecture (Serum Bass Template, Serum Pluck Template) is dramatically more reliable than trying to solve every parameter from day one.
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mb-8">
        <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-900 dark:text-zinc-100 mb-4">
          Target Plugins
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          {[
            { name: 'Serum', note: 'First target' },
            { name: 'Omnisphere', note: 'Second target' },
            { name: 'Kontakt', note: 'Third target' },
            { name: 'Ableton Live', note: 'Max for Live lane' },
          ].map((plugin) => (
            <div
              key={plugin.name}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2.5"
            >
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{plugin.name}</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{plugin.note}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
        Internal use. Standalone app + DAW plugin companion. VST3/JUCE.
      </p>
    </main>
  )
}
