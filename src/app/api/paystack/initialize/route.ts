import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

type PaystackInitializeResponse = {
  status?: boolean;
  message?: string;
  data?: { authorization_url?: string; reference?: string };
};

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Student access required.' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const feeId = typeof body.feeId === 'string' ? body.feeId.trim() : '';
  if (!feeId) return NextResponse.json({ error: 'A fee ID is required.' }, { status: 400 });

  const student = await db.student.findFirst({
    where: { userId: session.userId, tenantId: session.tenantId },
    select: { id: true },
  });
  if (!student) return NextResponse.json({ error: 'Student account is not linked to a school record.' }, { status: 404 });

  const fee = await db.fee.findFirst({
    where: { id: feeId, studentId: student.id, tenantId: session.tenantId, status: 'unpaid' },
  });
  if (!fee) return NextResponse.json({ error: 'Unpaid fee not found for this student.' }, { status: 404 });
  if (!Number.isSafeInteger(fee.amount) || fee.amount <= 0 || !Number.isSafeInteger(fee.amount * 100)) {
    return NextResponse.json({ error: 'The fee amount is invalid.' }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: 'Paystack is not configured.' }, { status: 500 });

  try {
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: session.email,
        amount: fee.amount * 100,
        currency: 'NGN',
        metadata: { feeId: fee.id, tenantId: fee.tenantId },
      }),
      cache: 'no-store',
    });

    const result = await paystackResponse.json() as PaystackInitializeResponse;
    const authorizationUrl = result.data?.authorization_url;
    if (!paystackResponse.ok || result.status !== true || typeof authorizationUrl !== 'string') {
      console.error('Paystack initialization failed:', result.message || paystackResponse.statusText);
      return NextResponse.json({ error: 'Unable to start payment. Please try again.' }, { status: 502 });
    }

    const parsedUrl = new URL(authorizationUrl);
    if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'checkout.paystack.com') {
      console.error('Paystack returned an unexpected authorization URL.');
      return NextResponse.json({ error: 'Unable to start payment. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ authorization_url: authorizationUrl });
  } catch (error) {
    console.error('Paystack initialization request failed:', error);
    return NextResponse.json({ error: 'Unable to connect to Paystack. Please try again.' }, { status: 502 });
  }
}