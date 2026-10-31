import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTenantForSession } from '@/lib/tenant';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const [routes, students] = await Promise.all([
    db.busRoute.findMany({ where: { tenantId: session.tenantId }, include: { students: { include: { student: { select: { id: true, name: true, studentNumber: true } } } }, _count: { select: { students: true } } }, orderBy: { name: 'asc' } }),
    db.student.findMany({ where: { tenantId: session.tenantId }, select: { id: true, name: true, studentNumber: true }, orderBy: { name: 'asc' } }),
  ]);
  return NextResponse.json({ routes, students });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!await getTenantForSession(session)) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  if (body.action === 'create') {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const driverName = typeof body.driverName === 'string' ? body.driverName.trim() : '';
    const capacity = Number(body.capacity);
    if (!name || !driverName || name.length > 100 || driverName.length > 100 || !Number.isInteger(capacity) || capacity < 1 || capacity > 500) return NextResponse.json({ error: 'Enter a route name, driver, and capacity from 1 to 500.' }, { status: 400 });
    const route = await db.busRoute.create({ data: { tenantId: session.tenantId, name, driverName, capacity } });
    return NextResponse.json({ route }, { status: 201 });
  }
  if (body.action === 'assign') {
    const routeId = typeof body.routeId === 'string' ? body.routeId : '';
    const studentId = typeof body.studentId === 'string' ? body.studentId : '';
    const [route, student] = await Promise.all([
      db.busRoute.findFirst({ where: { id: routeId, tenantId: session.tenantId }, include: { _count: { select: { students: true } } } }),
      db.student.findFirst({ where: { id: studentId, tenantId: session.tenantId }, select: { id: true } }),
    ]);
    if (!route || !student) return NextResponse.json({ error: 'Route or student not found in your school.' }, { status: 404 });
    const existing = await db.studentRoute.findFirst({ where: { tenantId: session.tenantId, studentId } });
    const occupied = route._count.students - (existing?.routeId === route.id ? 1 : 0);
    if (occupied >= route.capacity) return NextResponse.json({ error: 'This bus route is at capacity.' }, { status: 409 });
    const assignment = await db.studentRoute.upsert({
      where: { tenantId_studentId: { tenantId: session.tenantId, studentId } },
      create: { tenantId: session.tenantId, studentId, routeId },
      update: { routeId },
    });
    return NextResponse.json({ assignment });
  }
  return NextResponse.json({ error: 'Unknown transport action.' }, { status: 400 });
}
