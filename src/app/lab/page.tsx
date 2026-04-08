import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Lab | thePsychology.ai',
  description: 'Experimental tools and creative projects.',
}

const tools = [
  {
    href: '/lab/calligraphy',
    title: 'Chinese Calligraphy Studio',
    description: 'Type in English, translate to Chinese, and preview across brush-style calligraphy fonts.',
  },
]

export default function LabPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Lab</h1>
      <p className="text-muted-foreground mb-10">Experimental tools and creative projects.</p>
      <div className="grid gap-4">
        {tools.map(tool => (
          <Link
            key={tool.href}
            href={tool.href}
            className="block rounded-xl border border-border p-5 transition-colors hover:bg-muted/50"
          >
            <h2 className="text-lg font-medium mb-1">{tool.title}</h2>
            <p className="text-sm text-muted-foreground">{tool.description}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
