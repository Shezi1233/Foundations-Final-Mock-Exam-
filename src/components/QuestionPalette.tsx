import { useState } from 'react';
import { Question } from '@/lib/types';

interface QuestionPaletteProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<number, string[]>;
  onMoveToQuestion: (index: number) => void;
  onSubmit: () => void;
}

export default function QuestionPalette({
  questions,
  currentIndex,
  answers,
  onMoveToQuestion,
  onSubmit,
}: QuestionPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);

  const togglePalette = () => {
    setIsOpen(!isOpen);
  };

  const getQuestionStatus = (index: number): 'current' | 'answered' | 'unanswered' => {
    if (index === currentIndex) return 'current';
    const userAnswer = answers[index + 1] || [];
    return userAnswer.length > 0 ? 'answered' : 'unanswered';
  };

  const getStatusClass = (status: 'current' | 'answered' | 'unanswered'): string => {
    switch (status) {
      case 'current': return 'bg-indigo-600 text-white border-2 border-indigo-800';
      case 'answered': return 'bg-green-600 text-white';
      case 'unanswered': return 'bg-white text-slate-700 border-2 border-slate-200';
      default: return 'bg-white text-slate-700 border-2 border-slate-200';
    }
  };

  return (
    <>
      {/* Palette Toggle Button */}
      <button
        onClick={togglePalette}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all"
        aria-label="Toggle question palette"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>

      {/* Palette Drawer */}
      <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`w-full max-w-sm bg-white shadow-2xl p-6 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Question Palette</h2>
            <button
              onClick={togglePalette}
              className="text-slate-500 hover:text-slate-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <button
              onClick={() => {
                togglePalette();
                onSubmit();
              }}
              className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
            >
              Submit Exam
            </button>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {questions.map((question, index) => {
              const status = getQuestionStatus(index);
              const statusClass = getStatusClass(status);

              return (
                <button
                  key={question.id}
                  onClick={() => {
                    onMoveToQuestion(index);
                    togglePalette();
                  }}
                  className={`w-12 h-12 rounded-lg ${statusClass} flex items-center justify-center font-bold text-sm shadow-sm transition-all hover:scale-105`}
                  aria-label={`Question ${question.id}: ${status}`}
                >
                  {question.id}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={togglePalette} />
      )}
    </>
  );
}