import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import ExamForm from './exam-form';

export default async function CBTPage() {
  const session = await requireAuth();
  const exams = await db.cBTExam.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ gradeLevel: 'asc' }, { title: 'asc' }],
  });

  return (
    <>
      <div><p className="text-sm font-semibold text-[#1d765b]">Computer-based testing</p><h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">CBT exams</h1><p className="mt-2 text-sm text-[#64736d]">Exams configured for your school.</p></div>
      <ExamForm />
      <div className="mt-7 overflow-hidden rounded-xl border border-[#e1e8df] bg-white">
        {exams.length === 0 ? <p className="px-5 py-12 text-center text-sm text-[#64736d]">No exams have been set up yet.</p> : <ul className="divide-y divide-[#edf0e9]">{exams.map((exam) => <li key={exam.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="font-semibold">{exam.title}</p><p className="mt-1 text-sm text-[#64736d]">{exam.subject} · {exam.gradeLevel}</p></div><span className="rounded-md bg-[#f2f6ec] px-2.5 py-1.5 text-xs font-semibold text-[#557542]">{exam.duration} min</span></li>)}</ul>}
      </div>
    </>
  );
}