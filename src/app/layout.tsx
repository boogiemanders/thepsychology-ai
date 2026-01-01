import type React from "react"
import { Navbar } from "@/components/sections/navbar"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { ActivityProvider } from "@/context/activity-context"
import { OnboardingProvider } from "@/components/onboarding"
import { CopyProtection } from "@/components/copy-protection"
import { siteConfig } from "@/lib/config"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { SubscriptionGate } from "@/components/subscription-gate"
import { AdminFab } from "@/components/admin-fab"
import { SessionWarningDialog } from "@/components/session-warning-dialog"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "thePsychology.ai",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
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
        url: "/og",
        width: 1200,
        height: 630,
        alt: "thePsychology.ai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/og"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const baseUrl = siteConfig.url.replace(/\/$/, "")
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url: baseUrl,
      logo: `${baseUrl}/images/logo.png`,
      email: siteConfig.links.email,
      sameAs: Object.values(siteConfig.links).filter((value) => value.startsWith("http")),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: baseUrl,
      description: siteConfig.description,
      publisher: {
        "@type": "Organization",
        name: siteConfig.name,
      },
    },
  ]

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-background`} suppressHydrationWarning>
        <AuthProvider>
          <SessionWarningDialog />
          <ActivityProvider>
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
              <PWAInstallPrompt />
              </ThemeProvider>
            </OnboardingProvider>
          </ActivityProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
