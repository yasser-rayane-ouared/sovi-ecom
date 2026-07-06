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

  // Redirect authentication/platform pages accessed on subdomains back to the root domain
  const authPaths = ['login', 'register', 'forgot-password', 'reset-password'];
  const firstPathPart = url.pathname.split('/').filter(Boolean)[0];
  if (subdomain && subdomain !== 'www' && subdomain !== 'localhost' && authPaths.includes(firstPathPart)) {
    const cleanRoot = rootDomain.split(':')[0];
    const targetHost = cleanRoot.includes('.') && !cleanRoot.startsWith('www.') ? `www.${cleanRoot}` : cleanRoot;
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const port = url.port ? `:${url.port}` : '';
    return NextResponse.redirect(
      new URL(`${protocol}://${targetHost}${port}${url.pathname}${url.search}`),
      307
    );
  }

  // If the host is exactly the root domain, or has www prefix
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const firstPart = pathParts[0];
      const platformPaths = [
        'login', 'register', 'forgot-password', 'reset-password',
        'overview', 'products', 'orders', 'settings', 'workers',
        'analytics', 'themes', 'pages', 'pixels', 'integrations',
        'billing', 'ab-testing', 'tools', 'profile', '_next', 'api',
        'admin'
      ];
      
      if (!platformPaths.includes(firstPart)) {
        // This is a store subdomain request accessed via path! Redirect to the subdomain.
        const storeSubdomain = firstPart;
        const remainingPath = '/' + pathParts.slice(1).join('/');
        
        // Keep path-based routing on railway.app to avoid nested wildcard SSL errors
        if (hostname.includes('railway.app')) {
          return NextResponse.next();
        }
        
        const cleanRoot = rootDomain.split(':')[0];
        const protocol = req.headers.get('x-forwarded-proto') || 'https';
        
        const redirectUrl = new URL(`${protocol}://${storeSubdomain}.${cleanRoot}${remainingPath}${url.search}`);
        return NextResponse.redirect(redirectUrl, 307);
      }
    }
    return NextResponse.next();
  }

  // If localhost or no subdomain, do not rewrite
  if (subdomain === 'localhost' || !subdomain) {
    return NextResponse.next();
  }

  // Rewrite subdomain requests internally to /[store]/<path>
  return NextResponse.rewrite(
    new URL(`/${subdomain}${url.pathname}${url.search}`, req.url)
  );
}
