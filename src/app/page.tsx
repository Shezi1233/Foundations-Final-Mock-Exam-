import ExamApp from '@/components/ExamApp';
import { loadExam, loadAllQuestions } from '@/lib/content';

export default async function Home() {
  const exam = await loadExam();
  const questions = await loadAllQuestions();

  return (
    <main>
      <ExamApp initialExam={exam} initialQuestions={questions} />
    </main>
  );
}