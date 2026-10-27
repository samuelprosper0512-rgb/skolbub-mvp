import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function PortalCBTPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'STUDENT') redirect('/dashboard');

  const student = await db.student.findFirst({
    where: { userId: session.userId, tenantId: session.tenantId },
    select: { id: true, gradeLevel: true },
  });
  if (!student) {
    return (
      <section className="mt-7 rounded-xl border border-[#e1e8df] bg-white px-5 py-10 text-center">
        <p className="text-sm text-[#64736d]">Your student login is not linked to a school record. Please contact your school administrator.</p>
      </section>
    );
  }

  const exams = await db.cBTExam.findMany({
    where: { tenantId: session.tenantId, gradeLevel: student.gradeLevel },
    orderBy: [{ title: 'asc' }],
    select: {
      id: true,
      title: true,
      subject: true,
      gradeLevel: true,
      duration: true,
      _count: { select: { questions: true } },
      examResults: {
        where: { tenantId: session.tenantId, studentId: student.id },
        select: { score: true, totalQuestions: true },
        take: 1,
      },
    },
  });

  return (
    <>
      <div>
        <p className="text-sm font-semibold text-[#1d765b]">Student portal · {student.gradeLevel}</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">My exams</h1>
        <p className="mt-2 text-sm text-[#64736d]">Exams available for your grade level.</p>
      </div>
      <section className="mt-7 overflow-hidden rounded-xl border border-[#e1e8df] bg-white">
        {exams.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[#64736d]">There are no exams available for your grade level right now.</p>
        ) : (
          <ul className="divide-y divide-[#edf0e9]">
            {exams.map((exam) => {
              const result = exam.examResults[0];
              return (
                <li key={exam.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
                  <div>
                    <p className="font-semibold">{exam.title}</p>
                    <p className="mt-1 text-sm text-[#64736d]">{exam.subject} · {exam._count.questions} questions · {exam.duration} minutes</p>
                  </div>
                  {result ? (
                    <span className="rounded-lg bg-[#edf6ee] px-3 py-2 text-sm font-bold text-[#1d765b]">
                      Score: {result.score} / {result.totalQuestions}
                    </span>
                  ) : exam._count.questions === 0 ? (
                    <span className="text-sm text-[#64736d]">Questions not available yet</span>
                  ) : (
                    <Link href={`/portal/cbt/${exam.id}`} className="rounded-lg bg-[#1d765b] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#155e48]">
                      Start Exam
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
