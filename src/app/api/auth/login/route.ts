import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { authCookieOptions, createToken, AUTH_COOKIE } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const slug = request.cookies.get('tenant_slug')?.value;

  if (!email || !password) {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: 'Open your school’s Skolhub address to log in.' }, { status: 400 });
  }

  const user = await db.user.findFirst({
    where: { email, tenant: { slug } },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 });
  }

  const token = await createToken({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
  return response;
}