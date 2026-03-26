import type { Metadata } from "next"
import ClientLanding from "./client-landing"

export const metadata: Metadata = {
  title: "Client Matching Early Access | thePsychology.ai",
  description:
    "We are building a better way to find therapy. Join early access for better matches, clear insurance info, and less frustration.",
  alternates: {
    canonical: "/client",
  },
  openGraph: {
    title: "Client Matching Early Access | thePsychology.ai",
    description:
      "We are building a better way to find therapy. Join early access for better matches, clear insurance info, and less frustration.",
    url: "/client",
  },
}

export default function ClientPage() {
  return <ClientLanding />
}
