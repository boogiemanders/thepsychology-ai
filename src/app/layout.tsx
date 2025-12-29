import type React from "react"
import { Navbar } from "@/components/sections/navbar"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { OnboardingProvider } from "@/components/onboarding"
import { CopyProtection } from "@/components/copy-protection"
import { siteConfig } from "@/lib/config"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { SubscriptionGate } from "@/components/subscription-gate"
import { AdminFab } from "@/components/admin-fab"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const viewport: Viewport = {
  themeColor: "black",
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/agent-template-og.png",
        width: 1200,
        height: 630,
        alt: "thePsychology.ai - EPPP exam prep with practice questions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/agent-template-og.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <head>
        <Script src="https://unpkg.com/react-scan/dist/auto.global.js" />
      </head> */}

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-background`} suppressHydrationWarning>
        <AuthProvider>
          <OnboardingProvider>
            <CopyProtection />
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <SubscriptionGate>
              <div className="max-w-7xl mx-auto border-x relative">
                <div className="block w-px h-full border-l border-border absolute top-0 left-6 z-10"></div>
                <div className="block w-px h-full border-r border-border absolute top-0 right-6 z-10"></div>
                <Navbar />
                <AdminFab />
                {children}
              </div>
            </SubscriptionGate>
            </ThemeProvider>
          </OnboardingProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
