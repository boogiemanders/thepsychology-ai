#!/usr/bin/env node

/**
 * build-mobile-content-manifest.mjs
 *
 * Generates a mobile content manifest (public/mobile-content-manifest.json)
 * by scanning lesson markdown, question JSON, exam files, and audio manifests.
 *
 * Usage: node scripts/build-mobile-content-manifest.mjs
 *
 * No external dependencies — uses only Node.js built-ins.
 */

import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, basename, extname, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = resolve(import.meta.dirname, '..');
const CONTENT_DIR = join(ROOT, 'topic-content-v4');
const QUESTIONS_DIR = join(ROOT, 'questionsGPT');
const EXAMS_PRACTICE_DIR = join(ROOT, 'exams', 'practice');
const EXAMS_DIAGNOSTIC_DIR = join(ROOT, 'exams', 'diagnostic');
const EXAMS_EXPLANATIONS_DIR = join(ROOT, 'exams', 'explanations');
const AUDIO_DIR = join(ROOT, 'public', 'topic-teacher-audio');
const OUTPUT_PATH = join(ROOT, 'public', 'mobile-content-manifest.json');

// ---------------------------------------------------------------------------
// Domain mappings — mirrors src/lib/eppp-data.ts EPPP_DOMAINS
// ---------------------------------------------------------------------------
const DOMAIN_MAP = {
  '1 Biopsychology (Neuroscience & Pharmacology)': { id: '1', name: 'Biopsychology' },
  '2 Learning and Memory': { id: '2', name: 'Learning and Memory' },
  '3 Social Psychology': { id: '3-social', name: 'Social Psychology' },
  '3 Cultural Considerations': { id: '3-cultural', name: 'Cultural Considerations' },
  '4 Development': { id: '4', name: 'Development' },
  '5 Assessment': { id: '5-assessment', name: 'Assessment' },
  '5 Diagnosis': { id: '5-diagnosis', name: 'Diagnosis' },
  '5 Test Construction': { id: '5-test', name: 'Test Construction' },
  '6 Clinical Interventions': { id: '6', name: 'Clinical Interventions' },
  '7 Research and Stats': { id: '7', name: 'Research and Stats' },
  '8 Ethics': { id: '8', name: 'Ethics' },
  '2 3 5 6 I-O Psychology': { id: '3-5-6', name: 'I-O Psychology' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function slugFromFilename(filename) {
  return basename(filename, extname(filename));
}

/** Extract the first markdown heading (# or ##) from content */
function extractTitle(mdContent) {
  const match = mdContent.match(/^#{1,2}\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/** Extract YAML front-matter field */
function extractFrontmatter(content, field) {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;
  const re = new RegExp(`^${field}:\\s*(.+)$`, 'm');
  const m = fmMatch[1].match(re);
  return m ? m[1].trim() : null;
}

/** Recursively list files in a directory matching an extension */
async function listFiles(dir, ext) {
  const results = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await listFiles(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

/** Determine domain info from a directory name */
function domainFromDir(dirName) {
  return DOMAIN_MAP[dirName] || { id: 'unknown', name: dirName };
}

/** Parse the domain number (first digit cluster) from a domain id string */
function domainNumber(domainId) {
  const m = domainId.match(/^(\d+)/);
  return m ? m[1] : domainId;
}

// ---------------------------------------------------------------------------
// Scanners
// ---------------------------------------------------------------------------

async function scanLessons() {
  const lessons = [];
  let entries;
  try {
    entries = await readdir(CONTENT_DIR, { withFileTypes: true });
  } catch (err) {
    console.warn(`Warning: cannot read ${CONTENT_DIR}: ${err.message}`);
    return lessons;
  }

  for (const dirEntry of entries) {
    if (!dirEntry.isDirectory()) continue;
    const domainDir = dirEntry.name;
    const domain = domainFromDir(domainDir);
    const mdFiles = await listFiles(join(CONTENT_DIR, domainDir), '.md');

    for (const filepath of mdFiles) {
      const buf = await readFile(filepath);
      const content = buf.toString('utf-8');
      const slug = slugFromFilename(filepath);
      const title =
        extractFrontmatter(content, 'topic_name') ||
        extractTitle(content) ||
        slug;
      const hash = sha256(buf);

      lessons.push({
        id: slug,
        type: 'lesson',
        domain_id: domain.id,
        domain_name: domain.name,
        domain_number: domainNumber(domain.id),
        version: hash.slice(0, 12),
        checksum: hash,
        size_bytes: buf.length,
        title,
        dependencies: [],
        download_url: `/api/mobile/content/lessons/${slug}`,
        _source: relative(ROOT, filepath),
      });
    }
  }

  return lessons;
}

async function scanQuizzes() {
  const quizzes = [];
  let entries;
  try {
    entries = await readdir(QUESTIONS_DIR, { withFileTypes: true });
  } catch (err) {
    console.warn(`Warning: cannot read ${QUESTIONS_DIR}: ${err.message}`);
    return quizzes;
  }

  for (const dirEntry of entries) {
    if (!dirEntry.isDirectory()) continue;
    const domainDir = dirEntry.name;
    const domain = domainFromDir(domainDir);
    const jsonFiles = await listFiles(join(QUESTIONS_DIR, domainDir), '.json');

    for (const filepath of jsonFiles) {
      const buf = await readFile(filepath);
      const content = buf.toString('utf-8');
      const slug = slugFromFilename(filepath)
        .toLowerCase()
        .replace(/[,\s]+/g, '-')
        .replace(/-+/g, '-');
      const hash = sha256(buf);

      // Try to get question count
      let questionCount = 0;
      let title = basename(filepath, '.json');
      try {
        const parsed = JSON.parse(content);
        if (parsed.questions) questionCount = parsed.questions.length;
      } catch { /* ignore parse errors */ }

      // Derive the corresponding lesson slug for dependency
      const lessonSlug = slug;

      quizzes.push({
        id: slug,
        type: 'quiz',
        domain_id: domain.id,
        domain_name: domain.name,
        domain_number: domainNumber(domain.id),
        version: hash.slice(0, 12),
        checksum: hash,
        size_bytes: buf.length,
        title,
        question_count: questionCount,
        dependencies: [lessonSlug],
        download_url: `/api/mobile/content/quizzes/${slug}`,
        _source: relative(ROOT, filepath),
      });
    }
  }

  return quizzes;
}

async function scanExams() {
  const exams = [];

  const scanDir = async (dir, examType) => {
    const mdFiles = await listFiles(dir, '.md');
    for (const filepath of mdFiles) {
      const fname = basename(filepath);
      // Skip README or backup files
      if (fname === 'README.md' || fname.includes('.backup')) continue;

      const buf = await readFile(filepath);
      const content = buf.toString('utf-8');
      const slug = slugFromFilename(filepath);
      const hash = sha256(buf);

      const examId = extractFrontmatter(content, 'exam_id') || slug;
      const questionCount = parseInt(extractFrontmatter(content, 'question_count') || '0', 10);
      const title = `${examType === 'practice' ? 'Practice' : 'Diagnostic'} Exam: ${examId}`;

      // Check for corresponding explanation file
      const dependencies = [];
      const explanationPaths = [
        join(EXAMS_EXPLANATIONS_DIR, `${slug}-explanations.json`),
        join(dir, `${slug}-explanations.json`),
      ];
      for (const expPath of explanationPaths) {
        try {
          await stat(expPath);
          dependencies.push(`${slug}-explanations`);
          break;
        } catch { /* not found */ }
      }

      exams.push({
        id: slug,
        type: 'exam',
        exam_type: examType,
        domain_id: 'all',
        domain_name: 'All Domains',
        domain_number: 'all',
        version: hash.slice(0, 12),
        checksum: hash,
        size_bytes: buf.length,
        title,
        question_count: questionCount,
        dependencies,
        download_url: `/api/mobile/content/exams/${slug}`,
        _source: relative(ROOT, filepath),
      });
    }
  };

  await scanDir(EXAMS_PRACTICE_DIR, 'practice');
  await scanDir(EXAMS_DIAGNOSTIC_DIR, 'diagnostic');

  return exams;
}

async function scanAudio() {
  const audioItems = [];
  const manifestFiles = await listFiles(AUDIO_DIR, '.manifest.json');

  for (const filepath of manifestFiles) {
    const buf = await readFile(filepath);
    const content = buf.toString('utf-8');
    const hash = sha256(buf);
    const slug = basename(filepath, '.manifest.json');

    let title = slug;
    let lessonId = slug;
    let sectionCount = 0;
    try {
      const parsed = JSON.parse(content);
      lessonId = parsed.lessonId || slug;
      title = `Audio: ${lessonId}`;
      if (parsed.sections) sectionCount = parsed.sections.length;
    } catch { /* ignore */ }

    // Derive the lesson slug this audio belongs to
    const lessonSlug = lessonId.includes('/')
      ? lessonId.split('/').pop()
      : lessonId;

    // Count associated mp3 files in the same directory
    const dir = join(filepath, '..');
    const mp3Files = await listFiles(dir, '.mp3');
    const totalAudioBytes = await mp3Files.reduce(async (accP, f) => {
      const acc = await accP;
      const s = await stat(f);
      return acc + s.size;
    }, Promise.resolve(0));

    audioItems.push({
      id: slug,
      type: 'audio',
      domain_id: domainNumber(lessonSlug.split('-')[0]) || 'unknown',
      domain_name: '',
      domain_number: lessonSlug.split('-')[0] || 'unknown',
      version: hash.slice(0, 12),
      checksum: hash,
      size_bytes: buf.length,
      total_audio_bytes: totalAudioBytes,
      title,
      section_count: sectionCount,
      dependencies: [lessonSlug],
      download_url: `/api/mobile/content/audio/${slug}`,
      _source: relative(ROOT, filepath),
    });
  }

  return audioItems;
}

// ---------------------------------------------------------------------------
// Domain summary builder
// ---------------------------------------------------------------------------

function buildDomainSummary(lessons, quizzes) {
  const domains = {};

  for (const lesson of lessons) {
    const key = lesson.domain_id;
    if (!domains[key]) {
      domains[key] = { name: lesson.domain_name, lesson_count: 0, question_count: 0 };
    }
    domains[key].lesson_count++;
  }

  for (const quiz of quizzes) {
    const key = quiz.domain_id;
    if (!domains[key]) {
      domains[key] = { name: quiz.domain_name, lesson_count: 0, question_count: 0 };
    }
    domains[key].question_count += quiz.question_count || 0;
  }

  return domains;
}

// ---------------------------------------------------------------------------
// Playlist templates
// ---------------------------------------------------------------------------

function buildPlaylists(domains) {
  return {
    all_domains: {
      id: 'all-domains',
      name: 'Complete EPPP Review',
      description: 'All lessons across every domain',
      domain_ids: Object.keys(domains),
    },
    weak_area_template: {
      id: 'weak-area-template',
      name: 'Weak Areas Focus',
      description: 'Template playlist — populated at runtime from diagnostic results',
      domain_ids: [],
      dynamic: true,
    },
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Scanning lessons...');
  const lessons = await scanLessons();
  console.log(`  Found ${lessons.length} lessons`);

  console.log('Scanning quizzes...');
  const quizzes = await scanQuizzes();
  console.log(`  Found ${quizzes.length} quizzes`);

  console.log('Scanning exams...');
  const exams = await scanExams();
  console.log(`  Found ${exams.length} exams`);

  console.log('Scanning audio manifests...');
  const audio = await scanAudio();
  console.log(`  Found ${audio.length} audio manifests`);

  // Wire up lesson -> audio dependencies
  for (const a of audio) {
    for (const dep of a.dependencies) {
      const lesson = lessons.find(l => l.id === dep);
      if (lesson) {
        lesson.dependencies.push(a.id);
      }
    }
  }

  const domains = buildDomainSummary(lessons, quizzes);
  const totalSizeBytes =
    lessons.reduce((s, l) => s + l.size_bytes, 0) +
    quizzes.reduce((s, q) => s + q.size_bytes, 0) +
    exams.reduce((s, e) => s + e.size_bytes, 0) +
    audio.reduce((s, a) => s + a.size_bytes + (a.total_audio_bytes || 0), 0);

  const manifest = {
    manifest_version: '1.0.0',
    generated_at: new Date().toISOString(),
    bundles: {
      lessons,
      exams,
      quizzes,
      audio,
    },
    playlists: buildPlaylists(domains),
    domains,
    total_size_bytes: totalSizeBytes,
  };

  // Ensure output directory exists
  await mkdir(join(ROOT, 'public'), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\nManifest written to ${relative(ROOT, OUTPUT_PATH)}`);
  console.log(`  Lessons:   ${lessons.length}`);
  console.log(`  Quizzes:   ${quizzes.length}`);
  console.log(`  Exams:     ${exams.length}`);
  console.log(`  Audio:     ${audio.length}`);
  console.log(`  Domains:   ${Object.keys(domains).length}`);
  console.log(`  Total size: ${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
