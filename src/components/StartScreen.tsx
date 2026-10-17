'use client';

import { useState } from 'react';
import { ExamMetadata } from '@/lib/types';

interface StartScreenProps {
  exam: ExamMetadata;
  onStartExam: (name: string) => void;
}

export default function StartScreen({
  exam,
  onStartExam,
}: StartScreenProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    onStartExam(trimmedName);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-8 border border-slate-200">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          {exam.title}
        </h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Facts</h2>
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">Questions: <span className="font-semibold text-slate-900">{exam.totalQuestions}</span></div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">Duration: <span className="font-semibold text-slate-900">{exam.durationMinutes} minutes</span></div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">Total Marks: <span className="font-semibold text-slate-900">{exam.totalMarks}</span></div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">Pass Marks: <span className="font-semibold text-slate-900">{exam.passMarks}</span></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-900 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white text-slate-900 placeholder:text-slate-400 caret-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Enter your full name"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={!name.trim() || name.trim().length < 2}
            className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            Begin Exam
          </button>
        </form>
      </div>
    </div>
  );
}