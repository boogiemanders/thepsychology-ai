import fs from "fs";
import path from "path";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable.");
  process.exit(1);
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const ROOT_DIR = path.resolve(process.cwd());
const REF_DIR = path.resolve(ROOT_DIR, "..", "eppp-reference");
const QUESTIONS_DIR = path.resolve(ROOT_DIR, "..", "questionsGPT");

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

function jsonFileToMarkdownPath(jsonPath) {
  const relative = path.relative(QUESTIONS_DIR, jsonPath);
  const parsed = path.parse(relative);
  const mdName = `${parsed.name}.md`;
  return path.join(REF_DIR, parsed.dir, mdName);
}

function detectDomainFromPath(jsonPath) {
  const relative = path.relative(QUESTIONS_DIR, jsonPath);
  const segments = relative.split(path.sep);
  // Look for a leading digit 1-8 at start of first segment
  const firstSegment = segments[0] || "";
  const match = firstSegment.match(/^([1-8])\b/);
  if (!match) return null;
  const domainNum = Number(match[1]);
  return domainNum >= 1 && domainNum <= 8 ? domainNum : null;
}

function domainLabel(domain) {
  switch (domain) {
    case 1:
      return "Biological bases of behavior (KN1–KN5)";
    case 2:
      return "Cognitive-affective bases of behavior (KN6–KN13)";
    case 3:
      return "Social and cultural bases of behavior (KN14–KN20)";
    case 4:
      return "Growth and lifespan development (KN21–KN28)";
    case 5:
      return "Assessment and diagnosis (KN29–KN41)";
    case 6:
      return "Treatment, intervention, prevention, and supervision (KN42–KN52)";
    case 7:
      return "Research methods and statistics (KN53–KN60)";
    case 8:
      return "Ethical, legal, and professional issues (KN61–KN71)";
    default:
      return "Unknown domain";
  }
}

async function enhanceFile(jsonPath) {
  const mdPath = jsonFileToMarkdownPath(jsonPath);
  if (!fs.existsSync(mdPath)) {
    console.warn(`Skipping ${jsonPath}: source markdown not found at ${mdPath}`);
    return;
  }

  const domain = detectDomainFromPath(jsonPath);
  const domainInfo = domain ? `Domain ${domain}: ${domainLabel(domain)}` : "Domain could not be confidently inferred.";

  let existing;
  try {
    const raw = fs.readFileSync(jsonPath, "utf-8");
    existing = JSON.parse(raw);
  } catch (err) {
    console.warn(`Skipping ${jsonPath}: failed to read/parse JSON (${err.message})`);
    return;
  }

  if (!existing || typeof existing !== "object" || !Array.isArray(existing.questions)) {
    console.warn(`Skipping ${jsonPath}: JSON missing "questions" array.`);
    return;
  }

  const sourceContent = fs.readFileSync(mdPath, "utf-8");
  const topicName = path.basename(mdPath);

  const systemPrompt =
    "You are an expert EPPP (Part 1 – Knowledge) exam item writer. You extend an existing topic-specific question bank by adding only high-quality, domain-appropriate multiple-choice questions.";

  const userPrompt = `
You will be given:
1) The EPPP study content for a single topic.
2) The current JSON question bank for that topic.

Your job:
- KEEP all existing questions exactly as they are (same order, same fields, no edits).
- ADD new questions ONLY when the topic content genuinely supports them.
- PRIORITIZE adding new questions that fill underrepresented Knowledge Areas (KNs) for THIS DOMAIN, but only if those KNs fit this topic’s content.
- RETURN a single updated JSON object in the same structure, with original questions plus new ones appended.

This topic's inferred domain (based on its folder/name) is:
${domainInfo}

EPPP domains (by KN range):
- Domain 1: KN1–KN5
- Domain 2: KN6–KN13
- Domain 3: KN14–KN20
- Domain 4: KN21–KN28
- Domain 5: KN29–KN41
- Domain 6: KN42–KN52
- Domain 7: KN53–KN60
- Domain 8: KN61–KN71

Missing/underrepresented KNs in my overall bank:
- KN24 – Diverse identities and development
- KN30 – Assessment theories and models
- KN37 – Evidence-based interpretation of data, base rates, biases, heuristics
- KN39 – Theories and models of psychopathology
- KN40 – Measuring outcomes/changes due to prevention or intervention
- KN41 – Technology in assessment/testing (e.g., tests, surveys, evaluation)
- KN51 – Health promotion, risk reduction, resilience, wellness
- KN52 – Supervision theories and models
- KN60 – Dissemination and presentation of research findings
- KN64 – Identifying and managing potential ethical issues
- KN66 – Continuing professional development
- KN67 – Emerging social, legal, ethical, and policy issues and their impact on practice

VERY IMPORTANT domain rules:
- NEW questions must use KNs that belong to THIS TOPIC'S DOMAIN ONLY.
- From those domain-appropriate KNs, you may prefer the missing/underrepresented ones above, but only when the topic's content clearly supports them.
- If no missing KN from this topic's domain fits the content, you may:
  - Add a small number of questions using already-covered KNs in this domain, OR
  - Add no new questions at all (if forced KNs would be weak or off-topic).
- Never force a KN just to “check a box” if the topic does not support it conceptually.

Question format requirements (for ALL questions, old and new):
- The JSON must be an object: { "questions": [ ... ] }.
- Do NOT remove, reorder, or change any existing questions.
- Append new questions at the END of the "questions" array.
- Each question object must have:
  - "stem": string – the question text
  - "options": array of 4–5 strings – answer choices
  - "answer": string – EXACTLY one of the options
  - "explanation": string – brief rationale for why the answer is correct
  - "kn": string – e.g., "KN24"
  - "kn_explanation": string – 1–2 sentences explaining why this KN is the best match
  - "difficulty": string – "easy", "medium", or "hard" at typical EPPP level
  - "quality_comment": string – 1–2 sentences evaluating item quality
- Make answer options similar in length and detail so test-takers cannot guess based on length.
- Vary the position of the correct answer across questions; do not always put it in the same slot.
- Ensure the correct answer is not consistently the longest or most detailed option.
- New questions must be meaningfully distinct from existing ones.

How many new questions to add:
- Aim for 2–4 high-quality new questions ONLY if the topic provides enough relevant content.
- Focus on KNs that are missing in this domain and well-supported by the text; otherwise, it is acceptable to add fewer (or none) rather than forcing weak items.

Output rules:
- Return ONLY valid JSON, no extra commentary.
- Preserve all existing questions exactly; just append new ones at the end.

---------------------------
TOPIC NAME:
${topicName}

SOURCE CONTENT (markdown from eppp-reference):
"""
${sourceContent}
"""

CURRENT JSON (from questionsGPT):
${JSON.stringify(existing)}
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("No content returned from OpenAI for this file.");
  }

  let updated;
  try {
    updated = JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to parse JSON from model output: ${err.message}`);
  }

  if (!updated || typeof updated !== "object" || !Array.isArray(updated.questions)) {
    throw new Error('Model output JSON is not in the expected format (missing "questions" array).');
  }

  // Sanity: ensure we did not lose questions
  if (updated.questions.length < existing.questions.length) {
    throw new Error(
      `Model appears to have removed questions (existing ${existing.questions.length}, updated ${updated.questions.length}).`,
    );
  }

  fs.writeFileSync(jsonPath, JSON.stringify(updated, null, 2), "utf-8");
}

async function main() {
  console.log("EPPP Question Bank Enhancer (KN-aware)");
  console.log("--------------------------------------");
  console.log(`Reference directory: ${REF_DIR}`);
  console.log(`Questions directory: ${QUESTIONS_DIR}`);

  ensureDirExists(QUESTIONS_DIR);

  const files = listJsonFiles(QUESTIONS_DIR);
  console.log(`Found ${files.length} JSON file(s) in questionsGPT.\n`);

  for (const file of files) {
    console.log(`Enhancing: ${file}`);
    try {
      // eslint-disable-next-line no-await-in-loop
      await enhanceFile(file);
      console.log("Status:   ✅ Updated");
    } catch (err) {
      console.error("Status:   ❌ Failed");
      console.error(`Reason:   ${err.message || err}`);
    }
    console.log("");
  }

  console.log("Done.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Fatal error:", err.message || err);
    process.exit(1);
  });
}

