#!/usr/bin/env tsx

import { promises as fs } from 'fs';
import matter from 'gray-matter';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

async function validate() {
  console.log('🔍 Validating exam content...');

  // Load exam metadata
  const examFilePath = path.join(CONTENT_DIR, 'exam.md');
  const examFileContents = await fs.readFile(examFilePath, 'utf8');
  const { data: examData } = matter(examFileContents);

  // Load all questions
  const questionsDir = path.join(CONTENT_DIR, 'questions');
  const files = await fs.readdir(questionsDir);
  const questionFiles = files.filter(file => file.endsWith('.md')).sort();

  // Validation results
  let errors: string[] = [];
  let warnings: string[] = [];

  // Check 1: Exactly 60 question files with ids 1..60 and no duplicates
  if (questionFiles.length !== 60) {
    errors.push(`❌ Expected 60 question files, found ${questionFiles.length}`);
  }

  const questionIds: number[] = [];
  const seenIds = new Set<number>();

  for (const file of questionFiles) {
    const idMatch = file.match(/^q(\d+)\.md$/);
    if (!idMatch) {
      errors.push(`❌ Invalid question filename format: ${file}`);
      continue;
    }

    const id = parseInt(idMatch[1], 10);
    if (isNaN(id)) {
      errors.push(`❌ Invalid question ID in filename: ${file}`);
      continue;
    }

    if (seenIds.has(id)) {
      errors.push(`❌ Duplicate question ID found: ${id}`);
    } else {
      seenIds.add(id);
      questionIds.push(id);
    }
  }

  // Check for missing IDs
  const expectedIds = Array.from({ length: 60 }, (_, i) => i + 1);
  const missingIds = expectedIds.filter(id => !seenIds.has(id));
  if (missingIds.length > 0) {
    errors.push(`❌ Missing question IDs: ${missingIds.join(', ')}`);
  }

  // Check for extra IDs
  const extraIds = questionIds.filter(id => id < 1 || id > 60);
  if (extraIds.length > 0) {
    errors.push(`❌ Question IDs out of range (1-60): ${extraIds.join(', ')}`);
  }

  // Load all questions for further validation
  const questions: any[] = [];

  for (const file of questionFiles) {
    try {
      const filePath = path.join(questionsDir, file);
      const fileContents = await fs.readFile(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      // Parse body similar to content.ts
      const lines = content.split('\n');
      let scenarioLines: string[] = [];
      let stem = '';
      const options: Record<string, string> = {};
      let explanationLines: string[] = [];

      let currentSection: 'scenario' | 'stem' | 'options' | 'explanation' = 'scenario';

      for (const line of lines) {
        if (line.match(/^\*\*[^*]+\*\*$/)) {
          stem = line.replace(/^\*\*([^*]*)\*\*$/, '$1').trim();
          currentSection = 'options';
          continue;
        }

        if (line.startsWith('## Explanation')) {
          currentSection = 'explanation';
          continue;
        }

        if (currentSection === 'scenario' && line.trim() !== '') {
          scenarioLines.push(line);
        }

        if (currentSection === 'options') {
          const optionMatch = line.match(/^([A-D])\.\s+(.+)$/);
          if (optionMatch) {
            options[optionMatch[1]] = optionMatch[2];
          }
        }

        if (currentSection === 'explanation' && line.trim() !== '') {
          explanationLines.push(line);
        }
      }

      questions.push({
        id: data.id,
        topic: data.topic,
        type: data.type,
        answer: data.answer.split(',').map((a: string) => a.trim()),
        scenario: scenarioLines.join('\n').trim(),
        stem,
        options,
        explanation: explanationLines.join('\n').trim(),
        rawContent: content
      });
    } catch (error) {
      errors.push(`❌ Failed to parse question file ${file}: ${error}`);
    }
  }

  // Check 2: Every question has the 4 options A-D, a non-empty stem, and an explanation
  for (const q of questions) {
    if (q.id === undefined) {
      errors.push(`❌ Question missing ID in frontmatter`);
      continue;
    }

    const missingOptions = ['A', 'B', 'C', 'D'].filter(opt => !(opt in q.options));
    if (missingOptions.length > 0) {
      errors.push(`❌ Question ${q.id}: Missing options ${missingOptions.join(', ')}`);
    }

    if (!q.stem || q.stem.trim() === '') {
      errors.push(`❌ Question ${q.id}: Stem is empty`);
    }

    if (!q.explanation || q.explanation.trim() === '') {
      errors.push(`❌ Question ${q.id}: Explanation is empty`);
    }
  }

  // Check 3: type: single has exactly 1 answer letter and type: multi has exactly 2
  for (const q of questions) {
    if (q.type === 'single') {
      if (q.answer.length !== 1) {
        errors.push(`❌ Question ${q.id}: Single answer question must have exactly 1 answer, got ${q.answer.length}`);
      }
    } else if (q.type === 'multi') {
      if (q.answer.length !== 2) {
        errors.push(`❌ Question ${q.id}: Multiple answer question must have exactly 2 answers, got ${q.answer.length}`);
      }
    } else {
      errors.push(`❌ Question ${q.id}: Invalid type '${q.type}' - must be 'single' or 'multi'`);
    }

    // Check that every answer letter exists among the options
    for (const answer of q.answer) {
      if (!(answer in q.options)) {
        errors.push(`❌ Question ${q.id}: Answer '${answer}' does not correspond to any option`);
      }
    }
  }

  // Check 4: Every topic code exists in exam.md
  const validTopics = Object.keys(examData.topics);
  for (const q of questions) {
    if (!validTopics.includes(q.topic)) {
      errors.push(`❌ Question ${q.id}: Topic code '${q.topic}' not found in exam.md topics`);
    }
  }

  // Check 5: A stem containing "(Select TWO)" must have type: multi
  for (const q of questions) {
    const hasSelectTwo = q.stem.includes('(Select TWO)') || q.stem.includes('(Select two)');
    if (hasSelectTwo && q.type !== 'multi') {
      errors.push(`❌ Question ${q.id}: Stem contains '(Select TWO)' but type is '${q.type}' (should be 'multi')`);
    }

    // Also check the reverse: if type is multi, stem should probably contain Select TWO (warning, not error)
    if (q.type === 'multi' && !hasSelectTwo) {
      warnings.push(`⚠️  Question ${q.id}: Type is 'multi' but stem does not contain '(Select TWO)'`);
    }
  }

  // Print results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All validation checks passed!');

    // Print summary
    const singleCount = questions.filter(q => q.type === 'single').length;
    const multiCount = questions.filter(q => q.type === 'multi').length;

    const topicCounts: Record<string, number> = {};
    for (const q of questions) {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    }

    console.log(`\� Summary:`);
    console.log(`  - Total questions: ${questions.length}`);
    console.log(`  - Single answer: ${singleCount}`);
    console.log(`  - Multiple answer: ${multiCount}`);
    console.log(`  - Questions per topic:`);
    for (const [topicCode, count] of Object.entries(topicCounts).sort()) {
      const topicName = examData.topics[topicCode] || topicCode;
      console.log(`    - ${topicCode} (${topicName}): ${count}`);
    }

    process.exit(0);
  } else {
    if (errors.length > 0) {
      console.log('\n❌ Validation failed with errors:');
      errors.forEach(error => console.log(error));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(warning => console.log(warning));
    }

    process.exit(1);
  }
}

// Run validation
validate().catch(error => {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
});