import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim();
  const host = forwardedHost || request.headers.get('host') || request.nextUrl.host;
  let hostname = host;

  try {
    hostname = new URL(`http://${host}`).hostname.toLowerCase();
  } catch {
    return NextResponse.next();
  }

  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost').toLowerCase();
  const suffix = `.${rootDomain}`;
  const subdomain = hostname.endsWith(suffix)
    ? hostname.slice(0, -suffix.length)
    : '';
  const slug = subdomain && !subdomain.includes('.') && subdomain !== 'www'
    ? subdomain
    : '';
  const response = NextResponse.next();

  if (slug) {
    response.cookies.set('tenant_slug', slug, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};