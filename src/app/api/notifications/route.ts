import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';

async function authorize() {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session) return { response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  if (!tenant || tenant.tenantId !== session.tenantId) return { response: NextResponse.json({ error: 'School workspace not found.' }, { status: 404 }) };
  return { session };
}

export async function GET() {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const notifications = await db.notification.findMany({
    where: { tenantId: auth.session.tenantId, userId: auth.session.userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, title: true, message: true, isRead: true, createdAt: true },
  });
  return NextResponse.json({ notifications });
}

export async function PATCH(request: NextRequest) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id : '';
  if (body.readAll === true) {
    await db.notification.updateMany({
      where: { tenantId: auth.session.tenantId, userId: auth.session.userId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ updated: true });
  }
  if (!id) return NextResponse.json({ error: 'A notification ID is required.' }, { status: 400 });
  const updated = await db.notification.updateMany({
    where: { id, tenantId: auth.session.tenantId, userId: auth.session.userId },
    data: { isRead: true },
  });
  if (!updated.count) return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
  return NextResponse.json({ updated: true });
}
