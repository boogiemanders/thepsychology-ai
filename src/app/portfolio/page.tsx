import type { Metadata } from "next"
import PortfolioClient from "./portfolio-client"

export const metadata: Metadata = {
  title: "About",
  alternates: {
    canonical: "/portfolio",
  },
}

export default function PortfolioPage() {
  return <PortfolioClient />
}

