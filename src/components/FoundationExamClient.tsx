'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExamMetadata, Question, ExamState } from '@/lib/types';
import StartScreen from './StartScreen';
import ExamScreen from './ExamScreen';
import ResultScreen from './ResultScreen';
import ConfirmDialog from './ConfirmDialog';

interface FoundationExamClientProps {
  initialExam: ExamMetadata;
  initialQuestions: Question[];
}

export default function FoundationExamClient({ initialExam, initialQuestions }: FoundationExamClientProps) {
  const [exam] = useState<ExamMetadata>(initialExam);
  const [questions] = useState<Question[]>(initialQuestions);
  const [examState, setExamState] = useState<ExamState>({
    name: '',
    startedAt: 0,
    answers: {},
    currentIndex: 0,
    status: 'start',
    submittedAt: 0,
  });
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Submit exam callback
  const handleSubmitExam = useCallback(() => {
    setExamState(prev => ({
      ...prev,
      status: 'result',
      submittedAt: Date.now(),
    }));
  }, []);

  // Load persisted state from localStorage on initial mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('foundationExamState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Validate that we have the required fields
        if (parsedState && typeof parsedState === 'object') {
          setExamState(prev => ({
            ...prev,
            ...parsedState,
            // Ensure answers is an object
            answers: typeof parsedState.answers === 'object' ? parsedState.answers : {},
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to load foundation exam state from localStorage', err);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (exam && questions.length > 0) {
      try {
        localStorage.setItem('foundationExamState', JSON.stringify(examState));
      } catch (err) {
        console.warn('Failed to save foundation exam state to localStorage', err);
      }
    }
  }, [exam, questions.length, examState]);

  // Handle auto-submit when time runs out
  useEffect(() => {
    if (examState.status === 'exam' && examState.startedAt > 0 && exam) {
      const expiryTime = examState.startedAt + (exam.durationMinutes * 60 * 1000);
      const now = Date.now();

      if (now >= expiryTime) {
        // Time's up - submit exam
        handleSubmitExam();
      }
    }
  }, [examState.status, examState.startedAt, exam, handleSubmitExam]);

  // Start exam
  const handleStartExam = useCallback((name: string) => {
    setExamState(prev => ({
      ...prev,
      name,
      startedAt: Date.now(),
      status: 'exam',
      currentIndex: 0,
    }));
  }, []);

  // Move to question
  const handleMoveToQuestion = useCallback((index: number) => {
    setExamState(prev => ({
      ...prev,
      currentIndex: index,
    }));
  }, []);

  // Update answer
  const handleUpdateAnswer = useCallback((id: number, answer: string[]) => {
    setExamState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [id]: answer,
      },
    }));
  }, []);

  // Clear confirm reset
  const handleConfirmResetCancel = useCallback(() => {
    setConfirmResetOpen(false);
  }, []);

  // Confirm reset (retake)
  const handleConfirmResetConfirm = useCallback(() => {
    setConfirmResetOpen(false);
    // Clear exam state
    setExamState({
      name: '',
      startedAt: 0,
      answers: {},
      currentIndex: 0,
      status: 'start',
      submittedAt: 0,
    });
    // Clear localStorage
    try {
      localStorage.removeItem('foundationExamState');
    } catch (err) {
      console.warn('Failed to clear foundation exam state from localStorage', err);
    }
  }, []);

  // Main app logic based on exam state
  return (
    <div className="min-h-screen bg-gray-50">
      {examState.status === 'start' && (
        <StartScreen
          exam={exam}
          onStartExam={handleStartExam}
        />
      )}

      {examState.status === 'exam' && (
        <ExamScreen
          questions={questions}
          exam={exam}
          onUpdateAnswer={handleUpdateAnswer}
          onMoveToQuestion={handleMoveToQuestion}
          onSubmitExam={handleSubmitExam}
          examState={examState}
        />
      )}

      {examState.status === 'result' && (
        <ResultScreen
          exam={exam}
          questions={questions}
          examState={examState}
          onRetake={() => setConfirmResetOpen(true)}
        />
      )}

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={confirmResetOpen}
        onConfirm={handleConfirmResetConfirm}
        onCancel={handleConfirmResetCancel}
        title="Retake Exam"
        message="Are you sure you want to retake the exam? All progress will be lost."
        confirmText="Retake Exam"
        cancelText="Cancel"
      />
    </div>
  );
}