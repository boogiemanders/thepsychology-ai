import type React from 'react'

export default function CalligraphyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="calligraphy-layout-root">
      {children}
    </div>
  )
}
