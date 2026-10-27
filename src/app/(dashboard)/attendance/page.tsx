import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import AttendanceForm from './attendance-form';

export default async function AttendancePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN' && session.role !== 'TEACHER') redirect('/dashboard');

  const today = new Date().toISOString().slice(0, 10);
  const date = new Date(`${today}T00:00:00.000Z`);
  const [students, records] = await Promise.all([
    db.student.findMany({
      where: { tenantId: session.tenantId },
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, studentNumber: true, gradeLevel: true },
    }),
    db.attendance.findMany({
      where: { tenantId: session.tenantId, date },
      select: { studentId: true, status: true },
    }),
  ]);
  const attendanceByStudent = new Map(records.map((record) => [record.studentId, record.status]));
  const attendanceStudents = students.map((student) => ({
    ...student,
    status: attendanceByStudent.get(student.id) ?? null,
  }));

  return (
    <>
      <div><p className="text-sm font-semibold text-[#1d765b]">Daily records</p><h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight">Attendance</h1><p className="mt-2 text-sm text-[#64736d]">Mark attendance for {new Date(`${today}T00:00:00.000Z`).toLocaleDateString()}.</p></div>
      <section className="mt-7 overflow-hidden rounded-xl border border-[#e1e8df] bg-white">
        <AttendanceForm date={today} students={attendanceStudents} />
      </section>
    </>
  );
}
