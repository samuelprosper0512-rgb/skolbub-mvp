import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantForSession } from '@/lib/tenant';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  const [messages, contacts] = await Promise.all([
    db.message.findMany({
      where: { tenantId: session.tenantId, OR: [{ senderId: session.userId }, { receiverId: session.userId }] },
      include: { sender: { select: { id: true, name: true, email: true } }, receiver: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.user.findMany({
      where: { tenantId: session.tenantId, id: { not: session.userId } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  return NextResponse.json({ messages, contacts });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const receiverId = typeof body.receiverId === 'string' ? body.receiverId.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!receiverId || receiverId === session.userId || !content || content.length > 5000) {
    return NextResponse.json({ error: 'Choose a recipient and enter a message up to 5,000 characters.' }, { status: 400 });
  }
  const receiver = await db.user.findFirst({ where: { id: receiverId, tenantId: session.tenantId }, select: { id: true } });
  if (!receiver) return NextResponse.json({ error: 'Recipient not found in your school.' }, { status: 404 });
  const message = await db.message.create({
    data: { tenantId: session.tenantId, senderId: session.userId, receiverId, content },
    include: { sender: { select: { id: true, name: true } }, receiver: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ message }, { status: 201 });
}
