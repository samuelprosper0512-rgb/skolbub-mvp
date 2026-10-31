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
  const [hostels, students] = await Promise.all([
    db.hostel.findMany({
      where: { tenantId: auth.session.tenantId },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, capacity: true,
        rooms: {
          where: { tenantId: auth.session.tenantId },
          orderBy: { roomNumber: 'asc' },
          select: {
            id: true, roomNumber: true, capacity: true,
            assignments: {
              where: { tenantId: auth.session.tenantId },
              select: { student: { select: { id: true, name: true, studentNumber: true } } },
            },
          },
        },
      },
    }),
    db.student.findMany({
      where: { tenantId: auth.session.tenantId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, studentNumber: true },
    }),
  ]);
  return NextResponse.json({ hostels, students });
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
  const kind = body.kind;
  const positiveInt = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value > 0;

  if (kind === 'hostel') {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 100 || !positiveInt(body.capacity)) return NextResponse.json({ error: 'Enter a hostel name and positive capacity.' }, { status: 400 });
    const hostel = await db.hostel.create({ data: { tenantId: auth.session.tenantId, name, capacity: body.capacity as number }, select: { id: true, name: true, capacity: true } });
    return NextResponse.json({ hostel }, { status: 201 });
  }

  if (kind === 'room') {
    const hostelId = typeof body.hostelId === 'string' ? body.hostelId : '';
    const roomNumber = typeof body.roomNumber === 'string' ? body.roomNumber.trim() : '';
    if (!hostelId || !roomNumber || roomNumber.length > 30 || !positiveInt(body.capacity)) return NextResponse.json({ error: 'Enter a room number and positive capacity.' }, { status: 400 });
    const hostel = await db.hostel.findFirst({ where: { id: hostelId, tenantId: auth.session.tenantId }, select: { capacity: true } });
    if (!hostel) return NextResponse.json({ error: 'Hostel not found in your school.' }, { status: 404 });
    const occupiedCapacity = await db.room.aggregate({ where: { tenantId: auth.session.tenantId, hostelId }, _sum: { capacity: true } });
    if ((occupiedCapacity._sum.capacity ?? 0) + body.capacity > hostel.capacity) return NextResponse.json({ error: 'Room capacities cannot exceed the hostel capacity.' }, { status: 400 });
    const room = await db.room.create({ data: { tenantId: auth.session.tenantId, hostelId, roomNumber, capacity: body.capacity }, select: { id: true, roomNumber: true, capacity: true } });
    return NextResponse.json({ room }, { status: 201 });
  }

  if (kind === 'assign') {
    const roomId = typeof body.roomId === 'string' ? body.roomId : '';
    const studentId = typeof body.studentId === 'string' ? body.studentId : '';
    if (!roomId || !studentId) return NextResponse.json({ error: 'Select a room and student.' }, { status: 400 });
    const assignment = await db.$transaction(async (transaction) => {
      const [room, student, existing] = await Promise.all([
        transaction.room.findFirst({ where: { id: roomId, tenantId: auth.session.tenantId }, select: { id: true, capacity: true } }),
        transaction.student.findFirst({ where: { id: studentId, tenantId: auth.session.tenantId }, select: { id: true } }),
        transaction.roomAssignment.findUnique({ where: { tenantId_studentId: { tenantId: auth.session.tenantId, studentId } }, select: { id: true, roomId: true } }),
      ]);
      if (!room || !student) return null;
      if (existing?.roomId === room.id) return { id: existing.id, roomId: room.id, studentId };
      const count = await transaction.roomAssignment.count({ where: { tenantId: auth.session.tenantId, roomId } });
      if (count >= room.capacity) return null;
      return transaction.roomAssignment.upsert({
        where: { tenantId_studentId: { tenantId: auth.session.tenantId, studentId } },
        create: { tenantId: auth.session.tenantId, roomId, studentId },
        update: { roomId },
        select: { id: true, roomId: true, studentId: true },
      });
    });
    if (!assignment) return NextResponse.json({ error: 'Room or student not found, or the room is full.' }, { status: 400 });
    return NextResponse.json({ assignment }, { status: 201 });
  }

  return NextResponse.json({ error: 'Unsupported hostel operation.' }, { status: 400 });
}
