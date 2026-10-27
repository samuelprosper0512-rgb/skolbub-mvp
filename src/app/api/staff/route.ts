import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const staff = await db.staff.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ staff });
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

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = typeof body.role === 'string' ? body.role.trim() : '';
  if (!name || !role || name.length > 100 || role.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid name, email, and role.' }, { status: 400 });
  }

  try {
    const staffMember = await db.staff.create({
      data: { tenantId: session.tenantId, name, email, role },
    });
    return NextResponse.json({ staff: staffMember }, { status: 201 });
  } catch (error) {
    console.error('Create staff member failed:', error);
    return NextResponse.json({ error: 'Unable to save this staff member.' }, { status: 500 });
  }
}
