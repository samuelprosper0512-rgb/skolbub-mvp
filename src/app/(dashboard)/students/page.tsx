import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import StudentForm from './student-form';
import ExportCsvButton from '../export-csv-button';

export default async function StudentsPage() {
  const session = await requireAuth();
  const students = await db.student.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#1d765b]">School records</p><h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Students</h1><p className="mt-2 text-sm text-[#64736d]">{students.length} {students.length === 1 ? 'student' : 'students'} in your school.</p></div><ExportCsvButton type="students" /></div>
      <StudentForm />
      <div className="mt-7 overflow-hidden rounded-xl border border-[#e1e8df] bg-white">
        {students.length === 0 ? <p className="px-5 py-12 text-center text-sm text-[#64736d]">No students have been added yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#718078]"><tr><th className="px-5 py-3.5 font-semibold">Student</th><th className="px-5 py-3.5 font-semibold">Student number</th><th className="px-5 py-3.5 font-semibold">Grade level</th></tr></thead><tbody className="divide-y divide-[#edf0e9]">{students.map((student) => <tr key={student.id}><td className="px-5 py-4 font-semibold">{student.name}</td><td className="px-5 py-4 text-[#64736d]">{student.studentNumber}</td><td className="px-5 py-4 text-[#64736d]">{student.gradeLevel}</td></tr>)}</tbody></table></div>
        )}
      </div>
    </>
  );
}