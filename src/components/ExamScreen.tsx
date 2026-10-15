import { useState, useEffect, useRef } from 'react';
import { Question, ExamState } from '@/lib/types';
import QuestionPalette from './QuestionPalette';
import ConfirmDialog from './ConfirmDialog';

interface ExamScreenProps {
  questions: Question[];
  exam: any; // ExamMetadata
  onUpdateAnswer: (id: number, answer: string[]) => void;
  onMoveToQuestion: (index: number) => void;
  onSubmitExam: () => void;
  examState: ExamState;
}

export default function ExamScreen({
  questions,
  exam,
  onUpdateAnswer,
  onMoveToQuestion,
  onSubmitExam,
  examState,
}: ExamScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question>(questions[examState.currentIndex]);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    setCurrentQuestion(questions[examState.currentIndex]);

    if (examState.status === 'exam' && examState.startedAt > 0) {
      startTimer(examState.startedAt, exam.durationMinutes * 60);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [examState.currentIndex, examState.status, examState.startedAt, questions, exam.durationMinutes]);

  useEffect(() => {
    if (examState.status === 'exam' && examState.startedAt > 0) {
      startTimer(examState.startedAt, exam.durationMinutes * 60);
    }
  }, [examState.status, examState.startedAt, exam.durationMinutes]);

  function startTimer(startTime: number, durationSeconds: number) {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    function updateTimer() {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        onSubmitExam();
        return;
      }

      timerRef.current = setTimeout(updateTimer, 1000);
    }

    updateTimer();
  }

  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function handleOptionSelect(option: string) {
    const currentAnswers = examState.answers[examState.currentIndex + 1] || [];
    let newAnswers: string[] = [];

    if (currentQuestion.type === 'single') {
      newAnswers = [option];
    } else {
      if (currentAnswers.includes(option)) {
        newAnswers = currentAnswers.filter(ans => ans !== option);
      } else {
        if (currentAnswers.length < 2) {
          newAnswers = [...currentAnswers, option];
        } else {
          return;
        }
      }
    }

    onUpdateAnswer(examState.currentIndex + 1, newAnswers);
  }

  function isOptionSelected(option: string): boolean {
    return (examState.answers[examState.currentIndex + 1] || []).includes(option);
  }

  function getAnswerComplete(): boolean {
    const currentAnswers = examState.answers[examState.currentIndex + 1] || [];
    if (currentQuestion.type === 'single') {
      return currentAnswers.length === 1;
    } else {
      return currentAnswers.length === 2;
    }
  }

  function handleClear() {
    onUpdateAnswer(examState.currentIndex + 1, []);
  }

  function handleSaveAndNext() {
    if (!getAnswerComplete()) return;

    if (examState.currentIndex < questions.length - 1) {
      onMoveToQuestion(examState.currentIndex + 1);
    } else {
      setConfirmSubmitOpen(true);
    }
  }

  function handlePrevious() {
    if (examState.currentIndex > 0) {
      onMoveToQuestion(examState.currentIndex - 1);
    }
  }

  function handleSubmitConfirm() {
    setConfirmSubmitOpen(false);
    onSubmitExam();
  }

  function handleSubmitCancel() {
    setConfirmSubmitOpen(false);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (getAnswerComplete()) {
            if (examState.currentIndex < questions.length - 1) {
              onMoveToQuestion(examState.currentIndex + 1);
            } else {
              setConfirmSubmitOpen(true);
            }
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (getAnswerComplete()) {
            if (examState.currentIndex < questions.length - 1) {
              onMoveToQuestion(examState.currentIndex + 1);
            } else {
              setConfirmSubmitOpen(true);
            }
          }
          break;
        default:
          if (e.key >= 'a' && e.key <= 'd') {
            e.preventDefault();
            const option = e.key.toUpperCase();
            handleOptionSelect(option);
          } else if (e.key >= 'A' && e.key <= 'D') {
            e.preventDefault();
            handleOptionSelect(e.key);
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [examState.currentIndex, getAnswerComplete, questions.length]);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-slate-900">{exam.title}</h1>
            <span className="text-slate-400 font-bold">|</span>
            <span className="text-slate-700 font-semibold">{examState.name}</span>
          </div>
          <div className="text-right">
            <div className={`text-xl font-mono font-bold ${timeLeft < 600 ? 'text-red-600' : 'text-slate-900'}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs font-medium text-slate-600">
              Time Remaining
            </div>
          </div>
        </div>

        {/* Question Counter */}
        <div className="mb-4 text-center text-sm font-semibold text-slate-700">
          Question {examState.currentIndex + 1} of {questions.length}
        </div>

        {/* Question Content */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 md:p-8 mb-6">
          {/* Scenario */}
          {currentQuestion.scenario && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
              <p className="text-slate-700 leading-relaxed text-base">{currentQuestion.scenario}</p>
            </div>
          )}

          {/* Stem */}
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 leading-snug">
            {currentQuestion.stem}
          </h2>

          {/* Options */}
          <div className="space-y-4">
            {['A', 'B', 'C', 'D'].map(option => {
              const selected = isOptionSelected(option);
              const isMulti = currentQuestion.type === 'multi';
              const selectedCount = (examState.answers[examState.currentIndex + 1] || []).length;
              const disabled = isMulti && !selected && selectedCount >= 2;

              return (
                <div
                  key={option}
                  onClick={() => {
                    if (!disabled) {
                      handleOptionSelect(option);
                    }
                  }}
                  className={`flex items-start space-x-3 cursor-pointer p-4 border-2 rounded-xl transition-all ${
                    selected
                      ? 'border-indigo-600 bg-indigo-50/60 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  } ${disabled ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100' : ''}`}
                >
                  <input
                    type={currentQuestion.type === 'single' ? 'radio' : 'checkbox'}
                    checked={selected}
                    onChange={() => {}}
                    className="mt-1 h-5 w-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-base font-bold ${selected ? 'text-indigo-900' : 'text-slate-900'}`}>
                        {option}.
                      </span>
                      {isMulti && (
                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">
                          SELECT TWO
                        </span>
                      )}
                    </div>
                    <p className={`text-base leading-relaxed ${selected ? 'text-indigo-950 font-semibold' : 'text-slate-800'}`}>
                      {currentQuestion.options[option]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clear Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleClear}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={examState.currentIndex === 0}
            className="px-6 py-3 bg-slate-200 text-slate-900 font-semibold rounded-xl hover:bg-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            onClick={handleSaveAndNext}
            disabled={!getAnswerComplete()}
            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {examState.currentIndex === questions.length - 1 ? 'Save & Submit' : 'Save & Next'}
          </button>
        </div>

        {/* Question Palette */}
        <QuestionPalette
          questions={questions}
          currentIndex={examState.currentIndex}
          answers={examState.answers}
          onMoveToQuestion={onMoveToQuestion}
          onSubmit={() => setConfirmSubmitOpen(true)}
        />

        {/* Submit Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmSubmitOpen}
          onConfirm={handleSubmitConfirm}
          onCancel={handleSubmitCancel}
          title="Submit Exam"
          message="Are you sure you want to submit your exam? You will not be able to change any answers."
          confirmText="Submit Exam"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}