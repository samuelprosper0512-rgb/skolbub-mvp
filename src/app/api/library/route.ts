import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantForSession } from '@/lib/tenant';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  if (session.role !== 'ADMIN' && session.role !== 'TEACHER') return NextResponse.json({ error: 'Staff access required.' }, { status: 403 });
  const [books, students, loans] = await Promise.all([
    db.book.findMany({ where: { tenantId: session.tenantId }, orderBy: { title: 'asc' } }),
    db.student.findMany({ where: { tenantId: session.tenantId }, select: { id: true, name: true, studentNumber: true }, orderBy: { name: 'asc' } }),
    db.bookLoan.findMany({ where: { tenantId: session.tenantId, returnedAt: null }, include: { book: { select: { title: true } }, student: { select: { name: true, studentNumber: true } } }, orderBy: { dueDate: 'asc' } }),
  ]);
  return NextResponse.json({ books, students, loans });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  const action = body.action;
  if (action === 'addBook') {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const author = typeof body.author === 'string' ? body.author.trim() : '';
    const isbn = typeof body.isbn === 'string' ? body.isbn.trim() : '';
    if (!title || !author || !isbn || title.length > 200 || author.length > 150 || isbn.length > 30) return NextResponse.json({ error: 'Enter a title, author, and ISBN.' }, { status: 400 });
    try { return NextResponse.json({ book: await db.book.create({ data: { tenantId: session.tenantId, title, author, isbn } }) }, { status: 201 }); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return NextResponse.json({ error: 'A book with this ISBN already exists.' }, { status: 409 });
      console.error('Add book failed:', error);
      return NextResponse.json({ error: 'Unable to add this book.' }, { status: 500 });
    }
  }
  if (action === 'loan') {
    const bookId = typeof body.bookId === 'string' ? body.bookId : '';
    const studentId = typeof body.studentId === 'string' ? body.studentId : '';
    const dueDateText = typeof body.dueDate === 'string' ? body.dueDate : '';
    const dueDate = new Date(`${dueDateText}T00:00:00.000Z`);
    if (!bookId || !studentId || !/^\d{4}-\d{2}-\d{2}$/.test(dueDateText) || Number.isNaN(dueDate.getTime())) return NextResponse.json({ error: 'Choose a book, student, and valid due date.' }, { status: 400 });
    const [book, student] = await Promise.all([
      db.book.findFirst({ where: { id: bookId, tenantId: session.tenantId, status: 'available' }, select: { id: true } }),
      db.student.findFirst({ where: { id: studentId, tenantId: session.tenantId }, select: { id: true } }),
    ]);
    if (!book || !student) return NextResponse.json({ error: 'Book is unavailable or student not found.' }, { status: 400 });
    try {
      const loan = await db.$transaction(async (tx) => {
        const reserved = await tx.book.updateMany({
          where: { id: bookId, tenantId: session.tenantId, status: 'available' },
          data: { status: 'borrowed' },
        });
        if (reserved.count !== 1) throw new Error('BOOK_UNAVAILABLE');
        return tx.bookLoan.create({ data: { tenantId: session.tenantId, bookId, studentId, dueDate } });
      });
      return NextResponse.json({ loan }, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.message === 'BOOK_UNAVAILABLE') return NextResponse.json({ error: 'This book has already been loaned.' }, { status: 409 });
      console.error('Create book loan failed:', error);
      return NextResponse.json({ error: 'Unable to loan this book.' }, { status: 500 });
    }
  }
  if (action === 'return') {
    const loanId = typeof body.loanId === 'string' ? body.loanId : '';
    const loan = await db.bookLoan.findFirst({ where: { id: loanId, tenantId: session.tenantId, returnedAt: null }, select: { id: true, bookId: true } });
    if (!loan) return NextResponse.json({ error: 'Active loan not found.' }, { status: 404 });
    await db.$transaction([
      db.bookLoan.update({ where: { id: loan.id }, data: { returnedAt: new Date() } }),
      db.book.update({ where: { tenantId_id: { tenantId: session.tenantId, id: loan.bookId } }, data: { status: 'available' } }),
    ]);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Unknown library action.' }, { status: 400 });
}
