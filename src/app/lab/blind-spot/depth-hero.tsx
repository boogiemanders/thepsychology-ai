'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import BoxLoader from '@/components/ui/box-loader'

// === KNOBS — edit these ===
const DISPLACE = 1.2          // depth strength (0.5 to 2.5)
const POINT_SIZE = 1.4        // dot size in px (1.0 to 3.0)
const COLS = 960              // grid density
const ROWS = 540
const CUTOFF = 0.30           // depth floor (0 to 1, higher = chops more wall)
const BOX_X_MIN = 0.40        // left edge of person box (0=left, 1=right)
const BOX_X_MAX = 0.82        // right edge
const BOX_Y_MIN = 0.05        // bottom edge of person box (0=bottom, 1=top)
const BOX_Y_MAX = 0.88        // top edge
// ==========================

const VERT = `
  uniform sampler2D uDepth;
  uniform float uDisplace;
  uniform float uPointSize;
  uniform float uAspect;
  uniform float uCutoff;
  uniform vec2 uBoundsMin;
  uniform vec2 uBoundsMax;
  varying float vDepth;
  void main() {
    vec2 uv = position.xy * 0.5 + 0.5;
    float d = texture2D(uDepth, uv).r;
    vDepth = d;
    vec3 pos = position;
    pos.x *= uAspect;
    pos.z = (d - 0.5) * uDisplace;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    bool inBox = uv.x >= uBoundsMin.x && uv.x <= uBoundsMax.x && uv.y >= uBoundsMin.y && uv.y <= uBoundsMax.y;
    gl_PointSize = (d < uCutoff || !inBox) ? 0.0 : uPointSize;
  }
`

const FRAG = `
  varying float vDepth;
  vec3 spectral(float t) {
    vec3 c0 = vec3(0.369, 0.310, 0.635);
    vec3 c1 = vec3(0.196, 0.533, 0.741);
    vec3 c2 = vec3(0.400, 0.761, 0.647);
    vec3 c3 = vec3(0.671, 0.867, 0.643);
    vec3 c4 = vec3(0.902, 0.961, 0.596);
    vec3 c5 = vec3(0.996, 0.878, 0.545);
    vec3 c6 = vec3(0.992, 0.682, 0.380);
    vec3 c7 = vec3(0.957, 0.427, 0.263);
    vec3 c8 = vec3(0.835, 0.243, 0.310);
    float s = clamp(t, 0.0, 1.0) * 8.0;
    int i = int(floor(s));
    float f = fract(s);
    if (i == 0) return mix(c0, c1, f);
    if (i == 1) return mix(c1, c2, f);
    if (i == 2) return mix(c2, c3, f);
    if (i == 3) return mix(c3, c4, f);
    if (i == 4) return mix(c4, c5, f);
    if (i == 5) return mix(c5, c6, f);
    if (i == 6) return mix(c6, c7, f);
    return mix(c7, c8, f);
  }
  uniform float uCutoff;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    if (max(abs(uv.x), abs(uv.y)) > 0.5) discard;
    if (vDepth < uCutoff) discard;
    float colorD = clamp((vDepth - uCutoff) / (1.0 - uCutoff), 0.0, 1.0);
    vec3 col = spectral(0.15 + colorD * 0.85);
    gl_FragColor = vec4(col, 1.0);
  }
`

export default function DepthHero({ src, poster }: { src: string; poster?: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 100)
    camera.position.set(0, 0, 2.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const setSize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (w === 0 || h === 0) return
      renderer.setSize(w, h, true)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    setSize()

    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.loop = true
    video.muted = true
    video.playsInline = true
    video.autoplay = true
    video.preload = 'auto'
    const tryPlay = () => video.play().catch(() => {})
    const onLoaded = () => setReady(true)
    video.addEventListener('loadeddata', tryPlay)
    video.addEventListener('loadeddata', onLoaded)
    video.addEventListener('canplay', onLoaded)
    video.src = src
    if (video.readyState >= 2) setReady(true)
    tryPlay()

    const tex = new THREE.VideoTexture(video)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.colorSpace = THREE.NoColorSpace

    const positions = new Float32Array(COLS * ROWS * 3)
    let i = 0
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        positions[i++] = (x / (COLS - 1)) * 2 - 1
        positions[i++] = (y / (ROWS - 1)) * 2 - 1
        positions[i++] = 0
      }
    }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const ASPECT = 16 / 9
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uDepth: { value: tex },
        uDisplace: { value: DISPLACE },
        uPointSize: { value: POINT_SIZE },
        uAspect: { value: ASPECT },
        uCutoff: { value: CUTOFF },
        uBoundsMin: { value: new THREE.Vector2(BOX_X_MIN, BOX_Y_MIN) },
        uBoundsMax: { value: new THREE.Vector2(BOX_X_MAX, BOX_Y_MAX) },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: false,
    })
    const points = new THREE.Points(geom, mat)
    points.position.set(-0.4, 0.07, 0)
    points.scale.set(0.9, 0.9, 0.9)
    scene.add(points)

    let dragging = false
    let lx = 0, ly = 0
    let rotY = 0, rotX = 0.18
    let targetRotY = 0, targetRotX = 0.18
    const onDown = (e: PointerEvent) => {
      dragging = true
      lx = e.clientX
      ly = e.clientY
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      targetRotY += (e.clientX - lx) * 0.005
      targetRotX += (e.clientY - ly) * 0.003
      targetRotX = Math.max(-0.6, Math.min(0.6, targetRotX))
      lx = e.clientX
      ly = e.clientY
    }
    const onUp = () => { dragging = false }
    renderer.domElement.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    const onResize = () => setSize()
    window.addEventListener('resize', onResize)

    let raf = 0
    const t0 = performance.now()
    const tick = () => {
      const t = (performance.now() - t0) / 1000
      if (!dragging) targetRotY += 0.0012
      rotY += (targetRotY - rotY) * 0.08
      rotX += (targetRotX - rotX) * 0.08
      points.rotation.y = rotY + Math.sin(t * 0.35) * 0.05
      points.rotation.x = rotX
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      video.removeEventListener('loadeddata', tryPlay)
      video.removeEventListener('loadeddata', onLoaded)
      video.removeEventListener('canplay', onLoaded)
      tex.dispose()
      geom.dispose()
      mat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
      video.pause()
      video.src = ''
    }
  }, [src, CUTOFF, DISPLACE, POINT_SIZE, BOX_X_MIN, BOX_X_MAX, BOX_Y_MIN, BOX_Y_MAX])

  return (
    <>
      <div
        ref={mountRef}
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
        aria-label="Interactive depth visualization. Drag to rotate."
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
          ready ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <BoxLoader />
      </div>
    </>
  )
}
