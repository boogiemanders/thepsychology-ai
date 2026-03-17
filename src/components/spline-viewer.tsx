"use client"

import Script from "next/script"
import React from "react"

type SplineViewerProps = {
  scene: string
  className?: string
}

const SPLINE_VIEWER_SCRIPT_ID = "spline-viewer-script"
const SPLINE_VIEWER_SCRIPT_SRC =
  "https://unpkg.com/@splinetool/viewer@1.12.57/build/spline-viewer.js"

export function SplineViewer({ scene, className }: SplineViewerProps) {
  return (
    <>
      <Script
        id={SPLINE_VIEWER_SCRIPT_ID}
        type="module"
        src={SPLINE_VIEWER_SCRIPT_SRC}
        strategy="afterInteractive"
      />
      {React.createElement("spline-viewer", {
        url: scene,
        className,
      })}
    </>
  )
}
