import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantForSession } from '@/lib/tenant';

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
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
  const grades = body.grades;
  if (!studentId || !Array.isArray(grades) || grades.length < 1 || grades.length > 30) {
    return NextResponse.json({ error: 'Student and grade details are required.' }, { status: 400 });
  }
  const normalizedGrades = grades.filter((grade): grade is Record<string, unknown> =>
    Boolean(grade) && typeof grade === 'object' && !Array.isArray(grade),
  ).map((grade) => ({
    subject: typeof grade.subject === 'string' ? grade.subject.trim().slice(0, 100) : '',
    score: typeof grade.score === 'number' && Number.isFinite(grade.score) ? grade.score : null,
    grade: typeof grade.grade === 'string' ? grade.grade.trim().slice(0, 10) : '',
  }));
  if (normalizedGrades.length !== grades.length || normalizedGrades.some((grade) => !grade.subject || grade.score === null)) {
    return NextResponse.json({ error: 'Grade details are invalid.' }, { status: 400 });
  }
  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { name: true },
  });
  if (!student) return NextResponse.json({ error: 'Student not found in your school.' }, { status: 404 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI comment generation is not configured.' }, { status: 503 });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Write a supportive, professional school report-card comment in exactly two sentences. Use only the supplied grade information; do not invent facts.' },
          { role: 'user', content: JSON.stringify({ studentName: student.name, grades: normalizedGrades }) },
        ],
        max_tokens: 120,
        temperature: 0.5,
      }),
      cache: 'no-store',
    });
    const result = await response.json() as OpenAIResponse;
    const comment = result.choices?.[0]?.message?.content?.trim();
    if (!response.ok || !comment) {
      console.error('OpenAI comment generation failed:', result.error?.message || response.statusText);
      return NextResponse.json({ error: 'Unable to generate a comment right now.' }, { status: 502 });
    }
    return NextResponse.json({ comment });
  } catch (error) {
    console.error('OpenAI comment request failed:', error);
    return NextResponse.json({ error: 'Unable to connect to the AI service.' }, { status: 502 });
  }
}
