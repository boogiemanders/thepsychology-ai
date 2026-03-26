import type { Metadata } from "next"
import ClientLanding from "./client-landing"

export const metadata: Metadata = {
  title: "Client Matching Early Access | thePsychology.ai",
  description:
    "We are building a better therapy-search flow. Join early access to shape matching, insurance transparency, and a less frustrating path to finding care.",
  alternates: {
    canonical: "/client",
  },
  openGraph: {
    title: "Client Matching Early Access | thePsychology.ai",
    description:
      "We are building a better therapy-search flow. Join early access to shape matching, insurance transparency, and a less frustrating path to finding care.",
    url: "/client",
  },
}

export default function ClientPage() {
  return <ClientLanding />
}
