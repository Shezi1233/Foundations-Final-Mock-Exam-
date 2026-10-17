import { loadExam, loadAllQuestions } from '@/lib/content';
import { loadExam as loadPCAOFExam, loadAllQuestions as loadPCAOFAllQuestions } from '@/lib/content-pcao-f';
import HomeClient from './HomeClient';

export default async function Home() {
  const foundationExam = await loadExam();
  const foundationQuestions = await loadAllQuestions();

  const pcaofExam = await loadPCAOFExam();
  const pcaofQuestions = await loadPCAOFAllQuestions();

  return (
    <HomeClient
      foundationExam={foundationExam}
      foundationQuestions={foundationQuestions}
      pcaofExam={pcaofExam}
      pcaofQuestions={pcaofQuestions}
    />
  );
}