import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Student access required.' }, { status: 403 });

  const student = await db.student.findFirst({
    where: { userId: session.userId, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!student) {
    return NextResponse.json({ error: 'Your student account is not linked to a school record.' }, { status: 404 });
  }

  const fees = await db.fee.findMany({
    where: { tenantId: session.tenantId, studentId: student.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, amount: true, status: true, createdAt: true },
  });
  return NextResponse.json({ fees });
}