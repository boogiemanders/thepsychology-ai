"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/theme-provider"

type AppThemeProviderProps = {
  children: ReactNode
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const pathname = usePathname()
  const forcedTheme = pathname === "/" ? "dark" : undefined

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      forcedTheme={forcedTheme}
    >
      {children}
    </ThemeProvider>
  )
}
