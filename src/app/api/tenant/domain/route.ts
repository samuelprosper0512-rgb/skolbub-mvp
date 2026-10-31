import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';

export async function GET() {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  if (!tenant || tenant.tenantId !== session.tenantId) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  return NextResponse.json({ customDomain: tenant.customDomain });
}

export async function PUT(request: NextRequest) {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  if (!tenant || tenant.tenantId !== session.tenantId) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const enteredDomain = typeof body.customDomain === 'string' ? body.customDomain.trim().toLowerCase() : '';
  const customDomain = enteredDomain || null;
  if (customDomain) {
    const labels = customDomain.split('.');
    if (customDomain.length > 253 || labels.length < 2 || labels.some((label) => !/^(?!-)[a-z0-9-]{1,63}(?<!-)$/.test(label))) {
      return NextResponse.json({ error: 'Enter a valid hostname, such as portal.example.com.' }, { status: 400 });
    }
  }

  try {
    const updated = await db.tenant.update({
      where: { tenantId: session.tenantId },
      data: { customDomain },
      select: { customDomain: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'That custom domain is already connected to another school.' }, { status: 409 });
    }
    console.error('Update custom domain failed:', error);
    return NextResponse.json({ error: 'Unable to update the custom domain.' }, { status: 500 });
  }
}
