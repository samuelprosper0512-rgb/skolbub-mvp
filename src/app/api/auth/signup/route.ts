import { randomUUID } from 'node:crypto';
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

  const schoolName = typeof body.schoolName === 'string' ? body.schoolName.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!schoolName || !name || !email || !/^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/.test(slug)) {
    return NextResponse.json({ error: 'Enter valid school, admin, email, and school URL details.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const tenantId = randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await db.$transaction(async (transaction) => {
      await transaction.tenant.create({
        data: { id: tenantId, tenantId, slug, name: schoolName, type: 'SCHOOL' },
      });
      return transaction.user.create({
        data: { tenantId, email, name, passwordHash, role: 'ADMIN' },
      });
    });

    const token = await createToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
    response.cookies.set('tenant_slug', slug, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return response;
  } catch (error) {
    if (
      typeof error === 'object' && error !== null &&
      'code' in error && error.code === 'P2002'
    ) {
      return NextResponse.json({ error: 'That school URL or email is already in use.' }, { status: 409 });
    }
    console.error('Signup failed:', error);
    return NextResponse.json({ error: 'Unable to create the school account.' }, { status: 500 });
  }
}