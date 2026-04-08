import { ThemeToggle } from '@/components/theme-toggle'

export function HeroSection() {
  return (
    <header className="cs-hero">
      <div className="cs-hero-top">
        <p className="cs-eyebrow">Chinese Calligraphy Studio</p>
        <ThemeToggle />
      </div>
      <div className="cs-hero-title-row">
        <h1>Type in English.<br />Preview in brush-style fonts.</h1>
        <span className="cs-seal" aria-hidden="true">{'\u58a8'}</span>
      </div>
      <p className="cs-hero-copy">
        Enter English text, translate via AI, and preview across your
        calligraphy collection.
      </p>
    </header>
  )
}
