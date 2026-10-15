import { promises as fs } from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { ExamMetadata, Question } from './types';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export async function loadExam(): Promise<ExamMetadata> {
  const filePath = path.join(CONTENT_DIR, 'exam.md');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const { data } = matter(fileContents);

  return {
    title: data.title,
    durationMinutes: data.durationMinutes,
    totalQuestions: data.totalQuestions,
    totalMarks: data.totalMarks,
    passMarks: data.passMarks,
    shuffleQuestions: data.shuffleQuestions,
    topics: data.topics,
  };
}

export async function loadQuestion(id: number): Promise<Question> {
  const filePath = path.join(CONTENT_DIR, 'questions', `q${id.toString().padStart(2, '0')}.md`);
  const fileContents = await fs.readFile(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  // Parse the body to extract scenario, stem, options, and explanation
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

  return {
    id: data.id,
    topic: data.topic,
    type: data.type,
    answer: data.answer.split(',').map((a: string) => a.trim()),
    scenario: scenarioLines.join('\n').trim(),
    stem,
    options,
    explanation: explanationLines.join('\n').trim(),
  };
}

export async function loadAllQuestions(): Promise<Question[]> {
  const files = await fs.readdir(path.join(CONTENT_DIR, 'questions'));
  const questionFiles = files.filter(file => file.endsWith('.md')).sort();

  const questions: Question[] = [];
  for (const file of questionFiles) {
    const id = parseInt(file.replace(/^q(\d+)\.md$/, '$1'), 10);
    if (!isNaN(id)) {
      questions.push(await loadQuestion(id));
    }
  }

  return questions.sort((a, b) => a.id - b.id);
}