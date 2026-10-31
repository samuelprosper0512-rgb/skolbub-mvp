import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  if (!tenant || tenant.tenantId !== session.tenantId) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const gradeLevel = typeof body.gradeLevel === 'string' ? body.gradeLevel.trim() : '';
  const duration = typeof body.duration === 'number' || typeof body.duration === 'string'
    ? Number(body.duration)
    : Number.NaN;
  if (!title || !subject || !gradeLevel || title.length > 100 || subject.length > 100 || gradeLevel.length > 50) {
    return NextResponse.json({ error: 'Enter a title, subject, and grade level within the allowed lengths.' }, { status: 400 });
  }
  if (!Number.isInteger(duration) || duration < 1 || duration > 600) {
    return NextResponse.json({ error: 'Duration must be a whole number between 1 and 600 minutes.' }, { status: 400 });
  }

  try {
    const exam = await db.$transaction(async (transaction) => {
      const createdExam = await transaction.cBTExam.create({
        data: { tenantId: session.tenantId, title, subject, gradeLevel, duration },
        select: { id: true, title: true, subject: true, gradeLevel: true, duration: true },
      });
      const students = await transaction.student.findMany({
        where: { tenantId: session.tenantId, gradeLevel, userId: { not: null } },
        select: { userId: true },
      });
      if (students.length) {
        await transaction.notification.createMany({
          data: students.flatMap(({ userId }) => userId ? [{
            tenantId: session.tenantId,
            userId,
            title: 'New exam available',
            message: `${title} in ${subject} is available for your class.`,
          }] : []),
        });
      }
      return createdExam;
    });
    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error('Create CBT exam failed:', error);
    return NextResponse.json({ error: 'Unable to create this exam.' }, { status: 500 });
  }
}