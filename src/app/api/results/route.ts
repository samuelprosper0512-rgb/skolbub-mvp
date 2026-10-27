import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

function gradeFor(totalScore: number) {
  if (totalScore >= 70) return 'A';
  if (totalScore >= 60) return 'B';
  if (totalScore >= 50) return 'C';
  if (totalScore >= 40) return 'D';
  return 'F';
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Student access required.' }, { status: 403 });

  const student = await db.student.findFirst({
    where: { userId: session.userId, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!student) return NextResponse.json({ error: 'Your student account is not linked to a school record.' }, { status: 404 });

  const results = await db.result.findMany({
    where: { tenantId: session.tenantId, studentId: student.id },
    orderBy: [{ term: 'asc' }, { subject: 'asc' }],
    select: { id: true, subject: true, term: true, caScore: true, examScore: true, totalScore: true, grade: true, createdAt: true },
  });
  return NextResponse.json({ results });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'ADMIN' && session.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Admin or teacher access required.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const studentId = typeof body.studentId === 'string' ? body.studentId.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const term = typeof body.term === 'string' ? body.term.trim() : '';
  const caScore = typeof body.caScore === 'number' || typeof body.caScore === 'string' ? Number(body.caScore) : Number.NaN;
  const examScore = typeof body.examScore === 'number' || typeof body.examScore === 'string' ? Number(body.examScore) : Number.NaN;

  if (!studentId || !subject || !term || subject.length > 100 || term.length > 50) {
    return NextResponse.json({ error: 'Select a student and enter a subject and term.' }, { status: 400 });
  }
  if (!Number.isInteger(caScore) || !Number.isInteger(examScore) || caScore < 0 || examScore < 0) {
    return NextResponse.json({ error: 'CA and exam scores must be non-negative whole numbers.' }, { status: 400 });
  }

  const totalScore = caScore + examScore;
  if (totalScore > 100) {
    return NextResponse.json({ error: 'The combined CA and exam score cannot exceed 100.' }, { status: 400 });
  }

  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!student) return NextResponse.json({ error: 'Student not found in your school.' }, { status: 404 });

  const result = await db.result.upsert({
    where: {
      tenantId_studentId_subject_term: {
        tenantId: session.tenantId,
        studentId: student.id,
        subject,
        term,
      },
    },
    create: {
      tenantId: session.tenantId,
      studentId: student.id,
      subject,
      term,
      caScore,
      examScore,
      totalScore,
      grade: gradeFor(totalScore),
    },
    update: { caScore, examScore, totalScore, grade: gradeFor(totalScore) },
    select: { id: true, studentId: true, subject: true, term: true, caScore: true, examScore: true, totalScore: true, grade: true },
  });

  return NextResponse.json({ result }, { status: 200 });
}