import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

const schoolTypes = new Set(['primary', 'secondary', 'higher']);
const ownershipTypes = new Set(['public', 'private']);

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

  const { schoolType, ownership, primaryColor, hasComputerLabs, enableCBT, enableOnlineClasses } = body;
  if (typeof schoolType !== 'string' || !schoolTypes.has(schoolType)) {
    return NextResponse.json({ error: 'Choose a valid school type.' }, { status: 400 });
  }
  if (typeof ownership !== 'string' || !ownershipTypes.has(ownership)) {
    return NextResponse.json({ error: 'Choose a valid ownership type.' }, { status: 400 });
  }
  if (typeof primaryColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
    return NextResponse.json({ error: 'Choose a valid hex color.' }, { status: 400 });
  }
  if (typeof hasComputerLabs !== 'boolean' || typeof enableCBT !== 'boolean' || typeof enableOnlineClasses !== 'boolean') {
    return NextResponse.json({ error: 'Submit all facility and feature selections.' }, { status: 400 });
  }

  const result = await db.tenant.updateMany({
    where: { tenantId: session.tenantId },
    data: { schoolType, ownership, primaryColor, hasComputerLabs, enableCBT, enableOnlineClasses },
  });
  if (result.count !== 1) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });

  return NextResponse.json({ success: true });
}