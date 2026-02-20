#!/usr/bin/env node
/**
 * Run MFA alignment on existing corpus directories and generate word timing JSON files.
 *
 * Usage: node scripts/run-mfa-alignment.mjs [--lesson=<lesson-dir>] [--limit=N]
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const MFA_BIN = '/usr/local/Caskroom/miniforge/base/envs/mfa/bin/mfa'
const MFA_ENV_BIN = '/usr/local/Caskroom/miniforge/base/envs/mfa/bin'
const MFA_WORK_DIR = '.mfa-work'

function parseArgs() {
  const args = { lesson: null, limit: Infinity }
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--lesson=')) args.lesson = arg.slice(9)
    else if (arg.startsWith('--limit=')) args.limit = parseInt(arg.slice(8), 10)
  }
  return args
}

function getLessonDirs(workDir, filter, limit) {
  const dirs = fs.readdirSync(workDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => {
      if (filter && !name.includes(filter)) return false
      // Check if corpus has WAV files
      const corpusDir = path.join(workDir, name, 'corpus')
      if (!fs.existsSync(corpusDir)) return false
      const wavCount = fs.readdirSync(corpusDir).filter(f => f.endsWith('.wav')).length
      if (wavCount === 0) return false
      // Check if it needs alignment (fewer timings than WAVs)
      const audioDir = path.join(workDir, name, 'audio')
      if (!fs.existsSync(audioDir)) return true
      const timingsCount = fs.readdirSync(audioDir).filter(f => f.endsWith('.words.json')).length
      return timingsCount < wavCount
    })
    .slice(0, limit)
  return dirs
}

function runMFAAlignment(corpusDir, alignedDir) {
  fs.mkdirSync(alignedDir, { recursive: true })

  const cmd = [
    MFA_BIN,
    'align',
    `"${corpusDir}"`,
    'english_mfa',
    'english_mfa',
    `"${alignedDir}"`,
    '--clean',
    '--single_speaker',
    '--num_jobs', '4'
  ].join(' ')

  console.log(`  Running: mfa align ...`)

  try {
    execSync(cmd, {
      stdio: 'inherit',
      shell: '/bin/bash',
      timeout: 600000,
      env: { ...process.env, PATH: `${MFA_ENV_BIN}:${process.env.PATH}` }
    })
    return true
  } catch (err) {
    console.error(`  MFA alignment failed: ${err.message}`)
    return false
  }
}

function parseTextGrid(textGridPath) {
  const content = fs.readFileSync(textGridPath, 'utf-8')
  const words = []
  let duration = 0

  const lines = content.split('\n')
  let currentTier = null
  let intervalXmin = null
  let intervalXmax = null

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.includes('name = "words"')) {
      currentTier = 'words'
      continue
    }
    if (trimmed.includes('name = "phones"')) {
      currentTier = 'phones'
      continue
    }
    if (trimmed.includes('class = "IntervalTier"')) {
      currentTier = null
      continue
    }

    const xminMatch = trimmed.match(/xmin\s*=\s*([\d.]+)/)
    if (xminMatch) {
      intervalXmin = parseFloat(xminMatch[1])
      continue
    }

    const xmaxMatch = trimmed.match(/xmax\s*=\s*([\d.]+)/)
    if (xmaxMatch) {
      intervalXmax = parseFloat(xmaxMatch[1])
      if (intervalXmax > duration) duration = intervalXmax
      continue
    }

    const textMatch = trimmed.match(/text\s*=\s*"([^"]*)"/)
    if (textMatch && intervalXmin !== null && intervalXmax !== null) {
      const text = textMatch[1].trim()
      if (text && text !== '' && text !== '<sil>' && text !== 'sp' && text !== 'spn') {
        if (currentTier === 'words') {
          words.push({ word: text, start: intervalXmin, end: intervalXmax })
        }
      }
      intervalXmin = null
      intervalXmax = null
    }
  }

  return { words, duration }
}

function processTextGrids(alignedDir, audioDir) {
  const textGridFiles = fs.readdirSync(alignedDir).filter(f => f.endsWith('.TextGrid'))
  let processed = 0

  for (const tgFile of textGridFiles) {
    const hash = tgFile.replace('.TextGrid', '')
    const tgPath = path.join(alignedDir, tgFile)
    const timingsPath = path.join(audioDir, `${hash}.words.json`)

    try {
      const alignment = parseTextGrid(tgPath)
      fs.writeFileSync(timingsPath, JSON.stringify(alignment, null, 2))
      processed++
    } catch (err) {
      console.error(`  Failed to parse ${tgFile}: ${err.message}`)
    }
  }

  return processed
}

async function main() {
  const args = parseArgs()
  const workDir = path.join(process.cwd(), MFA_WORK_DIR)

  if (!fs.existsSync(workDir)) {
    console.error(`Work directory not found: ${workDir}`)
    process.exit(1)
  }

  // Check MFA installation
  try {
    execSync(`${MFA_BIN} version`, { stdio: 'pipe' })
  } catch {
    console.error(`MFA not found at ${MFA_BIN}`)
    process.exit(1)
  }

  const lessons = getLessonDirs(workDir, args.lesson, args.limit)
  console.log(`Found ${lessons.length} lessons needing alignment`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i]
    console.log(`\n[${i + 1}/${lessons.length}] Processing: ${lesson}`)

    const lessonDir = path.join(workDir, lesson)
    const corpusDir = path.join(lessonDir, 'corpus')
    const alignedDir = path.join(lessonDir, 'aligned')
    const audioDir = path.join(lessonDir, 'audio')

    if (!fs.existsSync(corpusDir)) {
      console.log(`  Skipping: no corpus directory`)
      failCount++
      continue
    }

    // Run MFA alignment
    const alignOk = runMFAAlignment(corpusDir, alignedDir)
    if (!alignOk) {
      failCount++
      continue
    }

    // Parse TextGrids and create word timing files
    const timingsCreated = processTextGrids(alignedDir, audioDir)
    console.log(`  Created ${timingsCreated} word timing files`)

    successCount++
  }

  console.log('\n========================================')
  console.log(`Done! Successful: ${successCount}, Failed: ${failCount}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
