import fs from "fs";
import path from "path";

const DIAGNOSTIC_SIZE = 83; // One question per JSON file (given 83 files)

const ROOT_DIR = path.resolve(process.cwd());
const QUESTIONS_DIR = path.resolve(ROOT_DIR, "..", "questionsGPT");
const DIAGNOSTIC_DIR = path.resolve(ROOT_DIR, "..", "diagnosticGPT");

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function listJsonFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Questions directory not found: ${dirPath}`);
  }

  const files = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listJsonFiles(fullPath));
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".json") {
      files.push(fullPath);
    }
  }

  return files;
}

function knToDomain(kn) {
  if (!kn || typeof kn !== "string") return null;
  const match = kn.match(/KN(\d{1,2})/i);
  if (!match) return null;
  const n = Number(match[1]);
  if (n >= 1 && n <= 5) return 1;
  if (n >= 6 && n <= 13) return 2;
  if (n >= 14 && n <= 20) return 3;
  if (n >= 21 && n <= 28) return 4;
  if (n >= 29 && n <= 41) return 5;
  if (n >= 42 && n <= 52) return 6;
  if (n >= 53 && n <= 60) return 7;
  if (n >= 61 && n <= 71) return 8;
  return null;
}

function loadAllQuestions() {
  const files = listJsonFiles(QUESTIONS_DIR);
  const allQuestions = [];

  for (const file of files) {
    let parsed;
    try {
      const raw = fs.readFileSync(file, "utf-8");
      parsed = JSON.parse(raw);
    } catch (err) {
      console.warn(`Warning: Failed to read/parse ${file}: ${err.message}`);
      continue;
    }

    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.questions)) {
      console.warn(`Warning: File ${file} does not contain a "questions" array; skipping.`);
      continue;
    }

    parsed.questions.forEach((q, index) => {
      const domain = knToDomain(q.kn);
      if (!domain) return;
      allQuestions.push({
        ...q,
        sourceFile: file,
        domain,
        id: `${file}::${index}`,
      });
    });
  }

  return allQuestions;
}

function shuffleInPlace(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function buildDiagnosticExam(allQuestions, examSize) {
  const selected = [];
  const usedIds = new Set();
  const seenKNs = new Set();

  const questionsByFile = {};
  for (const q of allQuestions) {
    if (!questionsByFile[q.sourceFile]) {
      questionsByFile[q.sourceFile] = [];
    }
    questionsByFile[q.sourceFile].push(q);
  }

  const files = Object.keys(questionsByFile);

  if (files.length > examSize) {
    throw new Error(
      `Diagnostic exam size (${examSize}) is smaller than number of JSON files (${files.length}).`,
    );
  }

  // One question from each JSON file, preferring questions that introduce new KNs
  for (const file of files) {
    const pool = questionsByFile[file].filter((q) => !usedIds.has(q.id));
    if (pool.length === 0) continue;

    const unseenKNPool = pool.filter((q) => q.kn && !seenKNs.has(q.kn));
    const choicePool = unseenKNPool.length > 0 ? unseenKNPool : pool;
    const choice = choicePool[Math.floor(Math.random() * choicePool.length)];
    selected.push(choice);
    usedIds.add(choice.id);
    if (choice.kn) {
      seenKNs.add(choice.kn);
    }
  }

  // If we somehow have remaining slots, fill with random remaining questions
  if (selected.length < examSize) {
    const remaining = allQuestions.filter((q) => !usedIds.has(q.id));
    shuffleInPlace(remaining);
    const extraNeeded = examSize - selected.length;
    selected.push(...remaining.slice(0, extraNeeded));
  }

  shuffleInPlace(selected);
  return selected;
}

function summarizeDomainCounts(questions) {
  const counts = {};
  for (const q of questions) {
    const d = q.domain ?? knToDomain(q.kn) ?? "unknown";
    counts[d] = (counts[d] || 0) + 1;
  }
  return counts;
}

function saveDiagnosticExam(examId, questions) {
  ensureDirExists(DIAGNOSTIC_DIR);

  const domainCounts = summarizeDomainCounts(questions);
  const exam = {
    meta: {
      examId,
      totalQuestions: questions.length,
      domainCounts,
      generatedAt: new Date().toISOString(),
    },
    questions,
  };

  const filename = `diagnostic-exam-${examId}.json`;
  const fullPath = path.join(DIAGNOSTIC_DIR, filename);
  fs.writeFileSync(fullPath, JSON.stringify(exam, null, 2), "utf-8");
  console.log(`Saved diagnostic exam ${examId} to ${fullPath}`);
}

function main() {
  console.log("EPPP Diagnostic Exam Generator");
  console.log("------------------------------");
  console.log(`Questions directory:   ${QUESTIONS_DIR}`);
  console.log(`Diagnostic directory:  ${DIAGNOSTIC_DIR}`);

  const allQuestions = loadAllQuestions();
  console.log(`Total questions available: ${allQuestions.length}`);

  const examQuestions = buildDiagnosticExam(allQuestions, DIAGNOSTIC_SIZE);
  saveDiagnosticExam(1, examQuestions);

  console.log("\nDone.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (err) {
    console.error("Fatal error:", err.message || err);
    process.exit(1);
  }
}
