import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
export default async function StudentTimetablePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'STUDENT' && session.role !== 'PARENT') redirect('/dashboard');
  const student = session.role === 'STUDENT'
    ? await db.student.findFirst({ where: { userId: session.userId, tenantId: session.tenantId }, select: { id: true, tenantId: true, gradeLevel: true } })
    : (await db.user.findFirst({ where: { id: session.userId, tenantId: session.tenantId }, select: { parentStudent: { select: { id: true, tenantId: true, gradeLevel: true } } } }))?.parentStudent ?? null;
  const entries = student?.tenantId === session.tenantId ? await db.timetable.findMany({ where: { tenantId: session.tenantId, gradeLevel: student.gradeLevel }, include: { teacher: { select: { name: true } } }, orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }] }) : [];
  return <><h1 className="font-serif text-3xl font-semibold">Class timetable</h1><p className="mt-2 text-sm text-[#64736d]">{student ? `Grade ${student.gradeLevel}` : 'No student account is linked.'}</p><div className="mt-6 overflow-hidden rounded-xl border bg-white">{entries.length ? entries.map((entry) => <div key={entry.id} className="flex justify-between border-b p-4"><b>{entry.dayOfWeek} · {entry.period}</b><span>{entry.subject} · {entry.teacher?.name || 'Teacher TBA'}</span></div>) : <p className="p-6 text-sm text-[#64736d]">No timetable available.</p>}</div></>;
}
