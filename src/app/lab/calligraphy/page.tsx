import { Suspense } from 'react'
import type { Metadata } from 'next'
import CalligraphyStudio from './calligraphy-studio'

export const metadata: Metadata = {
  title: 'Chinese Calligraphy Studio',
  description: 'Type in English, translate to Chinese, and preview across brush-style calligraphy fonts.',
}

export default function CalligraphyPage() {
  return (
    <Suspense>
      <CalligraphyStudio />
    </Suspense>
  )
}
