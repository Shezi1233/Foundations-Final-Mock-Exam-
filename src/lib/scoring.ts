import { ExamMetadata, Question, TopicPerformance } from './types';

export function calculateScore(questions: Question[], answers: Record<number, string[]>): number {
  let correctCount = 0;

  for (const question of questions) {
    const userAnswer = answers[question.id] || [];
    const correctAnswer = question.answer;

    // For a question to be correct, the sets must be exactly equal
    // Sort both arrays to compare them properly regardless of order
    const sortedUserAnswer = [...userAnswer].sort();
    const sortedCorrectAnswer = [...correctAnswer].sort();

    if (JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer)) {
      correctCount++;
    }
  }

  // Calculate score: (correctCount / totalQuestions) * totalMarks
  const score = Math.round((correctCount / questions.length) * 1000);
  return score;
}

export function calculateTopicPerformance(
  questions: Question[],
  answers: Record<number, string[]>,
  topics: Record<string, string>
): TopicPerformance[] {
  const topicStats: Record<string, { correct: number; total: number }> = {};

  // Initialize stats for each topic
  for (const [code, name] of Object.entries(topics)) {
    topicStats[code] = { correct: 0, total: 0 };
  }

  // Count correct and total for each topic
  for (const question of questions) {
    const topic = question.topic;
    if (!topicStats[topic]) {
      continue; // Skip if topic not in exam metadata (shouldn't happen with validation)
    }

    topicStats[topic].total++;

    const userAnswer = answers[question.id] || [];
    const correctAnswer = question.answer;

    // Check if answer is correct (exact match)
    const sortedUserAnswer = [...userAnswer].sort();
    const sortedCorrectAnswer = [...correctAnswer].sort();

    if (JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer)) {
      topicStats[topic].correct++;
    }
  }

  // Convert to TopicPerformance array
  const performance: TopicPerformance[] = [];
  for (const [code, name] of Object.entries(topics)) {
    const stats = topicStats[code];
    const percentage = stats.total > 0
      ? Math.round((stats.correct / stats.total) * 100)
      : 0;

    performance.push({
      topicCode: code,
      topicName: name,
      correct: stats.correct,
      total: stats.total,
      percentage,
      isWeak: percentage < 70, // Weak if less than 70%
    });
  }

  return performance;
}

export function getPassFailStatus(score: number, passMarks: number): {
  status: 'PASS' | 'FAIL';
  message: string
} {
  const isPass = score >= passMarks;
  return {
    status: isPass ? 'PASS' : 'FAIL',
    message: isPass
      ? `Congratulations! You passed with ${score} marks.`
      : `You scored ${score} marks. You need ${passMarks} marks to pass.`
  };
}

// Unit test for scoring edge cases
if (require.main === module) {
  // Test case 1: 43 correct should be 717 (FAIL)
  const questions1: Question[] = Array.from({ length: 60 }, (_, i) => ({
    id: i + 1,
    topic: 'TEST',
    type: 'single',
    answer: ['A'],
    scenario: '',
    stem: '',
    options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
    explanation: '',
  }));

  const answers1: Record<number, string[]> = {};
  for (let i = 0; i < 43; i++) {
    answers1[i + 1] = ['A'];
  }

  const score1 = calculateScore(questions1, answers1);
  console.assert(score1 === 717, `Expected 717 for 43 correct, got ${score1}`);

  // Test case 2: 44 correct should be 733 (PASS)
  const answers2: Record<number, string[]> = {};
  for (let i = 0; i < 44; i++) {
    answers2[i + 1] = ['A'];
  }

  const score2 = calculateScore(questions1, answers2);
  console.assert(score2 === 733, `Expected 733 for 44 correct, got ${score2}`);

  // Test case 3: Multi-select exact matching
  const multiQuestions: Question[] = [{
    id: 1,
    topic: 'TEST',
    type: 'multi',
    answer: ['A', 'B'],
    scenario: '',
    stem: '',
    options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' },
    explanation: '',
  }];

  // Correct answer
  let multiAnswers: Record<number, string[]> = { 1: ['A', 'B'] };
  let multiScore = calculateScore(multiQuestions, multiAnswers);
  console.assert(multiScore === 1000, `Expected 1000 for 1/1 correct, got ${multiScore}`);

  // Wrong answer (only one correct)
  multiAnswers = { 1: ['A'] };
  multiScore = calculateScore(multiQuestions, multiAnswers);
  console.assert(multiScore === 0, `Expected 0 for partial multi answer, got ${multiScore}`);

  // Wrong answer (both wrong)
  multiAnswers = { 1: ['C', 'D'] };
  multiScore = calculateScore(multiQuestions, multiAnswers);
  console.assert(multiScore === 0, `Expected 0 for wrong multi answer, got ${multiScore}`);

  // Correct answer but different order
  multiAnswers = { 1: ['B', 'A'] };
  multiScore = calculateScore(multiQuestions, multiAnswers);
  console.assert(multiScore === 1000, `Expected 1000 for correct multi answer (different order), got ${multiScore}`);

  console.log('✅ All scoring tests passed!');
}