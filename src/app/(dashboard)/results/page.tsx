import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import ResultsForm from './results-form';
import AIComment from './ai-comment';
import ExportCsvButton from '../export-csv-button';

type ResultsPageProps = {
  searchParams: { studentId?: string };
};

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const session = await requireAuth();
  if (session.role === 'STUDENT') redirect('/portal/results');
  if (session.role !== 'ADMIN' && session.role !== 'TEACHER') redirect('/dashboard');

  const students = await db.student.findMany({
    where: { tenantId: session.tenantId },
    select: { id: true, name: true, studentNumber: true },
    orderBy: { name: 'asc' },
  });
  const selectedStudent = students.find((student) => student.id === searchParams.studentId) ?? students[0] ?? null;
  const results = selectedStudent
    ? await db.result.findMany({
        where: { tenantId: session.tenantId, studentId: selectedStudent.id },
        orderBy: [{ term: 'asc' }, { subject: 'asc' }],
      })
    : [];

  return (
    <>
      <div><p className="text-sm font-semibold text-[#1d765b]">Academic records</p><h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Results</h1><p className="mt-2 text-sm text-[#64736d]">Enter and review student assessment results.</p></div>
      <div className="mt-5"><ExportCsvButton type="results" /></div>
      {students.length === 0 ? <p className="mt-7 rounded-xl border border-dashed border-[#cbd6cc] bg-white/60 px-5 py-10 text-center text-sm text-[#64736d]">Add students before entering results.</p> : <>
        <ResultsForm students={students} selectedStudentId={selectedStudent?.id ?? ''} />
        {selectedStudent && <AIComment studentId={selectedStudent.id} grades={results.map((result) => ({ subject: result.subject, score: result.totalScore, grade: result.grade }))} />}
        <section className="mt-7 overflow-hidden rounded-xl border border-[#e1e8df] bg-white">
          <div className="border-b border-[#edf0e9] px-5 py-4"><h2 className="font-bold">{selectedStudent?.name} · Results</h2><p className="mt-1 text-xs text-[#87938c]">{selectedStudent?.studentNumber} · {results.length} {results.length === 1 ? 'result' : 'results'}</p></div>
          {results.length === 0 ? <p className="px-5 py-12 text-center text-sm text-[#64736d]">No results entered for this student yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#718078]"><tr><th className="px-5 py-3.5 font-semibold">Subject</th><th className="px-5 py-3.5 font-semibold">Term</th><th className="px-5 py-3.5 font-semibold">CA</th><th className="px-5 py-3.5 font-semibold">Exam</th><th className="px-5 py-3.5 font-semibold">Total</th><th className="px-5 py-3.5 font-semibold">Grade</th></tr></thead><tbody className="divide-y divide-[#edf0e9]">{results.map((result) => <tr key={result.id}><td className="px-5 py-4 font-semibold">{result.subject}</td><td className="px-5 py-4 text-[#64736d]">{result.term}</td><td className="px-5 py-4">{result.caScore}</td><td className="px-5 py-4">{result.examScore}</td><td className="px-5 py-4 font-semibold">{result.totalScore}</td><td className="px-5 py-4"><span className="rounded-md bg-[#edf6ee] px-2.5 py-1.5 text-xs font-bold text-[#1d765b]">{result.grade}</span></td></tr>)}</tbody></table></div>}
        </section>
      </>}
    </>
  );
}