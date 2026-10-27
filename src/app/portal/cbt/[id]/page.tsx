import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import ExamTaking from './exam-taking';

export default async function PortalCBTExamPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'STUDENT') redirect('/dashboard');

  const student = await db.student.findFirst({
    where: { userId: session.userId, tenantId: session.tenantId },
    select: { id: true, gradeLevel: true },
  });
  if (!student) notFound();

  const exam = await db.cBTExam.findFirst({
    where: { id: params.id, tenantId: session.tenantId, gradeLevel: student.gradeLevel },
    select: {
      id: true,
      title: true,
      subject: true,
      gradeLevel: true,
      duration: true,
      questions: {
        orderBy: { id: 'asc' },
        select: {
          id: true,
          questionText: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
        },
      },
      examResults: {
        where: { tenantId: session.tenantId, studentId: student.id },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!exam || exam.questions.length === 0) notFound();
  if (exam.examResults.length > 0) redirect('/portal/cbt');

  const { examResults: _examResults, ...availableExam } = exam;

  return <ExamTaking exam={availableExam} />;
}
