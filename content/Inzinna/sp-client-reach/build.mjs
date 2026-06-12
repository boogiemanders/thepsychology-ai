import * as esbuild from 'esbuild'
import { cpSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isWatch = process.argv.includes('--watch')

const entryPoints = [
  'src/background/service-worker.ts',
  'src/app/app.ts',
]

// Copy static files to dist
function copyStatic() {
  cpSync(resolve(__dirname, 'manifest.json'), resolve(__dirname, 'dist/manifest.json'))
  cpSync(resolve(__dirname, 'src/app/app.html'), resolve(__dirname, 'dist/app/app.html'))
  cpSync(resolve(__dirname, 'src/app/app.css'), resolve(__dirname, 'dist/app/app.css'))
  if (existsSync(resolve(__dirname, 'src/assets'))) {
    cpSync(resolve(__dirname, 'src/assets'), resolve(__dirname, 'dist/assets'), { recursive: true })
  }
}

const buildOptions = {
  entryPoints,
  bundle: true,
  outdir: 'dist',
  format: 'iife',
  target: 'chrome120',
  sourcemap: true,
  logLevel: 'info',
  plugins: [{
    name: 'copy-static',
    setup(build) {
      build.onEnd((result) => {
        if (result.errors.length === 0) {
          copyStatic()
        }
      })
    },
  }],
}

if (isWatch) {
  const ctx = await esbuild.context(buildOptions)
  await ctx.watch()
  console.log('Watching for changes...')
} else {
  await esbuild.build(buildOptions)
  console.log('Build complete.')
}
