import { computeLocalHostRedirect } from '@marketplace/web/local-host-redirect';
import { type NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host;
  const currentUrl = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    `${request.nextUrl.protocol}//${host}`,
  );
  const redirectUrl = computeLocalHostRedirect(currentUrl.toString(), process.env.NEXT_PUBLIC_SITE_URL);
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
