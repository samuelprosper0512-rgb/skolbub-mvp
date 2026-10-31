import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const host = request.nextUrl.searchParams.get('host')?.toLowerCase() ?? '';
  const labels = host.split('.');
  if (
    host.length > 253 ||
    labels.length < 2 ||
    labels.some((label) => !/^(?!-)[a-z0-9-]{1,63}(?<!-)$/.test(label))
  ) {
    return NextResponse.json({ error: 'Invalid hostname.' }, { status: 400 });
  }

  const tenant = await db.tenant.findUnique({
    where: { customDomain: host },
    select: { slug: true },
  });
  return tenant
    ? NextResponse.json({ slug: tenant.slug }, { headers: { 'Cache-Control': 'no-store' } })
    : NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
}
