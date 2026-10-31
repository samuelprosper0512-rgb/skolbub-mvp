import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
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
  const isRootHost = hostname === rootDomain || hostname.endsWith(suffix) || hostname === 'localhost';
  const subdomain = hostname.endsWith(suffix)
    ? hostname.slice(0, -suffix.length)
    : '';
  let slug = subdomain && !subdomain.includes('.') && subdomain !== 'www'
    ? subdomain
    : '';
  if (!slug && !isRootHost) {
    try {
      const resolveUrl = new URL('/api/tenant/resolve', request.url);
      resolveUrl.searchParams.set('host', hostname);
      const response = await fetch(resolveUrl, { cache: 'no-store' });
      if (!response.ok) {
        console.error('Custom domain tenant lookup failed:', response.status);
      } else {
        const result: unknown = await response.json();
        if (typeof result === 'object' && result !== null && 'slug' in result && typeof result.slug === 'string') {
          slug = result.slug;
        }
      }
    } catch (error) {
      console.error('Custom domain tenant lookup failed:', error);
    }
  }
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/tenant/resolve).*)'],
};