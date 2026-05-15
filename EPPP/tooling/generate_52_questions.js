#!/usr/bin/env node
/**
 * Generate 20 questions for each of 52 source files
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SOURCE_ROOT = '/Users/anderschan/thepsychology-ai/eppp-reference';
const OUTPUT_ROOT = '/Users/anderschan/thepsychology-ai/questions';

// Define all 52 files
const PRIORITY_FILES = [
  // ASSESSMENT FILES (10 files)
  {
    source: '5 Assessment/5 Stanford-Binet and Wechsler Tests.md',
    output: '5 Assessment/5 Stanford-Binet and Wechsler Tests done.md',
    kn_id: 'KN28',
  },
  {
    source: '5 Assessment/5 Clinical Tests.md',
    output: '5 Assessment/5 Clinical Tests done.md',
    kn_id: 'KN25',
  },
  {
    source: '5 Assessment/5 MMPI-2.md',
    output: '5 Assessment/5 MMPI-2 done.md',
    kn_id: 'KN28',
  },
  {
    source: '5 Assessment/5 Interest Inventories.md',
    output: '5 Assessment/5 Interest Inventories done.md',
    kn_id: 'KN29',
  },
  {
    source: '5 Assessment/5 Other Measures of Cognitive Ability.md',
    output: '5 Assessment/5 Other Measures of Cognitive Ability done.md',
    kn_id: 'KN28',
  },
  {
    source: '5 Assessment/5 Other Measures of Personality.md',
    output: '5 Assessment/5 Other Measures of Personality done.md',
    kn_id: 'KN28',
  },
  {
    source: '5 Test Construction/5 Item Analysis and Test Reliability.md',
    output: '5 Test Construction/5 Item Analysis and Test Reliability done.md',
    kn_id: 'KN26',
  },
  {
    source: '5 Test Construction/5 Test Validity – Content and Construct Validity.md',
    output: '5 Test Construction/5 Test Validity – Content and Construct Validity done.md',
    kn_id: 'KN26',
  },
  {
    source: '5 Test Construction/5 Test Validity – Criterion-Related Validity.md',
    output: '5 Test Construction/5 Test Validity – Criterion-Related Validity done.md',
    kn_id: 'KN26',
  },
  {
    source: '5 Test Construction/5 Test Score Interpretation.md',
    output: '5 Test Construction/5 Test Score Interpretation done.md',
    kn_id: 'KN26',
  },
  // PSYCHOPATHOLOGY/DIAGNOSIS FILES (11 files)
  {
    source: '5 Diagnosis : Psychopathology/5 Neurodevelopmental Disorders.md',
    output: '5 Diagnosis : Psychopathology/5 Neurodevelopmental Disorders done.md',
    kn_id: 'KN18',
  },
  {
    source: '5 Diagnosis : Psychopathology/5 Disruptive, Impulse-Control, and Conduct Disorders.md',
    output: '5 Diagnosis : Psychopathology/5 Disruptive, Impulse-Control, and Conduct Disorders done.md',
    kn_id: 'KN18',
  },
  {
    source: '5 Diagnosis : Psychopathology/5 Bipolar and Depressive Disorders.md',
    output: '5 Diagnosis : Psychopathology/5 Bipolar and Depressive Disorders done.md',
    kn_id: 'KN20',
  },
  {
    source: '5 Diagnosis : Psychopathology/5 Anxiety Disorders and Obsessive-Compulsive Disorder.md',
    output: '5 Diagnosis : Psychopathology/5 Anxiety Disorders and Obsessive-Compulsive Disorder done.md',
    kn_id: 'KN21',
  },
  {
    source: '5 Diagnosis : Psychopathology/5 Trauma-Stressor-Related, Dissociative, and Somatic Symptom Disorders.md',
    output: '5 Diagnosis : Psychopathology/5 Trauma-Stressor-Related, Dissociative, and Somatic Symptom Disorders done.md',
    kn_id: 'KN21',
  },
  {
    source: '5 Diagnosis : Psychopathology/5 Feeding-Eating, Elimination, and Sleep-Wake Disor.md',
    output: '5 Diagnosis : Psychopathology/5 Feeding-Eating, Elimination, and Sleep-Wake Disor done.md',
    kn_id: 'KN22',
  },
  {
    source: '5 Diagnosis : Psychopathology/5 Substance-Related and Addictive Disorders.md',
    output: '5 Diagnosis : Psychopathology/5 Substance-Related and Addictive Disorders done.md',
    kn_id: 'KN22',
  },
  {
    source: '5 Diagnosis : Psychopathology/5 Personality Disorders.md',
    output: '5 Diagnosis : Psychopathology/5 Personality Disorders done.md',
    kn_id: 'KN24',
  },
  {
    source: '5 Diagnosis : Psychopathology/5 Sexual Dysfunctions, Gender Dysphoria, and Paraphilic Disorders.md',
    output: '5 Diagnosis : Psychopathology/5 Sexual Dysfunctions, Gender Dysphoria, and Paraphilic Disorders done.md',
    kn_id: 'KN24',
  },
  {
    source: '5 Diagnosis : Psychopathology/5 Schizophrenia Spectrum-Other Psychotic Disorders.md',
    output: '5 Diagnosis : Psychopathology/5 Schizophrenia Spectrum-Other Psychotic Disorders done.md',
    kn_id: 'KN19',
  },
  {
    source: '5 Diagnosis : Psychopathology/5 Neurocognitive Disorders.md',
    output: '5 Diagnosis : Psychopathology/5 Neurocognitive Disorders done.md',
    kn_id: 'KN23',
  },
  // TREATMENT/INTERVENTION FILES (5 files)
  {
    source: '6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Psychodynamic and Humanistic Therapies.md',
    output: '6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Psychodynamic and Humanistic Therapies done.md',
    kn_id: 'KN30',
  },
  {
    source: '6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Cognitive-Behavioral Therapies.md',
    output: '6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Cognitive-Behavioral Therapies done.md',
    kn_id: 'KN31',
  },
  {
    source: '6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Family Therapies and Group Therapies.md',
    output: '6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Family Therapies and Group Therapies done.md',
    kn_id: 'KN33',
  },
  {
    source: '6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Brief Therapies.md',
    output: '6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Brief Therapies done.md',
    kn_id: 'KN31',
  },
  {
    source: '6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Prevention, Consultation, and Psychotherapy Research.md',
    output: '6 Treatment, Intervention, and Prevention : Clinical Psychology/6 Prevention, Consultation, and Psychotherapy Research done.md',
    kn_id: 'KN35',
  },
  // ORGANIZATIONAL/PROFESSIONAL FILES (12 files)
  {
    source: '2 3 5 6 Organizational Psychology/2 3 Satisfaction, Commitment, and Stress.md',
    output: '2 3 5 6 Organizational Psychology/2 3 Satisfaction, Commitment, and Stress done.md',
    kn_id: 'KN37',
  },
  {
    source: '2 3 5 6 Organizational Psychology/2 Theories of Motivation.md',
    output: '2 3 5 6 Organizational Psychology/2 Theories of Motivation done.md',
    kn_id: 'KN48',
  },
  {
    source: '2 3 5 6 Organizational Psychology/5 6 Job Analysis and Performance Assessment.md',
    output: '2 3 5 6 Organizational Psychology/5 6 Job Analysis and Performance Assessment done.md',
    kn_id: 'KN37',
  },
  {
    source: '2 3 5 6 Organizational Psychology/5 6 Organizational Decision-Making.md',
    output: '2 3 5 6 Organizational Psychology/5 6 Organizational Decision-Making done.md',
    kn_id: 'KN37',
  },
  {
    source: '2 3 5 6 Organizational Psychology/5 6 Organizational Leadership.md',
    output: '2 3 5 6 Organizational Psychology/5 6 Organizational Leadership done.md',
    kn_id: 'KN37',
  },
  {
    source: '2 3 5 6 Organizational Psychology/5 6 Training Methods and Evaluation.md',
    output: '2 3 5 6 Organizational Psychology/5 6 Training Methods and Evaluation done.md',
    kn_id: 'KN37',
  },
  {
    source: '2 3 5 6 Organizational Psychology/5 Employee Selection – Techniques.md',
    output: '2 3 5 6 Organizational Psychology/5 Employee Selection – Techniques done.md',
    kn_id: 'KN37',
  },
  {
    source: '2 3 5 6 Organizational Psychology/5 Employee Selection – Evaluation of Techniques.md',
    output: '2 3 5 6 Organizational Psychology/5 Employee Selection – Evaluation of Techniques done.md',
    kn_id: 'KN37',
  },
  {
    source: '2 3 5 6 Organizational Psychology/6 Job Analysis and Performance Assessment.md',
    output: '2 3 5 6 Organizational Psychology/6 Job Analysis and Performance Assessment done.md',
    kn_id: 'KN37',
  },
  {
    source: '2 3 5 6 Organizational Psychology/6 Organizational Theories.md',
    output: '2 3 5 6 Organizational Psychology/6 Organizational Theories done.md',
    kn_id: 'KN37',
  },
  {
    source: '2 3 5 6 Organizational Psychology/6 Organizational Change and Development.md',
    output: '2 3 5 6 Organizational Psychology/6 Organizational Change and Development done.md',
    kn_id: 'KN37',
  },
  {
    source: '2 3 5 6 Organizational Psychology/6 Career Choice and Development.md',
    output: '2 3 5 6 Organizational Psychology/6 Career Choice and Development done.md',
    kn_id: 'KN37',
  },
  // RESEARCH/STATISTICS FILES (6 files)
  {
    source: '7 Research Methods & Statistics/7 Types of Variables and Data.md',
    output: '7 Research Methods & Statistics/7 Types of Variables and Data done.md',
    kn_id: 'KN50',
  },
  {
    source: '7 Research Methods & Statistics/7 Overview of Inferential Statistics.md',
    output: '7 Research Methods & Statistics/7 Overview of Inferential Statistics done.md',
    kn_id: 'KN51',
  },
  {
    source: '7 Research Methods & Statistics/7 Inferential Statistical Tests.md',
    output: '7 Research Methods & Statistics/7 Inferential Statistical Tests done.md',
    kn_id: 'KN51',
  },
  {
    source: '7 Research Methods & Statistics/7 Correlation and Regression.md',
    output: '7 Research Methods & Statistics/7 Correlation and Regression done.md',
    kn_id: 'KN51',
  },
  {
    source: '7 Research Methods & Statistics/7 Research – Internal-External Validity.md',
    output: '7 Research Methods & Statistics/7 Research – Internal-External Validity done.md',
    kn_id: 'KN50',
  },
  {
    source: '7 Research Methods & Statistics/7 Research – Single-Subject and Group Designs.md',
    output: '7 Research Methods & Statistics/7 Research – Single-Subject and Group Designs done.md',
    kn_id: 'KN50',
  },
  // ETHICS/LEGAL/PROFESSIONAL FILES (6 files)
  {
    source: '8 Ethical : Legal : Professional Issues/8 APA Ethics Code Over and Standards 1 & 2.md',
    output: '8 Ethical : Legal : Professional Issues/8 APA Ethics Code Over and Standards 1 & 2 done.md',
    kn_id: 'KN38',
  },
  {
    source: '8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 3 & 4.md',
    output: '8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 3 & 4 done.md',
    kn_id: 'KN39',
  },
  {
    source: '8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 5 & 6.md',
    output: '8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 5 & 6 done.md',
    kn_id: 'KN39',
  },
  {
    source: '8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 7 & 8.md',
    output: '8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 7 & 8 done.md',
    kn_id: 'KN40',
  },
  {
    source: '8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 9 & 10.md',
    output: '8 Ethical : Legal : Professional Issues/8 APA Ethics Code Standards 9 & 10 done.md',
    kn_id: 'KN41',
  },
  {
    source: '8 Ethical : Legal : Professional Issues/8 Professional Issues.md',
    output: '8 Ethical : Legal : Professional Issues/8 Professional Issues done.md',
    kn_id: 'KN42',
  },
];

async function readSourceFile(filePath) {
  return new Promise((resolve) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      resolve(err ? '' : data);
    });
  });
}

async function generateQuestionsWithClaude(content, knId, fileName) {
  let apiKey = process.env.ANTHROPIC_API_KEY;

  // Try to load from .env.local if not set
  if (!apiKey) {
    try {
      const envContent = fs.readFileSync('/Users/anderschan/thepsychology-ai/.env.local', 'utf8');
      const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
      if (match) {
        apiKey = match[1].trim();
      }
    } catch (e) {
      // Ignore file read errors
    }
  }

  if (!apiKey) {
    console.log('  ERROR: ANTHROPIC_API_KEY not set');
    return [];
  }

  const prompt = `You are an expert EPPP (Examination for Professional Practice in Psychology) test question generator.

Generate exactly 20 multiple-choice questions based on the following source material:

---SOURCE MATERIAL---
${content.substring(0, 4000)}
---END SOURCE---

Requirements:
1. Create 20 questions total with this distribution:
   - ~50% (10 questions): Basic recall/definition (type: "basic", difficulty: "easy")
   - ~20% (4 questions): Distinguish between concepts (type: "distinction", difficulty: "medium")
   - ~30% (6 questions): Advanced/application questions (type: "difficult", difficulty: "hard")

2. Format as JSON array with objects containing:
   - id: "q001", "q002", ... "q020"
   - difficulty: "easy" | "medium" | "hard"
   - type: "basic" | "distinction" | "difficult"
   - question: 1-2 sentence stem
   - options: {"A": "option text", "B": "option text", "C": "option text", "D": "option text"}
   - correct_answer: "A" | "B" | "C" | "D"
   - kn_id: "${knId}"
   - explanation: Brief 1-2 sentence explanation

3. Answer length balance: max variance <= 15 characters within each question's options
4. Concise stems (1-2 sentences), brief options (max 50 chars each)
5. Ensure all 4 options are plausible but clearly distinguishable
6. Cover main concepts and key details from the source material
7. All questions should be appropriate for EPPP level (doctoral-level psychology)

Return ONLY a valid JSON array with exactly 20 question objects. No markdown formatting, no code blocks.`;

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 5000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.content && response.content[0]) {
            let responseText = response.content[0].text;

            // Remove markdown code blocks
            if (responseText.includes('```json')) {
              responseText = responseText.split('```json')[1].split('```')[0];
            } else if (responseText.includes('```')) {
              responseText = responseText.split('```')[1].split('```')[0];
            }

            responseText = responseText.trim();
            const questions = JSON.parse(responseText);

            if (Array.isArray(questions) && questions.length === 20) {
              resolve(questions);
            } else {
              console.log(`  Warning: Got ${questions.length || 0} questions instead of 20`);
              resolve(Array.isArray(questions) ? questions : []);
            }
          }
        } catch (err) {
          console.log(`  Error parsing JSON: ${err.message}`);
          resolve([]);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`  Error: ${err.message}`);
      resolve([]);
    });

    req.write(postData);
    req.end();
  });
}

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveQuestions(questions, outputPath, sourceFile) {
  ensureDirectoryExists(outputPath);

  const content = JSON.stringify(
    {
      source_file: path.basename(sourceFile),
      questions: questions,
    },
    null,
    2
  );

  fs.writeFileSync(outputPath, content, 'utf8');
  console.log(`  Saved ${questions.length} questions to ${outputPath}`);
}

async function processFiles() {
  let successful = 0;
  let failed = 0;
  const failedFiles = [];

  for (let i = 0; i < PRIORITY_FILES.length; i++) {
    const fileConfig = PRIORITY_FILES[i];
    const sourceFile = path.join(SOURCE_ROOT, fileConfig.source);
    const outputFile = path.join(OUTPUT_ROOT, fileConfig.output);

    console.log(`\n[${i + 1}/${PRIORITY_FILES.length}] Processing: ${fileConfig.source}`);

    // Read source content
    const content = await readSourceFile(sourceFile);
    if (!content) {
      console.log(`  ERROR: Could not read source file`);
      failed++;
      failedFiles.push(fileConfig.source);
      continue;
    }

    // Generate questions
    console.log(`  Generating 20 questions...`);
    const questions = await generateQuestionsWithClaude(content, fileConfig.kn_id, fileConfig.source);

    if (!questions || questions.length !== 20) {
      console.log(`  ERROR: Failed to generate exactly 20 questions (got ${questions.length || 0})`);
      failed++;
      failedFiles.push(fileConfig.source);
      continue;
    }

    // Save questions
    saveQuestions(questions, outputFile, fileConfig.source);
    successful++;

    // Rate limiting
    if (i < PRIORITY_FILES.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`SUMMARY:`);
  console.log(`  Total files: ${PRIORITY_FILES.length}`);
  console.log(`  Successful: ${successful}/${PRIORITY_FILES.length}`);
  console.log(`  Failed: ${failed}/${PRIORITY_FILES.length}`);

  if (failedFiles.length > 0) {
    console.log(`\nFailed files:`);
    failedFiles.forEach((f) => console.log(`  - ${f}`));
  }

  console.log(`${'='.repeat(60)}`);
}

processFiles().catch(console.error);
