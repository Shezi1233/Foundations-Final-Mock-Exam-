'use client';

import { useState } from 'react';
import { ExamMetadata, Question } from '@/lib/types';
import FoundationExamClient from '@/components/FoundationExamClient';
import PCAOFExamClient from '@/components/PCAOFExamClient';

interface HomeClientProps {
  foundationExam: ExamMetadata;
  foundationQuestions: Question[];
  pcaofExam: ExamMetadata;
  pcaofQuestions: Question[];
}

export default function HomeClient({
  foundationExam,
  foundationQuestions,
  pcaofExam,
  pcaofQuestions,
}: HomeClientProps) {
  const [selectedExam, setSelectedExam] = useState<'none' | 'foundation' | 'pcaof'>('none');

  if (selectedExam === 'foundation') {
    return <FoundationExamClient initialExam={foundationExam} initialQuestions={foundationQuestions} />;
  }

  if (selectedExam === 'pcaof') {
    return <PCAOFExamClient initialExam={pcaofExam} initialQuestions={pcaofQuestions} />;
  }

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">AI Exam Preparation Hub</h1>
        <p className="text-lg text-slate-600">Select an exam below to begin your simulation and test your knowledge.</p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Foundation Mock Exam Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 flex flex-col justify-between hover:shadow-2xl transition-shadow">
          <div>
            <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              Standard Mock
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{foundationExam.title}</h2>
            <p className="text-slate-600 mb-6 text-sm">
              Comprehensive scenario-based questions with single and multiple select formatting to test core fundamentals.
            </p>
            <div className="space-y-2 mb-8 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between"><span>Questions:</span> <span className="font-semibold">{foundationExam.totalQuestions}</span></div>
              <div className="flex justify-between"><span>Duration:</span> <span className="font-semibold">{foundationExam.durationMinutes} mins</span></div>
              <div className="flex justify-between"><span>Total Marks:</span> <span className="font-semibold">{foundationExam.totalMarks}</span></div>
            </div>
          </div>
          <button
            onClick={() => setSelectedExam('foundation')}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-md text-center"
          >
            Start Foundation Exam
          </button>
        </div>

        {/* PCAO-F Practice Question Pool Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200 flex flex-col justify-between hover:shadow-2xl transition-shadow">
          <div>
            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              Advanced Scenario & Tables
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{pcaofExam.title}</h2>
            <p className="text-slate-600 mb-6 text-sm">
              Advanced exam-style questions featuring tabular steps (ROW method) and deep scenario diagnostics (5-box method).
            </p>
            <div className="space-y-2 mb-8 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between"><span>Questions:</span> <span className="font-semibold">{pcaofExam.totalQuestions}</span></div>
              <div className="flex justify-between"><span>Duration:</span> <span className="font-semibold">{pcaofExam.durationMinutes} mins</span></div>
              <div className="flex justify-between"><span>Total Marks:</span> <span className="font-semibold">{pcaofExam.totalMarks}</span></div>
            </div>
          </div>
          <button
            onClick={() => setSelectedExam('pcaof')}
            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md text-center"
          >
            Start PCAO-F Exam
          </button>
        </div>
      </div>
    </main>
  );
}