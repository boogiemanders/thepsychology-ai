import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SENSE Lens | Sensory-Informed Clinical Framework',
  description: 'A clinician-first tool for integrating sensory processing considerations into therapy.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto max-w-screen-md px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  )
}
