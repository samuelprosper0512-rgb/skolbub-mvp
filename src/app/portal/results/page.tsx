import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import PrintButton from './print-button';

export default async function PortalResultsPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'STUDENT') redirect('/dashboard');

  const student = await db.student.findFirst({
    where: { userId: session.userId, tenantId: session.tenantId },
    select: { id: true, name: true, studentNumber: true },
  });
  const results = student ? await db.result.findMany({
    where: { tenantId: session.tenantId, studentId: student.id },
    orderBy: [{ term: 'asc' }, { subject: 'asc' }],
  }) : [];

  return (
    <>
      <div className="print-hidden mb-5 flex items-center justify-between gap-4"><p className="text-sm text-[#64736d]">Your academic results</p><PrintButton /></div>
      <section className="report-card rounded-xl border border-[#e1e8df] bg-white p-5 sm:p-8">
        <div className="border-b border-[#e1e8df] pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1d765b]">Student report card</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Results</h1>
          {student ? <p className="mt-2 text-sm text-[#64736d]">{student.name} · Student number {student.studentNumber}</p> : <p className="mt-2 text-sm text-[#64736d]">Your student login is not linked to a school record.</p>}
        </div>
        {!student ? <p className="py-10 text-center text-sm text-[#64736d]">Please contact your school administrator to link your student account.</p> : results.length === 0 ? <p className="py-10 text-center text-sm text-[#64736d]">No results are available yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#718078]"><tr><th className="px-4 py-3.5 font-semibold">Subject</th><th className="px-4 py-3.5 font-semibold">Term</th><th className="px-4 py-3.5 font-semibold">CA</th><th className="px-4 py-3.5 font-semibold">Exam</th><th className="px-4 py-3.5 font-semibold">Total</th><th className="px-4 py-3.5 font-semibold">Grade</th></tr></thead><tbody className="divide-y divide-[#edf0e9]">{results.map((result) => <tr key={result.id}><td className="px-4 py-4 font-semibold">{result.subject}</td><td className="px-4 py-4 text-[#64736d]">{result.term}</td><td className="px-4 py-4">{result.caScore}</td><td className="px-4 py-4">{result.examScore}</td><td className="px-4 py-4 font-semibold">{result.totalScore}</td><td className="px-4 py-4 font-bold">{result.grade}</td></tr>)}</tbody></table></div>}
      </section>
    </>
  );
}