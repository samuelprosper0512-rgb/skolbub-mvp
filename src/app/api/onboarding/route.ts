import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

const schoolTypes = new Set(['primary', 'secondary', 'higher']);
const ownershipTypes = new Set(['public', 'private']);
const currencies = new Set(['NGN', 'USD', 'GBP', 'GHS', 'KES', 'ZAR']);
const paymentCycles = new Set(['term', 'semester', 'monthly', 'annual']);
const gradingSystems = new Set(['percentage', 'letter', 'four_point']);

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const tenant = await db.tenant.findFirst({
    where: { tenantId: session.tenantId },
    select: {
      name: true, motto: true, schoolType: true, ownership: true, gradingSystem: true,
      hasComputerLabs: true, enableCBT: true, enableOnlineClasses: true, enableLibrary: true,
      enableTransport: true, currency: true, paymentCycle: true, primaryColor: true, logoUrl: true,
    },
  });
  if (!tenant) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });
  return NextResponse.json({ tenant });
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

  const { schoolName, motto, schoolType, ownership, gradingSystem, primaryColor, hasComputerLabs, enableCBT, enableOnlineClasses, enableLibrary, enableTransport, currency, paymentCycle, logoUrl } = body;
  if (typeof schoolName !== 'string' || !schoolName.trim() || schoolName.trim().length > 120) {
    return NextResponse.json({ error: 'Enter a school name up to 120 characters.' }, { status: 400 });
  }
  if (typeof motto !== 'string' || motto.length > 200) {
    return NextResponse.json({ error: 'Motto must be no more than 200 characters.' }, { status: 400 });
  }
  if (typeof schoolType !== 'string' || !schoolTypes.has(schoolType)) {
    return NextResponse.json({ error: 'Choose a valid school type.' }, { status: 400 });
  }
  if (typeof ownership !== 'string' || !ownershipTypes.has(ownership)) {
    return NextResponse.json({ error: 'Choose a valid ownership type.' }, { status: 400 });
  }
  if (typeof gradingSystem !== 'string' || !gradingSystems.has(gradingSystem)) {
    return NextResponse.json({ error: 'Choose a valid grading system.' }, { status: 400 });
  }
  if (typeof primaryColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
    return NextResponse.json({ error: 'Choose a valid hex color.' }, { status: 400 });
  }
  if (typeof hasComputerLabs !== 'boolean' || typeof enableCBT !== 'boolean' || typeof enableOnlineClasses !== 'boolean' || typeof enableLibrary !== 'boolean' || typeof enableTransport !== 'boolean') {
    return NextResponse.json({ error: 'Submit all facility and feature selections.' }, { status: 400 });
  }
  if (typeof currency !== 'string' || !currencies.has(currency) || typeof paymentCycle !== 'string' || !paymentCycles.has(paymentCycle)) {
    return NextResponse.json({ error: 'Choose a valid currency and payment cycle.' }, { status: 400 });
  }
  if (typeof logoUrl !== 'string' || logoUrl.length > 2048 || (logoUrl && !/^https:\/\/\S+$/i.test(logoUrl))) {
    return NextResponse.json({ error: 'Logo URL must be a valid HTTPS URL.' }, { status: 400 });
  }

  const result = await db.tenant.updateMany({
    where: { tenantId: session.tenantId },
    data: {
      name: schoolName.trim(),
      motto: motto.trim(),
      schoolType,
      ownership,
      gradingSystem,
      primaryColor,
      hasComputerLabs,
      enableCBT,
      enableOnlineClasses,
      enableLibrary,
      enableTransport,
      currency,
      paymentCycle,
      logoUrl,
    },
  });
  if (result.count !== 1) return NextResponse.json({ error: 'School workspace not found.' }, { status: 404 });

  return NextResponse.json({ success: true });
}