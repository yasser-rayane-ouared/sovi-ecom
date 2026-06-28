import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (handled by backend or public proxy)
     * - _next/static, _next/image
     * - favicon.ico, images, fonts, static files
     */
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Get root domain (e.g., localhost:3000 or yourdomain.com)
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

  // Extract subdomain
  let subdomain = hostname.replace(`.${rootDomain}`, '').replace(`:${url.port}`, '');

  // If the host is exactly the root domain, or has www prefix, do not rewrite
  if (hostname === rootDomain || hostname === `www.${rootDomain}` || subdomain === 'localhost' || !subdomain) {
    return NextResponse.next();
  }

  // Rewrite subdomain requests internally to /[store]/<path>
  return NextResponse.rewrite(
    new URL(`/${subdomain}${url.pathname}${url.search}`, req.url)
  );
}
