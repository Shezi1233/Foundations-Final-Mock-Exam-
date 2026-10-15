export interface ExamMetadata {
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  passMarks: number;
  shuffleQuestions: boolean;
  topics: Record<string, string>;
}

export interface Question {
  id: number;
  topic: string;
  type: 'single' | 'multi';
  answer: string[];
  scenario: string;
  stem: string;
  options: Record<string, string>;
  explanation: string;
}

export interface ExamState {
  name: string;
  startedAt: number; // timestamp
  answers: Record<number, string[]>;
  currentIndex: number;
  status: 'start' | 'exam' | 'result';
  submittedAt?: number;
}

export interface TopicPerformance {
  topicCode: string;
  topicName: string;
  correct: number;
  total: number;
  percentage: number;
  isWeak: boolean;
}

export interface ReviewItem {
  id: number;
  topic: string;
  type: 'single' | 'multi';
  userAnswer: string[];
  correctAnswer: string[];
  isCorrect: boolean;
  explanation: string;
  scenario: string;
  stem: string;
  options: Record<string, string>;
}