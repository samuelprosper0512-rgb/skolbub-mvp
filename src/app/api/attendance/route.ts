import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_STATUSES = new Set(['present', 'absent', 'late']);

function isDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function canManageAttendance(role: string) {
  return role === 'ADMIN' || role === 'TEACHER';
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!canManageAttendance(session.role)) return NextResponse.json({ error: 'Admin or teacher access required.' }, { status: 403 });

  const requestedDate = request.nextUrl.searchParams.get('date');
  const dateKey = requestedDate ?? new Date().toISOString().slice(0, 10);
  if (!isDateString(dateKey)) return NextResponse.json({ error: 'A valid date is required.' }, { status: 400 });
  const date = new Date(`${dateKey}T00:00:00.000Z`);

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
  return NextResponse.json({
    date: dateKey,
    students: students.map((student) => ({ ...student, status: attendanceByStudent.get(student.id) ?? null })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!canManageAttendance(session.role)) return NextResponse.json({ error: 'Admin or teacher access required.' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const dateKey = body.date;
  const records = body.attendance;
  if (!isDateString(dateKey) || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: 'A valid date and at least one attendance record are required.' }, { status: 400 });
  }

  const submittedRecords: Array<{ studentId: string; status: string }> = [];
  const seenStudentIds = new Set<string>();
  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      return NextResponse.json({ error: 'Attendance records are invalid.' }, { status: 400 });
    }
    const item = record as Record<string, unknown>;
    const studentId = typeof item.studentId === 'string' ? item.studentId.trim() : '';
    const status = typeof item.status === 'string' ? item.status : '';
    if (!studentId || !VALID_STATUSES.has(status) || seenStudentIds.has(studentId)) {
      return NextResponse.json({ error: 'Attendance records contain an invalid or duplicate student status.' }, { status: 400 });
    }
    seenStudentIds.add(studentId);
    submittedRecords.push({ studentId, status });
  }

  const students = await db.student.findMany({
    where: { tenantId: session.tenantId, id: { in: submittedRecords.map((record) => record.studentId) } },
    select: { id: true },
  });
  if (students.length !== submittedRecords.length) {
    return NextResponse.json({ error: 'One or more students were not found in your school.' }, { status: 400 });
  }

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  try {
    await db.$transaction(
      submittedRecords.map(({ studentId, status }) =>
        db.attendance.upsert({
          where: {
            tenantId_studentId_date: { tenantId: session.tenantId, studentId, date },
          },
          create: { tenantId: session.tenantId, studentId, date, status },
          update: { status },
        }),
      ),
    );
    return NextResponse.json({ success: true, savedCount: submittedRecords.length });
  } catch (error) {
    console.error('Save attendance failed:', error);
    return NextResponse.json({ error: 'Unable to save attendance.' }, { status: 500 });
  }
}
