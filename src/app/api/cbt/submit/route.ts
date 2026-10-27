import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

const VALID_ANSWERS = new Set(['A', 'B', 'C', 'D']);

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Student access required.' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const examId = typeof body.examId === 'string' ? body.examId.trim() : '';
  const answers = body.answers;
  if (!examId || !answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return NextResponse.json({ error: 'An exam ID and answers are required.' }, { status: 400 });
  }

  const student = await db.student.findFirst({
    where: { userId: session.userId, tenantId: session.tenantId },
    select: { id: true, gradeLevel: true },
  });
  if (!student) return NextResponse.json({ error: 'Your student account is not linked to a school record.' }, { status: 404 });

  const exam = await db.cBTExam.findFirst({
    where: { id: examId, tenantId: session.tenantId, gradeLevel: student.gradeLevel },
    select: {
      id: true,
      questions: { select: { id: true, correctAnswer: true } },
      examResults: {
        where: { tenantId: session.tenantId, studentId: student.id },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!exam) return NextResponse.json({ error: 'Exam not found for your grade level.' }, { status: 404 });
  if (exam.questions.length === 0) return NextResponse.json({ error: 'This exam has no questions.' }, { status: 400 });
  if (exam.examResults.length > 0) return NextResponse.json({ error: 'You have already submitted this exam.' }, { status: 409 });

  const submittedAnswers = answers as Record<string, unknown>;
  const questionIds = new Set(exam.questions.map((question) => question.id));
  if (Object.entries(submittedAnswers).some(([questionId, answer]) => !questionIds.has(questionId) || typeof answer !== 'string' || !VALID_ANSWERS.has(answer))) {
    return NextResponse.json({ error: 'One or more submitted answers are invalid.' }, { status: 400 });
  }

  const score = exam.questions.reduce(
    (total, question) => total + (submittedAnswers[question.id] === question.correctAnswer ? 1 : 0),
    0,
  );

  try {
    const result = await db.examResult.create({
      data: {
        tenantId: session.tenantId,
        examId: exam.id,
        studentId: student.id,
        score,
        totalQuestions: exam.questions.length,
      },
      select: { score: true, totalQuestions: true },
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'You have already submitted this exam.' }, { status: 409 });
    }
    console.error('Submit CBT exam failed:', error);
    return NextResponse.json({ error: 'Unable to save your exam result.' }, { status: 500 });
  }
}
