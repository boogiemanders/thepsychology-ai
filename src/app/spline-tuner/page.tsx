"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
})

export default function SplineTunerPage() {
  const [x, setX] = useState(-50)
  const [y, setY] = useState(-50)
  const [w, setW] = useState(200)
  const [h, setH] = useState(220)
  const [scale, setScale] = useState(0.5)

  const code = `style={{ width: "${w}%", height: "${h}%", top: "${y}%", left: "${x}%", transform: "scale(${scale})" }}`

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-6">Spline Position Tuner</h1>

      <div className="grid grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">X offset: {x}%</label>
            <input type="range" min={-100} max={50} value={x} onChange={e => setX(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Y offset: {y}%</label>
            <input type="range" min={-100} max={50} value={y} onChange={e => setY(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Width: {w}%</label>
            <input type="range" min={100} max={400} value={w} onChange={e => setW(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Height: {h}%</label>
            <input type="range" min={100} max={400} value={h} onChange={e => setH(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Scale: {scale}</label>
            <input type="range" min={20} max={100} value={scale * 100} onChange={e => setScale(Number(e.target.value) / 100)} className="w-full" />
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Copy these values:</p>
            <code className="text-xs block break-all select-all">{code}</code>
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            Copy to clipboard
          </button>
        </div>

        {/* Preview */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Preview (same dimensions as homepage)</p>
          <div className="relative flex w-full max-w-[560px] mx-auto items-center justify-center h-[420px] overflow-hidden border border-dashed border-border rounded-lg">
            <div
              className="absolute origin-center"
              style={{
                width: `${w}%`,
                height: `${h}%`,
                top: `${y}%`,
                left: `${x}%`,
                transform: `scale(${scale})`,
              }}
            >
              <Spline scene="https://prod.spline.design/5Vh4gTb7J89r4Q9n/scene.splinecode?v=10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
