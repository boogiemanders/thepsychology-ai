import fs from "fs";
import path from "path";

const EXAM_SIZE = 57;

const DOMAIN_TARGETS = {
  1: 6,
  2: 7,
  3: 6,
  4: 7,
  5: 9,
  6: 9,
  7: 4,
  8: 9,
};

const ORG_PSYCH_TARGET = 12;
const ORG_PSYCH_DOMAINS = [2, 3, 5, 6];

const ROOT_DIR = path.resolve(process.cwd());
const FREE_QUESTIONS_DIR = path.resolve(ROOT_DIR, "..", "free-questionsGPT");
const FREE_EXAMS_DIR = path.resolve(ROOT_DIR, "..", "free-examsGPT");
const ORG_PSYCH_PATH_FRAGMENT = path.join(
  "2 3 5 6 Organizational Psychology",
  "2 3 Satisfaction, Commitment, and Stress.json",
);

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
  const files = listJsonFiles(FREE_QUESTIONS_DIR);
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
      const baseDomain = knToDomain(q.kn);
      const isOrgPsych = file.includes(ORG_PSYCH_PATH_FRAGMENT);
      allQuestions.push({
        ...q,
        sourceFile: file,
        baseDomain,
        isOrgPsych,
        index,
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

function chooseOrgPsychQuestions(allQuestions) {
  const orgQuestions = allQuestions.filter((q) => q.isOrgPsych);
  if (orgQuestions.length < ORG_PSYCH_TARGET) {
    throw new Error(
      `Not enough Organizational Psychology questions. Needed ${ORG_PSYCH_TARGET}, found ${orgQuestions.length}.`,
    );
  }

  shuffleInPlace(orgQuestions);
  const selected = orgQuestions.slice(0, ORG_PSYCH_TARGET);

  const assignedByDomain = {};
  ORG_PSYCH_DOMAINS.forEach((d) => {
    assignedByDomain[d] = 0;
  });

  const perDomainTarget = Math.floor(ORG_PSYCH_TARGET / ORG_PSYCH_DOMAINS.length); // 3 each

  selected.forEach((q, idx) => {
    let targetDomain = null;

    // First pass: try to respect KN-based domain if it is one of the org psych domains
    if (q.baseDomain && ORG_PSYCH_DOMAINS.includes(q.baseDomain)) {
      if (assignedByDomain[q.baseDomain] < perDomainTarget) {
        targetDomain = q.baseDomain;
      }
    }

    // Otherwise or if that bucket is full, assign round-robin by smallest current count
    if (!targetDomain) {
      let bestDomain = ORG_PSYCH_DOMAINS[0];
      let bestCount = assignedByDomain[bestDomain];
      for (const d of ORG_PSYCH_DOMAINS) {
        if (assignedByDomain[d] < bestCount) {
          bestDomain = d;
          bestCount = assignedByDomain[d];
        }
      }
      targetDomain = bestDomain;
    }

    assignedByDomain[targetDomain] += 1;
    q.domain = targetDomain;
  });

  return { selectedOrgPsych: selected, orgAssignments: assignedByDomain };
}

function chooseNonOrgQuestions(allQuestions, selectedOrgPsych, orgAssignments) {
  const used = new Set(selectedOrgPsych.map((q) => `${q.sourceFile}::${q.index}`));
  const domainPools = {};

  allQuestions.forEach((q) => {
    if (q.isOrgPsych) return;
    const id = `${q.sourceFile}::${q.index}`;
    if (used.has(id)) return;
    const d = q.baseDomain;
    if (!d || !DOMAIN_TARGETS[d]) return;
    if (!domainPools[d]) domainPools[d] = [];
    domainPools[d].push(q);
  });

  Object.values(domainPools).forEach((pool) => shuffleInPlace(pool));

  const selected = [];

  for (const [domainStr, target] of Object.entries(DOMAIN_TARGETS)) {
    const domain = Number(domainStr);
    const alreadyFromOrg = orgAssignments[domain] || 0;
    const needed = target - alreadyFromOrg;
    if (needed <= 0) continue;

    const pool = domainPools[domain] || [];
    if (pool.length < needed) {
      throw new Error(
        `Not enough questions for domain ${domain}. Needed ${needed}, available ${pool.length}.`,
      );
    }

    selected.push(...pool.slice(0, needed));
  }

  return selected;
}

function buildExam(allQuestions) {
  const { selectedOrgPsych, orgAssignments } = chooseOrgPsychQuestions(allQuestions);
  const nonOrgSelected = chooseNonOrgQuestions(allQuestions, selectedOrgPsych, orgAssignments);

  const allSelected = [...selectedOrgPsych, ...nonOrgSelected];
  if (allSelected.length !== EXAM_SIZE) {
    throw new Error(
      `Built exam has ${allSelected.length} questions, expected ${EXAM_SIZE}.`,
    );
  }

  shuffleInPlace(allSelected);

  const questions = allSelected.map((q) => {
    const { baseDomain, isOrgPsych, index, ...rest } = q;
    return {
      ...rest,
      domain: q.domain ?? baseDomain,
      isOrgPsych,
    };
  });

  return questions;
}

function summarizeDomainCounts(questions) {
  const counts = {};
  for (const q of questions) {
    const d = q.domain || "unknown";
    counts[d] = (counts[d] || 0) + 1;
  }
  return counts;
}

function countOrgPsych(questions) {
  return questions.reduce((acc, q) => acc + (q.isOrgPsych ? 1 : 0), 0);
}

function saveExam(examId, questions) {
  ensureDirExists(FREE_EXAMS_DIR);

  const domainCounts = summarizeDomainCounts(questions);
  const orgPsychCount = countOrgPsych(questions);

  const exam = {
    meta: {
      examId,
      totalQuestions: questions.length,
      domainCounts,
      orgPsychCount,
      orgPsychPercentage: Math.round((orgPsychCount / questions.length) * 100),
      generatedAt: new Date().toISOString(),
    },
    questions,
  };

  const filename = `diagnostic-exam-${examId}.json`;
  const fullPath = path.join(FREE_EXAMS_DIR, filename);
  fs.writeFileSync(fullPath, JSON.stringify(exam, null, 2), "utf-8");
  console.log(`Saved free diagnostic exam ${examId} to ${fullPath}`);
}

function main() {
  console.log("Free EPPP Diagnostic Exam Generator");
  console.log("-----------------------------------");
  console.log(`Free questions directory: ${FREE_QUESTIONS_DIR}`);
  console.log(`Free exams directory:     ${FREE_EXAMS_DIR}`);

  const allQuestions = loadAllQuestions();
  console.log(`Total free questions available: ${allQuestions.length}`);

  const questions = buildExam(allQuestions);
  saveExam(1, questions);

  console.log("Done.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (err) {
    console.error("Fatal error:", err.message || err);
    process.exit(1);
  }
}

