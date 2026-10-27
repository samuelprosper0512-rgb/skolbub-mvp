import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type PaystackEvent = {
  event?: unknown;
  data?: {
    amount?: unknown;
    currency?: unknown;
    reference?: unknown;
    metadata?: unknown;
  };
};

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: 'Paystack is not configured.' }, { status: 500 });

  const signature = request.headers.get('x-paystack-signature');
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  const rawBody = await request.text();
  const expectedSignature = createHmac('sha512', secretKey).update(rawBody).digest();
  const receivedSignature = Buffer.from(signature, 'hex');
  if (!timingSafeEqual(expectedSignature, receivedSignature)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }

  if (event.event !== 'charge.success') return NextResponse.json({ received: true });

  const data = event.data;
  const metadata = data?.metadata;
  if (!data || !metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return NextResponse.json({ error: 'Payment metadata is missing.' }, { status: 400 });
  }

  const paymentMetadata = metadata as Record<string, unknown>;
  const feeId = typeof paymentMetadata.feeId === 'string' ? paymentMetadata.feeId : '';
  const tenantId = typeof paymentMetadata.tenantId === 'string' ? paymentMetadata.tenantId : '';
  const reference = typeof data.reference === 'string' ? data.reference : '';
  const paidAmount = typeof data.amount === 'number' ? data.amount : Number.NaN;
  if (!feeId || !tenantId || !reference || !Number.isSafeInteger(paidAmount) || data.currency !== 'NGN') {
    return NextResponse.json({ error: 'Payment details are invalid.' }, { status: 400 });
  }

  const fee = await db.fee.findFirst({
    where: { id: feeId, tenantId },
    select: { id: true, tenantId: true, amount: true, status: true },
  });
  if (!fee || fee.amount * 100 !== paidAmount) return NextResponse.json({ received: true });

  await db.fee.updateMany({
    where: { id: fee.id, tenantId: fee.tenantId, status: 'unpaid' },
    data: { status: 'paid', paystackReference: reference },
  });

  return NextResponse.json({ received: true });
}