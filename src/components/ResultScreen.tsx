import { useState } from 'react';
import { ExamMetadata, Question, TopicPerformance, ReviewItem } from '@/lib/types';
import { calculateScore, calculateTopicPerformance, getPassFailStatus } from '@/lib/scoring';

interface ResultScreenProps {
  exam: ExamMetadata;
  questions: Question[];
  examState: any; // ExamState
  onRetake: () => void;
}

export default function ResultScreen({
  exam,
  questions,
  examState,
  onRetake,
}: ResultScreenProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'wrong' | 'unanswered' | 'correct'>('all');

  // Calculate results
  const score = calculateScore(questions, examState.answers);
  const { status, message } = getPassFailStatus(score, exam.passMarks);
  const topicPerformance = calculateTopicPerformance(questions, examState.answers, exam.topics);

  // Prepare review items
  const reviewItems: ReviewItem[] = questions.map(question => {
    const userAnswer = examState.answers[question.id] || [];
    const correctAnswer = question.answer;

    // Check if answer is correct (exact match)
    const sortedUserAnswer = [...userAnswer].sort();
    const sortedCorrectAnswer = [...correctAnswer].sort();
    const isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);

    return {
      id: question.id,
      topic: question.topic,
      type: question.type,
      userAnswer,
      correctAnswer,
      isCorrect,
      explanation: question.explanation,
      scenario: question.scenario,
      stem: question.stem,
      options: question.options,
    };
  });

  // Filter review items based on active tab
  const filteredReviewItems = reviewItems.filter(item => {
    switch (activeTab) {
      case 'all': return true;
      case 'wrong': return !item.isCorrect && item.userAnswer.length > 0;
      case 'unanswered': return item.userAnswer.length === 0;
      case 'correct': return item.isCorrect;
      default: return true;
    }
  });

  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const timeTaken = examState.submittedAt && examState.startedAt
    ? Math.floor((examState.submittedAt - examState.startedAt) / 1000)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-indigo-600 mb-4">
            {exam.title}
          </h1>

          <div className="text-center text-gray-600 space-y-2">
            <p className="text-sm font-medium">{examState.name}</p>
            <p className="text-sm">Exam completed on {new Date(examState.submittedAt || Date.now()).toLocaleDateString()}</p>
            <p className="text-sm">Time taken: {formatTime(timeTaken)}</p>
          </div>
        </div>

        {/* Score Section */}
        <div className="mb-8 text-center">
          <div className={`text-5xl font-bold mb-4 ${status === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
            {score} / {exam.totalMarks}
          </div>

          <div className={`inline-block px-4 py-2 rounded-lg font-medium ${status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {status}
          </div>

          <p className="mt-3 text-gray-600 font-medium">{message}</p>
        </div>

        {/* Stats Section */}
        <div className="mb-8 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Answers Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Correct:</span>
                <span className="text-green-600 font-medium">{topicPerformance.reduce((sum, t) => sum + t.correct, 0)}/{exam.totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wrong:</span>
                <span className="text-red-600 font-medium">{reviewItems.filter(item => !item.isCorrect && item.userAnswer.length > 0).length}/{exam.totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unanswered:</span>
                <span className="text-amber-600 font-medium">{reviewItems.filter(item => item.userAnswer.length === 0).length}/{exam.totalQuestions}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Percentage</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Score:</span>
                <span className="font-medium text-gray-900">{Math.round((score / exam.totalMarks) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Passing:</span>
                <span className="font-medium text-gray-900">{Math.round((exam.passMarks / exam.totalMarks) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Topic Performance */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Topic-wise Performance</h2>
          <div className="space-y-3">
            {topicPerformance.map(topic => (
              <div key={topic.topicCode} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                <div className="w-1/3">
                  <h3 className="font-medium text-gray-900 text-sm">{topic.topicName}</h3>
                  <p className="text-xs text-gray-500">{topic.correct}/{topic.total} correct</p>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${topic.isWeak ? 'bg-red-500' : 'bg-green-500'} transition-all duration-500`}
                      style={{ width: `${topic.percentage}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-semibold w-10 text-right ${topic.isWeak ? 'text-red-600' : 'text-green-600'}`}>
                    {topic.percentage}%
                  </span>
                  {topic.isWeak && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-medium">
                      Weak
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-300">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'all' ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All ({reviewItems.length})
            </button>
            <button
              onClick={() => setActiveTab('wrong')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'wrong' ? 'text-red-600 border-b-2 border-red-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Wrong ({reviewItems.filter(item => !item.isCorrect && item.userAnswer.length > 0).length})
            </button>
            <button
              onClick={() => setActiveTab('unanswered')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'unanswered' ? 'text-amber-600 border-b-2 border-amber-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Unanswered ({reviewItems.filter(item => item.userAnswer.length === 0).length})
            </button>
            <button
              onClick={() => setActiveTab('correct')}
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'correct' ? 'text-green-600 border-b-2 border-green-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Correct ({reviewItems.filter(item => item.isCorrect).length})
            </button>
          </div>
        </div>

        {/* Review Content */}
        <div className="space-y-4">
          {filteredReviewItems.map(item => (
            <div key={item.id} className={`bg-white rounded-lg shadow-sm p-5 border-l-4 ${item.isCorrect ? 'border-green-500' : item.userAnswer.length === 0 ? 'border-amber-500' : 'border-red-500'}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-900">
                  Question {item.id}
                </h3>
                <div className="flex items-center space-x-2 text-sm">
                  {item.type === 'multi' && (
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium">
                      SELECT TWO
                    </span>
                  )}
                  <span className={`font-semibold ${item.isCorrect ? 'text-green-600' : item.userAnswer.length === 0 ? 'text-amber-600' : 'text-red-600'}`}>
                    {item.isCorrect ? 'Correct' : item.userAnswer.length === 0 ? 'Unanswered' : 'Wrong'}
                  </span>
                </div>
              </div>

              {item.scenario && (
                <div className="bg-gray-50 p-3 mb-3 rounded-lg border border-gray-100">
                  <p className="text-gray-700 text-sm leading-relaxed">{item.scenario}</p>
                </div>
              )}

              <p className="font-semibold text-gray-900 mb-3">{item.stem}</p>

              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map(option => {
                  const isUserSelected = item.userAnswer.includes(option);
                  const isCorrectOption = item.correctAnswer.includes(option);

                  let badge = null;
                  let cardStyle = "bg-gray-50 border-gray-200 text-gray-800";

                  if (isCorrectOption && isUserSelected) {
                    badge = <span className="text-xs text-green-700 font-semibold">✓ Correct</span>;
                    cardStyle = "bg-green-50 border-green-300 text-green-950 font-medium";
                  } else if (isCorrectOption && !isUserSelected) {
                    badge = <span className="text-xs text-emerald-700 font-semibold">✓ Correct Answer (Missed)</span>;
                    cardStyle = "bg-emerald-50/60 border-emerald-200 text-emerald-900 font-medium";
                  } else if (!isCorrectOption && isUserSelected) {
                    badge = <span className="text-xs text-red-700 font-semibold">✗ Your Answer (Incorrect)</span>;
                    cardStyle = "bg-red-50 border-red-300 text-red-950";
                  }

                  return (
                    <div key={option} className={`flex items-start justify-between space-x-3 p-3 rounded-lg border ${cardStyle}`}>
                      <div className="flex items-start space-x-3 flex-1">
                        <span className="font-bold text-sm w-5">{option}.</span>
                        <p className="text-sm leading-relaxed flex-1">{item.options[option]}</p>
                      </div>
                      {badge && <div className="ml-2 flex-shrink-0">{badge}</div>}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 bg-indigo-50/50 p-3 rounded-lg">
                <h4 className="font-semibold mb-1 text-sm text-indigo-900">Explanation</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{item.explanation}</p>
              </div>
            </div>
          ))}

          {filteredReviewItems.length === 0 && (
            <p className="text-center text-gray-500 py-8">No questions match the selected filter.</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={onRetake}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Retake Exam
          </button>

          <button
            onClick={() => window.print()}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}