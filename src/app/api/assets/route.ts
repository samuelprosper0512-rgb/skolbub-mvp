import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenant } from '@/lib/tenant';

async function authorize() {
  const [session, tenant] = await Promise.all([getSession(), getTenant()]);
  if (!session) return { response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  if (session.role !== 'ADMIN') return { response: NextResponse.json({ error: 'Admin access required.' }, { status: 403 }) };
  if (!tenant || tenant.tenantId !== session.tenantId) return { response: NextResponse.json({ error: 'School workspace not found.' }, { status: 404 }) };
  return { session };
}

export async function GET() {
  const auth = await authorize();
  if (auth.response) return auth.response;
  const assets = await db.asset.findMany({
    where: { tenantId: auth.session.tenantId },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json({ assets });
}

export async function POST(request: NextRequest) {
  const auth = await authorize();
  if (auth.response) return auth.response;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const condition = typeof body.condition === 'string' ? body.condition.trim() : '';
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const quantity = typeof body.quantity === 'number' ? body.quantity : Number(body.quantity);
  if (!name || !category || !condition || !location || !Number.isInteger(quantity) || quantity < 1 || name.length > 150) {
    return NextResponse.json({ error: 'Enter valid asset details and a positive whole-number quantity.' }, { status: 400 });
  }
  const asset = await db.asset.create({ data: { tenantId: auth.session.tenantId, name, category, condition, location, quantity } });
  return NextResponse.json({ asset }, { status: 201 });
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
  const condition = typeof body.condition === 'string' ? body.condition.trim() : '';
  if (!id || !condition) return NextResponse.json({ error: 'An asset and condition are required.' }, { status: 400 });
  const updated = await db.asset.updateMany({ where: { id, tenantId: auth.session.tenantId }, data: { condition } });
  if (!updated.count) return NextResponse.json({ error: 'Asset not found in your school.' }, { status: 404 });
  return NextResponse.json({ updated: true });
}
