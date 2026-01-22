import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { Search, Menu } from 'lucide-react'
import { ThemeProvider } from '@/components/theme-provider'
import { AnimatedThemeToggler } from '@/components/animated-theme-toggler'

export const metadata: Metadata = {
  title: 'Lab | thepsychology.ai',
  description: 'Experimental projects and tools from thepsychology.ai',
}

const navItems = [
  { label: 'Projects', href: '/', active: true },
  { label: 'Research', href: '/research' },
  { label: 'About', href: '/about' },
  { label: 'People', href: '/people' },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-black text-white">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
{/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/lab/images/logo.png"
                  alt="Logo"
                  className="h-7 md:h-10 w-auto"
                />
                <div className="flex flex-col leading-none">
                  <span className="text-lg font-semibold">thePsychology.ai</span>
                  <span className="text-xs tracking-widest text-gray-400 uppercase">Lab</span>
                </div>
              </Link>

              {/* Right side icons */}
              <div className="flex items-center gap-2">
                <AnimatedThemeToggler />
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden">
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Hero tagline bar */}
          <div className="fixed top-[72px] left-0 right-0 z-40 bg-black text-white py-6 px-6">
            <p className="text-2xl md:text-3xl font-light tracking-wide max-w-4xl">
              Make life easier.
            </p>
          </div>

          {/* Main layout with sidebar */}
          <div className="pt-[168px] flex min-h-screen">
            {/* Sidebar */}
            <aside className="sidebar hidden md:block fixed left-0 top-[168px] bottom-0 w-60 border-r overflow-y-auto" style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}>
              <nav className="p-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${item.active ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Social links */}
                <div className="mt-8 pt-8 border-t flex gap-4" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                  <a href="https://x.com/thepsychologyai" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--foreground)] transition-colors" aria-label="X (Twitter)">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="https://tiktok.com/@thepsychology.ai" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--foreground)] transition-colors" aria-label="TikTok">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z"/></svg>
                  </a>
                </div>
              </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 md:ml-60">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
