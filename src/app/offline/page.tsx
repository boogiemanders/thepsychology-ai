"use client"

import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-muted rounded-full">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2">You&apos;re Offline</h1>

        <p className="text-muted-foreground mb-6">
          It looks like you&apos;ve lost your internet connection.
          Some features may be unavailable until you&apos;re back online.
        </p>

        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <p className="text-sm text-muted-foreground">
            Your quiz progress is saved locally and will sync when you&apos;re back online.
          </p>
        </div>
      </div>
    </div>
  )
}
