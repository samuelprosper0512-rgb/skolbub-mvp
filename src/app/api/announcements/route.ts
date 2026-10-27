import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const announcements = await db.announcement.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ announcements });
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

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!title || !content || title.length > 150 || content.length > 10000) {
    return NextResponse.json({ error: 'Enter a title and announcement content within the allowed lengths.' }, { status: 400 });
  }

  try {
    const announcement = await db.announcement.create({
      data: { tenantId: session.tenantId, title, content },
    });
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error('Create announcement failed:', error);
    return NextResponse.json({ error: 'Unable to save this announcement.' }, { status: 500 });
  }
}
