import fs from 'fs'
import path from 'path'

const CONTENT_DIR_DEFAULT = path.resolve('EPPP/content/topic-content-v4')

const lessonTextCache = new Map()

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function ngrams(s, n) {
  const w = normalize(s).split(' ').filter(Boolean)
  const out = []
  for (let i = 0; i + n <= w.length; i++) out.push(w.slice(i, i + n).join(' '))
  return out
}

function findLessonFile(slug, contentDir) {
  if (!slug) return null
  if (lessonTextCache.has(slug)) return lessonTextCache.get(slug)
  let found = null
  function walk(dir) {
    if (found) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (found) return
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && entry.name === `${slug}.md`) found = full
    }
  }
  try {
    walk(contentDir)
  } catch {
    return null
  }
  if (!found) {
    lessonTextCache.set(slug, null)
    return null
  }
  const text = normalize(fs.readFileSync(found, 'utf8'))
  lessonTextCache.set(slug, { path: found, normText: text })
  return lessonTextCache.get(slug)
}

export function validateQuestion(question, opts = {}) {
  const contentDir = opts.contentDir || CONTENT_DIR_DEFAULT
  const errors = []

  const stem = String(question?.stem ?? question?.question ?? '').trim()
  const options = Array.isArray(question?.options) ? question.options : []
  const answer = String(question?.answer ?? question?.correct_answer ?? '').trim()
  const excerpt = String(question?.lessonExcerpt ?? '').trim()
  const slug = String(question?.suggestedLesson ?? '').trim()

  if (!stem) errors.push('empty_stem')
  if (options.length < 4) errors.push('fewer_than_4_options')
  if (!answer) errors.push('empty_answer')
  else if (!options.includes(answer)) errors.push('answer_not_in_options')

  if (!excerpt) errors.push('empty_excerpt')
  else if (excerpt === answer) errors.push('excerpt_equals_answer')

  if (!slug) errors.push('missing_suggested_lesson')
  else {
    const lesson = findLessonFile(slug, contentDir)
    if (!lesson) errors.push('lesson_file_not_found')
    else if (excerpt) {
      const grams = ngrams(excerpt, 4)
      if (grams.length === 0) errors.push('excerpt_too_short')
      else {
        let hits = 0
        for (const g of grams) if (lesson.normText.includes(g)) hits++
        const ratio = hits / grams.length
        if (ratio < 0.3) errors.push(`excerpt_not_in_lesson(ratio=${ratio.toFixed(2)})`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export function annotateValidationFailure(question, errors) {
  const annotated = { ...question }
  annotated.needsReview = true
  const flag = `[VALIDATION_FAILED: ${errors.join(', ')}]`
  if (typeof annotated.quality_comment === 'string' && annotated.quality_comment.trim()) {
    if (!annotated.quality_comment.includes('VALIDATION_FAILED')) {
      annotated.quality_comment = `${flag} ${annotated.quality_comment}`
    }
  } else {
    annotated.quality_comment = flag
  }
  return annotated
}
