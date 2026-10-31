import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';

export async function GET() {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'PARENT') return NextResponse.json({ error: 'Parent access required.' }, { status: 403 });
  if (!tenant || tenant.tenantId !== session.tenantId) {
    return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  }

  const links = await db.parentStudent.findMany({
    where: { tenantId: session.tenantId, parentId: session.userId },
    orderBy: { student: { name: 'asc' } },
    select: {
      student: {
        select: {
          id: true,
          name: true,
          studentNumber: true,
          gradeLevel: true,
          results: {
            where: { tenantId: session.tenantId },
            orderBy: [{ term: 'asc' }, { subject: 'asc' }],
            select: { subject: true, term: true, totalScore: true, grade: true },
          },
          fees: {
            where: { tenantId: session.tenantId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, amount: true, status: true },
          },
          attendance: {
            where: { tenantId: session.tenantId },
            orderBy: { date: 'desc' },
            take: 30,
            select: { date: true, status: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ children: links.map(({ student }) => student) });
}
