import fs from "fs";
import path from "path";
import OpenAI from "openai";

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable.");
  process.exit(1);
}

// Adjust these paths if your structure differs.
// Here we assume this script lives in /Users/anderschan/thepsychology-ai/thepsychology-ai-main/tools
// and the learning material and question output live one directory up:
//   /Users/anderschan/thepsychology-ai/eppp-reference
//   /Users/anderschan/thepsychology-ai/questionsGPT
const ROOT_DIR = path.resolve(process.cwd());
const CONTENT_DIR = path.resolve(ROOT_DIR, "..", "eppp-reference");
const OUTPUT_DIR = path.resolve(ROOT_DIR, "..", "questionsGPT");

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readTextFile(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

function listContentFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`Content directory not found: ${dirPath}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listContentFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function outputFilePathForContentFile(contentFilePath) {
  const relative = path.relative(CONTENT_DIR, contentFilePath);
  const parsed = path.parse(relative);
  const safeDir = parsed.dir;
  const safeName = `${parsed.name}.json`;
  return path.join(OUTPUT_DIR, safeDir, safeName);
}

async function generateQuestionsForContent(title, content) {
  const systemPrompt =
    "You are an expert EPPP exam tutor. Given reference material, you create high-quality, board-style multiple-choice questions and tag each question with the most relevant EPPP Knowledge Area (KN).";

  const userPrompt = `
You are given EPPP study content. Create multiple-choice questions that test key concepts at the level of the EPPP exam.

Content title: ${title}

Content:
"""
${content}
"""

EPPP Knowledge Areas (KNs):
1. Biological bases of behavior (10%)
  KN1. Functional correlates and determinants of the neurobiological and genetic bases of behavior pertaining to perception, cognition, personality, and mood and affect in normal, acute and chronic neurobehavioral disease processes and disease, comorbidities.
  KN2. Drug classification, mechanisms of action, and desired/adverse effects of therapeutic agents, drugs of abuse, and complementary or alternative agents.
  KN3. Results from major trials and general guidelines for pharmacological, psychotherapeutic, and combined treatment of psychological disorders.
  KN4. Behavioral genetics, transmission and expression of genetic information, and its modification, and the role and limitations of this information in understanding disorders.
  KN5. Applications of structural and functional brain imaging methods, electrophysiological methods, therapeutic drug monitoring methods, and genetic screening methodologies, and the evidence for their effectiveness.
2. Cognitive-affective bases of behavior (13%)
  KN6. Major research-based theories and models of intelligence and their application.
  KN7. Major research-based theories, models, and principles of learning and their application.
  KN8. Major research-based theories and models of memory and their application.
  KN9. Major research-based theories and models of motivation and their application.
  KN10. Major research-based theories and models of emotion and their application.
  KN11. Elements of cognition, including sensation and perception, attention, language, information processing, visual-spatial processing, executive functioning.
  KN12. Relations among cognitions/beliefs, behavior, affect, temperament, and mood.
  KN13. Influence of psychosocial factors on cognitions/beliefs and behaviors.
3. Social and cultural bases of behavior (11%)
  KN14. Major research-based theories and models of social cognition (e.g., person perception, development of stereotypes, prejudice).
  KN15. Social interaction and relationships (e.g., attraction, aggression, altruism, organizational justice, verbal and non-verbal communication, internet communication, mate selection, empathy).
  KN16. Group and systems processes (e.g., school, work, and family systems, job satisfaction, team functioning, conformity, persuasion) and social influences on functioning.
  KN17. Major research-based personality theories and models.
  KN18. Cultural and sociopolitical psychology (e.g., privilege, cross-cultural comparisons, political differences, international and global awareness, religiosity and spirituality, acculturation).
  KN19. Identity diversity and intersectionality (e.g., psychological impact of diversity on individuals, families, and systems).
  KN20. Causes, manifestations, and effects of oppression.
4. Growth and lifespan development (12%)
  KN21. Normal growth and development across the lifespan.
  KN22. Influence of individual-environment interaction on development over time (e.g., the relationship between the individual and the social, academic, work, community environment).
  KN23. Major research-based theories and models of development.
  KN24. Influence of diverse identities on development.
  KN25. Family development, configuration, and functioning and their impact on the individual across the lifespan.
  KN26. Life events that can influence the course of development across the lifespan.
  KN27. Risk and protective factors that may impact a developmental course (e.g., nutrition, prenatal care, health care, social support, socioeconomic status, abuse, victimization, and resiliency).
  KN28. Disorders and diseases that impact the expected course of development over the lifespan.
5. Assessment and diagnosis (16%)
  KN29. Psychometric theories, item and test characteristics, test construction and standardization procedures, reliability and validity, sensitivity and specificity, and test fairness and bias.
  KN30. Assessment theories and models (e.g., developmental, behavioral, ecological, neuropsychological).
  KN31. Assessment methods and their strengths and limitations (e.g., self-report, multi-informant reports, psychophysiological measures, work samples, assessment centers, direct observation, structured and semi-structured interviews).
  KN32. Commonly used instruments for the measurement of characteristics and behaviors of individuals and their appropriate use with various populations.
  KN33. Issues of differential diagnosis and integration of non-psychological information into psychological assessment.
  KN34. Instruments and methods appropriate for the assessment of groups and organizations (e.g., program evaluation, needs assessment, organizational and personnel assessment).
  KN35. Criteria for selection and adaptation of assessment methods (e.g., evidenced-based knowledge of assessment limitations, cultural appropriateness, trans-cultural adaptation, and language accommodations).
  KN36. Classification systems and their underlying rationales and limitations for evaluating client functioning; dimensional vs. categorical approaches to diagnosis.
  KN37. Factors influencing evidence-based interpretation of data and decision-making (e.g., base rates, group differences, cultural biases and differences, heuristics).
  KN38. Constructs of epidemiology and base rates of psychological and behavioral disorders.
  KN39. Major research-based theories and models of psychopathology.
  KN40. Measurement of outcomes and changes due to prevention or intervention efforts with individuals, couples, families, groups, and organizations.
  KN41. Use of technology in implementing tests, surveys, and other forms of assessment and diagnostic evaluation (e.g., validity, cost-effectiveness, consumer acceptability).
6. Treatment, intervention, prevention, and supervision (15%)
  KN42. Factors related to treatment or intervention decision-making (e.g., relevant research, matching treatment to assessment/diagnosis, matching client or patient with psychologist characteristics, knowledge and use of allied services, cost and benefit, readiness to change).
  KN43. Contemporary research-based theories and models of treatment, intervention, and prevention.
  KN44. Treatment techniques and interventions, and the evidence for their comparative efficacy and effectiveness.
  KN45. Methods and their evidence base for prevention, intervention, and rehabilitation with diverse and special populations.
  KN46. Interventions to enhance growth and performance of individuals, couples, families, groups, systems, and organizations.
  KN47. Research-based consultation models and processes.
  KN48. Research-based models of vocational and career development.
  KN49. Telepsychology and technology-assisted psychological services.
  KN50. Healthcare systems, structures, and economics, and how these impact intervention choice.
  KN51. Approaches to health promotion, risk reduction, resilience, and wellness.
  KN52. Contemporary theories and models of supervision and their evidence base.
7. Research methods and statistics (7%)
  KN53. Sampling and data collection methods.
  KN54. Design of case, correlational, quasi-experimental, and experimental studies.
  KN55. Analytic methods, including qualitative (e.g., thematic, phenomenological) and quantitative (e.g., probability theory; descriptive, inferential, and parametric statistics; meta-analysis; factor analysis; causal modeling).
  KN56. Statistical interpretation (e.g., power, effect size, causation vs. association, clinical vs. statistical significance).
  KN57. Critical appraisal and application of research findings (e.g., adequacy of design and statistics, limitations to generalizability, threats to internal and external validity, design flaws, level of evidence).
  KN58. Evaluation strategies and techniques (e.g., needs assessment, process and implementation evaluation, formative and summative program evaluation, outcome evaluation, cost-benefit analysis).
  KN59. Considerations regarding community involvement and participation in research.
  KN60. Dissemination and presentation of research findings.
8. Ethical, legal, and professional issues (16%)
  KN61. Current ethical principles and codes for psychologists (APA, CPA).
  KN62. Professional standards and relevant guidelines for the practice of psychology (e.g., standards for educational and psychological testing).
  KN63. Laws, statutes, and judicial decisions that affect psychological practice.
  KN64. Identification and management of potential ethical issues.
  KN65. Models of ethical decision-making.
  KN66. Approaches for continuing professional development.
  KN67. Emerging social, legal, ethical, and policy issues and their impact on psychological practice.
  KN68. Client and patient rights.
  KN69. Ethical issues in the conduct of research.
  KN70. Ethical issues in supervision.
  KN71. Ethical issues in technology-assisted psychological services.

Domain hint:
- The content folder and filename usually start with a number indicating the EPPP domain.
- For example, files in a folder starting with "1 " are typically Biological bases of behavior (KN1-KN5).
- Files in a folder starting with "2 " are typically Cognitive-affective bases of behavior (KN6-KN13), and so on.
- When assigning a KN, prefer KNs from the domain's range when appropriate.
- For each individual question, choose the KN based on the specific focus of that question (e.g., etiology, diagnosis, assessment, treatment, prognosis, comorbidity, theory) rather than assigning a single default KN for the entire topic.

Requirements for the output JSON:
- Return ONLY valid JSON. Do not include any explanation or extra text.
- The JSON must be an object with a single key "questions".
- "questions" must be an array of question objects.
- Each question object must have:
  - "stem": the question text (string)
  - "options": an array of 4-5 answer choices (strings)
  - "answer": the EXACT text of the correct option (string)
  - "explanation": a brief rationale for why the answer is correct (string)
  - "kn": the most relevant Knowledge Area ID, e.g., "KN7" (string)
  - "kn_explanation": 1–2 sentences explaining why this KN is the best match for this question (string)
  - "difficulty": one of "easy", "medium", or "hard" based on typical EPPP difficulty (string)
  - "quality_comment": 1–2 sentences evaluating the quality of the question (e.g., clarity, plausibility of distractors) (string)
- Make the answer options approximately similar in length and level of detail so that test-takers cannot guess based on option length alone.
- Vary the position of the correct answer across questions; do not systematically place it in the same option slot.
- Ensure the correct answer is not consistently the longest or most detailed option.

Example output format (truncated for brevity):
{
  "questions": [
    {
      "stem": "What is classical conditioning?",
      "options": [
        "Learning via association between stimuli",
        "Learning via consequences of behavior",
        "Sudden insight into a problem",
        "Memory of personal life events"
      ],
      "answer": "Learning via association between stimuli",
      "explanation": "Classical conditioning involves pairing a neutral stimulus with an unconditioned stimulus until the neutral stimulus elicits the response.",
      "kn": "KN7",
      "kn_explanation": "This question assesses understanding of a foundational principle of learning, which falls under major research-based theories, models, and principles of learning (KN7).",
      "difficulty": "medium",
      "quality_comment": "Question stem is clear and the distractors are plausible but distinguishable, making it appropriate for EPPP-level testing."
    }
  ]
}

Generate 8-15 questions that comprehensively cover the most important points in the content.
`;

  const completion = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const message = completion.choices?.[0]?.message?.content;
  if (!message || typeof message !== "string") {
    throw new Error("No content received from OpenAI chat completion for this file.");
  }

  let parsed;
  try {
    parsed = JSON.parse(message);
  } catch (err) {
    throw new Error("Failed to parse JSON from model output.");
  }

  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.questions)) {
    throw new Error("Model output JSON is not in the expected format (missing 'questions' array).");
  }

  return parsed;
}

async function processFile(contentFilePath) {
  const title = path.basename(contentFilePath);
  const outputPath = outputFilePathForContentFile(contentFilePath);

  ensureDirExists(path.dirname(outputPath));

  console.log(`\nProcessing: ${contentFilePath}`);
  console.log(`Output:      ${outputPath}`);

  const content = readTextFile(contentFilePath);

  try {
    const questionsJson = await generateQuestionsForContent(title, content);
    fs.writeFileSync(outputPath, JSON.stringify(questionsJson, null, 2), "utf-8");
    console.log("Status:     ✅ Saved questions JSON");
  } catch (error) {
    console.error("Status:     ❌ Failed to generate questions");
    console.error(error.message || error);
  }
}

async function main() {
  console.log("EPPP Question Generator");
  console.log("------------------------");
  console.log(`Content directory: ${CONTENT_DIR}`);
  console.log(`Output directory:  ${OUTPUT_DIR}`);

  ensureDirExists(OUTPUT_DIR);

  const files = listContentFiles(CONTENT_DIR).filter((filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    return ext === ".md" || ext === ".txt";
  });

  if (files.length === 0) {
    console.log("No .md or .txt files found in content directory.");
    return;
  }

  console.log(`Found ${files.length} content file(s).`);

  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    await processFile(file);
  }

  console.log("\nDone.");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
