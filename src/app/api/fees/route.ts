import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const fees = await db.fee.findMany({
    where: { tenantId: session.tenantId },
    include: { student: { select: { name: true, studentNumber: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ fees });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const studentId = typeof body.studentId === 'string' ? body.studentId.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const amount = typeof body.amount === 'number' || typeof body.amount === 'string'
    ? Number(body.amount)
    : Number.NaN;
  if (!studentId || !title || title.length > 120) {
    return NextResponse.json({ error: 'Select a student and enter a fee title.' }, { status: 400 });
  }
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be a positive whole number in naira.' }, { status: 400 });
  }

  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!student) return NextResponse.json({ error: 'Student not found in your school.' }, { status: 404 });

  const fee = await db.fee.create({
    data: {
      tenantId: session.tenantId,
      studentId: student.id,
      title,
      amount,
      status: 'unpaid',
    },
    include: { student: { select: { name: true, studentNumber: true } } },
  });
  return NextResponse.json({ fee }, { status: 201 });
}