import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

const RECENT_RECORD_LIMIT = 30;

export default async function PortalAttendancePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'STUDENT' && session.role !== 'PARENT') redirect('/dashboard');

  const student = session.role === 'STUDENT'
    ? await db.student.findFirst({
        where: { userId: session.userId, tenantId: session.tenantId },
        select: { id: true, tenantId: true, name: true, studentNumber: true },
      })
    : (await db.user.findFirst({
        where: { id: session.userId, tenantId: session.tenantId, role: 'PARENT' },
        select: { parentStudent: { select: { id: true, tenantId: true, name: true, studentNumber: true } } },
      }))?.parentStudent ?? null;

  if (!student || student.tenantId !== session.tenantId) {
    return <section className="rounded-xl border border-[#e1e8df] bg-white px-5 py-10 text-center"><p className="text-sm text-[#64736d]">No student record is linked to your account. Please contact your school.</p></section>;
  }

  const records = await db.attendance.findMany({
    where: { tenantId: session.tenantId, studentId: student.id },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, date: true, status: true },
  });
  const daysPresent = records.filter((record) => record.status === 'present').length;
  const daysAbsent = records.filter((record) => record.status === 'absent').length;
  const attendancePercentage = records.length === 0 ? 0 : Math.round((daysPresent / records.length) * 100);
  const recentRecords = records.slice(0, RECENT_RECORD_LIMIT);

  return (
    <>
      <div><p className="text-sm font-semibold text-[#1d765b]">{student.name} · {student.studentNumber}</p><h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Attendance history</h1><p className="mt-2 text-sm text-[#64736d]">Review attendance records for this student.</p></div>
      <section aria-label="Attendance summary" className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total days" value={records.length} />
        <SummaryCard label="Days present" value={daysPresent} />
        <SummaryCard label="Days absent" value={daysAbsent} />
        <SummaryCard label="Attendance" value={`${attendancePercentage}%`} />
      </section>
      <section className="mt-7 overflow-hidden rounded-xl border border-[#e1e8df] bg-white">
        <h2 className="px-5 py-4 font-bold">Recent attendance</h2>
        {recentRecords.length === 0 ? <p className="border-t border-[#edf0e9] px-5 py-10 text-center text-sm text-[#64736d]">No attendance records are available yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="bg-[#f8faf6] text-xs uppercase tracking-wide text-[#718078]"><tr><th className="px-5 py-3.5 font-semibold">Date</th><th className="px-5 py-3.5 font-semibold">Status</th></tr></thead><tbody className="divide-y divide-[#edf0e9]">{recentRecords.map((record) => <tr key={record.id}><td className="px-5 py-4 font-semibold">{record.date.toLocaleDateString()}</td><td className="px-5 py-4"><span className={`rounded-md px-2.5 py-1.5 text-xs font-semibold capitalize ${record.status === 'present' ? 'bg-[#edf6ee] text-[#1d765b]' : record.status === 'absent' ? 'bg-[#fff0ed] text-[#a6402d]' : 'bg-[#fff4df] text-[#8a6219]'}`}>{record.status}</span></td></tr>)}</tbody></table></div>
        )}
      </section>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-xl border border-[#e1e8df] bg-white p-5"><p className="text-sm font-semibold text-[#64736d]">{label}</p><p className="mt-4 text-3xl font-bold tracking-tight">{value}</p></div>;
}
