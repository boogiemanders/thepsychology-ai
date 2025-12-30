import type { Metadata } from "next"
import { Suspense } from "react"
import PortfolioClient from "./portfolio-client"

export const metadata: Metadata = {
  title: "About",
  alternates: {
    canonical: "/portfolio",
  },
}

export default function PortfolioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PortfolioClient />
    </Suspense>
  )
}

