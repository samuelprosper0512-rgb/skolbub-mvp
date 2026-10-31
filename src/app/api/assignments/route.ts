import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';

export async function GET() {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!tenant || tenant.tenantId !== session.tenantId) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });

  if (session.role === 'STUDENT') {
    const student = await db.student.findFirst({
      where: { userId: session.userId, tenantId: session.tenantId },
      select: { id: true, gradeLevel: true },
    });
    if (!student) return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
    const assignments = await db.assignment.findMany({
      where: { tenantId: session.tenantId, gradeLevel: student.gradeLevel },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true, subject: true, gradeLevel: true, title: true, description: true, dueDate: true,
        submissions: {
          where: { tenantId: session.tenantId, studentId: student.id },
          select: { id: true, content: true, grade: true, submittedAt: true },
        },
      },
    });
    return NextResponse.json({ assignments });
  }
  if (session.role !== 'ADMIN' && session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Teacher access required.' }, { status: 403 });
  }

  const assignments = await db.assignment.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { dueDate: 'asc' },
    select: { id: true, subject: true, gradeLevel: true, title: true, description: true, dueDate: true, createdAt: true },
  });
  return NextResponse.json({ assignments });
}

export async function POST(request: NextRequest) {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'ADMIN' && session.role !== 'TEACHER') return NextResponse.json({ error: 'Teacher access required.' }, { status: 403 });
  if (!tenant || tenant.tenantId !== session.tenantId) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const gradeLevel = typeof body.gradeLevel === 'string' ? body.gradeLevel.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const dueDate = typeof body.dueDate === 'string' ? new Date(body.dueDate) : new Date(Number.NaN);
  if (!subject || !gradeLevel || !title || !description || !Number.isFinite(dueDate.getTime()) || title.length > 150 || description.length > 10000) {
    return NextResponse.json({ error: 'Enter valid assignment details and a due date.' }, { status: 400 });
  }

  const assignment = await db.assignment.create({
    data: { tenantId: session.tenantId, subject, gradeLevel, title, description, dueDate },
    select: { id: true, subject: true, gradeLevel: true, title: true, description: true, dueDate: true },
  });
  return NextResponse.json({ assignment }, { status: 201 });
}
