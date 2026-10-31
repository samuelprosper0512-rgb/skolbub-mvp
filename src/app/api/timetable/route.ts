import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantForSession } from '@/lib/tenant';

const DAYS = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  if (!['ADMIN', 'TEACHER'].includes(session.role)) return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  const [entries, staff, grades] = await Promise.all([
    db.timetable.findMany({ where: { tenantId: session.tenantId }, include: { teacher: { select: { name: true } } }, orderBy: [{ gradeLevel: 'asc' }, { dayOfWeek: 'asc' }, { period: 'asc' }] }),
    db.staff.findMany({ where: { tenantId: session.tenantId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.student.findMany({ where: { tenantId: session.tenantId }, distinct: ['gradeLevel'], select: { gradeLevel: true }, orderBy: { gradeLevel: 'asc' } }),
  ]);
  return NextResponse.json({ entries, staff, grades: grades.map((grade) => grade.gradeLevel) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  const gradeLevel = typeof body.gradeLevel === 'string' ? body.gradeLevel.trim() : '';
  const dayOfWeek = typeof body.dayOfWeek === 'string' ? body.dayOfWeek : '';
  const period = typeof body.period === 'string' ? body.period.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const teacherId = typeof body.teacherId === 'string' && body.teacherId ? body.teacherId : null;
  if (!gradeLevel || gradeLevel.length > 50 || !DAYS.has(dayOfWeek) || !period || period.length > 30 || !subject || subject.length > 100) {
    return NextResponse.json({ error: 'Enter a valid grade, day, period, and subject.' }, { status: 400 });
  }
  if (teacherId && !await db.staff.findFirst({ where: { id: teacherId, tenantId: session.tenantId }, select: { id: true } })) {
    return NextResponse.json({ error: 'Teacher not found in your school.' }, { status: 400 });
  }
  try {
    const entry = await db.timetable.upsert({
      where: { tenantId_gradeLevel_dayOfWeek_period: { tenantId: session.tenantId, gradeLevel, dayOfWeek, period } },
      create: { tenantId: session.tenantId, gradeLevel, dayOfWeek, period, subject, teacherId },
      update: { subject, teacherId },
    });
    return NextResponse.json({ entry }, { status: 200 });
  } catch (error) {
    console.error('Save timetable entry failed:', error);
    return NextResponse.json({ error: 'Unable to save timetable entry.' }, { status: 500 });
  }
}
