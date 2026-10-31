import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantForSession } from '@/lib/tenant';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  if (session.role !== 'ADMIN' && session.role !== 'TEACHER') return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  const [logs, students] = await Promise.all([
    db.behaviorLog.findMany({ where: { tenantId: session.tenantId }, include: { student: { select: { name: true, studentNumber: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }),
    db.student.findMany({ where: { tenantId: session.tenantId }, select: { id: true, name: true, studentNumber: true }, orderBy: { name: 'asc' } }),
  ]);
  return NextResponse.json({ logs, students });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  if (session.role !== 'ADMIN' && session.role !== 'TEACHER') return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  const studentId = typeof body.studentId === 'string' ? body.studentId : '';
  const type = body.type;
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const points = Number(body.points);
  if (!studentId || (type !== 'positive' && type !== 'negative') || !description || description.length > 2000 || !Number.isInteger(points) || points < 0 || points > 100) return NextResponse.json({ error: 'Enter a student, valid behavior type, description, and points from 0 to 100.' }, { status: 400 });
  const student = await db.student.findFirst({ where: { id: studentId, tenantId: session.tenantId }, select: { id: true } });
  if (!student) return NextResponse.json({ error: 'Student not found in your school.' }, { status: 404 });
  const log = await db.behaviorLog.create({ data: { tenantId: session.tenantId, studentId, type, description, points: type === 'negative' ? -points : points } });
  return NextResponse.json({ log }, { status: 201 });
}
