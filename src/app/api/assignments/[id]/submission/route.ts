import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Student access required.' }, { status: 403 });
  if (!tenant || tenant.tenantId !== session.tenantId) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content || content.length > 20000) return NextResponse.json({ error: 'Enter an answer of up to 20,000 characters.' }, { status: 400 });

  const student = await db.student.findFirst({
    where: { userId: session.userId, tenantId: session.tenantId },
    select: { id: true, gradeLevel: true },
  });
  if (!student) return NextResponse.json({ error: 'Student record not found.' }, { status: 404 });
  const assignment = await db.assignment.findFirst({
    where: { id: params.id, tenantId: session.tenantId, gradeLevel: student.gradeLevel },
    select: { id: true },
  });
  if (!assignment) return NextResponse.json({ error: 'Assignment not found for your class.' }, { status: 404 });

  const submission = await db.submission.upsert({
    where: { tenantId_assignmentId_studentId: { tenantId: session.tenantId, assignmentId: assignment.id, studentId: student.id } },
    create: { tenantId: session.tenantId, assignmentId: assignment.id, studentId: student.id, content },
    update: { content, submittedAt: new Date() },
    select: { id: true, content: true, submittedAt: true },
  });
  return NextResponse.json({ submission }, { status: 200 });
}
