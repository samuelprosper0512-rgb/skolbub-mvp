import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantForSession } from '@/lib/tenant';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  if (session.role !== 'ADMIN' && session.role !== 'TEACHER') return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  const [students, records] = await Promise.all([
    db.student.findMany({ where: { tenantId: session.tenantId }, select: { id: true, name: true, studentNumber: true }, orderBy: { name: 'asc' } }),
    db.healthRecord.findMany({ where: { tenantId: session.tenantId }, include: { student: { select: { name: true, studentNumber: true } } }, orderBy: { updatedAt: 'desc' } }),
  ]);
  return NextResponse.json({ students, records });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  if (session.role !== 'ADMIN' && session.role !== 'TEACHER') return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  const studentId = typeof body.studentId === 'string' ? body.studentId : '';
  const values = {
    bloodGroup: typeof body.bloodGroup === 'string' ? body.bloodGroup.trim().slice(0, 20) : '',
    allergies: typeof body.allergies === 'string' ? body.allergies.trim().slice(0, 2000) : '',
    emergencyContact: typeof body.emergencyContact === 'string' ? body.emergencyContact.trim().slice(0, 200) : '',
    notes: typeof body.notes === 'string' ? body.notes.trim().slice(0, 5000) : '',
  };
  if (!studentId) return NextResponse.json({ error: 'Select a student.' }, { status: 400 });
  const student = await db.student.findFirst({ where: { id: studentId, tenantId: session.tenantId }, select: { id: true } });
  if (!student) return NextResponse.json({ error: 'Student not found in your school.' }, { status: 404 });
  const record = await db.healthRecord.upsert({
    where: { tenantId_studentId: { tenantId: session.tenantId, studentId } },
    create: { tenantId: session.tenantId, studentId, ...values },
    update: values,
  });
  return NextResponse.json({ record });
}
