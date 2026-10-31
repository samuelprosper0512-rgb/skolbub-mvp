import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';

function csvCell(value: string | number | Date | null) {
  let text = value instanceof Date ? value.toISOString() : value === null ? '' : String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function csv(rows: (string | number | Date | null)[][]) {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export async function GET(_request: Request, { params }: { params: { type: string } }) {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  if (!tenant || tenant.tenantId !== session.tenantId) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });

  let content: string;
  if (params.type === 'students') {
    const students = await db.student.findMany({
      where: { tenantId: session.tenantId },
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
      select: { name: true, studentNumber: true, gradeLevel: true },
    });
    content = csv([['Name', 'Student number', 'Grade level'], ...students.map((student) => [student.name, student.studentNumber, student.gradeLevel])]);
  } else if (params.type === 'fees') {
    const fees = await db.fee.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { createdAt: 'desc' },
      select: { title: true, amount: true, status: true, createdAt: true, student: { select: { name: true, studentNumber: true } } },
    });
    content = csv([['Student', 'Student number', 'Fee', 'Amount', 'Status', 'Created at'], ...fees.map((fee) => [fee.student.name, fee.student.studentNumber, fee.title, fee.amount, fee.status, fee.createdAt])]);
  } else if (params.type === 'results') {
    const results = await db.result.findMany({
      where: { tenantId: session.tenantId },
      orderBy: [{ term: 'asc' }, { subject: 'asc' }],
      select: { term: true, subject: true, caScore: true, examScore: true, totalScore: true, grade: true, student: { select: { name: true, studentNumber: true } } },
    });
    content = csv([['Student', 'Student number', 'Term', 'Subject', 'CA score', 'Exam score', 'Total score', 'Grade'], ...results.map((result) => [result.student.name, result.student.studentNumber, result.term, result.subject, result.caScore, result.examScore, result.totalScore, result.grade])]);
  } else {
    return NextResponse.json({ error: 'Export type must be students, fees, or results.' }, { status: 400 });
  }

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${params.type}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
