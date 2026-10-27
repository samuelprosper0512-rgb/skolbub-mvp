import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

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

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const studentNumber = typeof body.studentNumber === 'string' ? body.studentNumber.trim() : '';
  const gradeLevel = typeof body.gradeLevel === 'string' ? body.gradeLevel.trim() : '';
  if (!name || !studentNumber || !gradeLevel || name.length > 100 || studentNumber.length > 50 || gradeLevel.length > 50) {
    return NextResponse.json({ error: 'Enter a name, student number, and grade level within the allowed lengths.' }, { status: 400 });
  }

  try {
    const student = await db.student.create({
      data: { tenantId: session.tenantId, name, studentNumber, gradeLevel },
      select: { id: true, name: true, studentNumber: true, gradeLevel: true },
    });
    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'That student number is already in use at this school.' }, { status: 409 });
    }
    console.error('Create student failed:', error);
    return NextResponse.json({ error: 'Unable to add this student.' }, { status: 500 });
  }
}