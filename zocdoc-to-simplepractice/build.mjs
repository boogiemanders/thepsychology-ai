import * as esbuild from 'esbuild'
import { cpSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isWatch = process.argv.includes('--watch')

const entryPoints = [
  'src/content/zocdoc.ts',
  'src/content/simplepractice.ts',
  'src/background/service-worker.ts',
  'src/popup/popup.ts',
]

const buildOptions = {
  entryPoints,
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  target: 'chrome120',
  sourcemap: true,
  logLevel: 'info',
}

// Copy static files to dist
function copyStatic() {
  cpSync(resolve(__dirname, 'manifest.json'), resolve(__dirname, 'dist/manifest.json'))
  cpSync(resolve(__dirname, 'src/popup/popup.html'), resolve(__dirname, 'dist/popup/popup.html'))
  cpSync(resolve(__dirname, 'src/popup/popup.css'), resolve(__dirname, 'dist/popup/popup.css'))
  cpSync(resolve(__dirname, 'src/content/content.css'), resolve(__dirname, 'dist/content/content.css'))
  if (existsSync(resolve(__dirname, 'src/assets'))) {
    cpSync(resolve(__dirname, 'src/assets'), resolve(__dirname, 'dist/assets'), { recursive: true })
  }
}

if (isWatch) {
  const ctx = await esbuild.context(buildOptions)
  await ctx.watch()
  copyStatic()
  console.log('Watching for changes...')
} else {
  await esbuild.build(buildOptions)
  copyStatic()
  console.log('Build complete.')
}
