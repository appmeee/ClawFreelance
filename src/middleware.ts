import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Security middleware for ClawFreelance
 *
 * Implements:
 * - Internationalization (i18n) with locale detection
 * - Security headers (CSP, HSTS, X-Frame-Options, etc.)
 * - CORS configuration
 * - Request ID generation
 * - Basic request logging
 */

// i18n Configuration (inline to avoid import issues in Edge runtime)
// Note: Must match lib/i18n/config.ts - duplicated here because Edge runtime can't import
const locales = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'pt', 'ko'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'en';

// Get locale from pathname (e.g., /en/tasks -> 'en')
function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/');
  const maybeLocale = segments[1];
  if (locales.includes(maybeLocale as Locale)) {
    return maybeLocale as Locale;
  }
  return null;
}

// Get preferred locale from cookie, Accept-Language header, or default
function getPreferredLocale(request: NextRequest): Locale {
  // First check for saved preference in cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // Fall back to Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return defaultLocale;

  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, qValue] = lang.trim().split(';q=');
      return { code: code.split('-')[0].toLowerCase(), q: qValue ? parseFloat(qValue) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  // Find first matching locale
  for (const { code } of languages) {
    if (locales.includes(code as Locale)) {
      return code as Locale;
    }
  }

  return defaultLocale;
}

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://clawfreelance.com',
  'https://www.clawfreelance.com',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean);

// In development, allow localhost
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000');
  ALLOWED_ORIGINS.push('http://127.0.0.1:3000');
}

/**
 * Generate a unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if origin is allowed for CORS
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // Same-origin requests
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Get security headers
 */
function getSecurityHeaders(requestId: string): Record<string, string> {
  return {
    // Request tracing
    'X-Request-ID': requestId,

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // XSS protection (legacy, but still useful)
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy (restrict browser features)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',

    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.github.com https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      'upgrade-insecure-requests',
    ].join('; '),

    // HSTS - enforce HTTPS (1 year, include subdomains, preload)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
}

/**
 * Handle CORS preflight requests
 */
function handleCorsPreFlight(request: NextRequest, origin: string | null): NextResponse {
  const requestId = generateRequestId();

  const headers: Record<string, string> = {
    ...getSecurityHeaders(requestId),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Request-ID',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true',
  };

  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return new NextResponse(null, { status: 204, headers });
}

export function middleware(request: NextRequest) {
  const requestId = generateRequestId();
  const origin = request.headers.get('origin');
  const { pathname } = request.nextUrl;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPreFlight(request, origin);
  }

  // Skip locale handling for API routes and static files
  const isApiRoute = pathname.startsWith('/api/');
  const isStaticFile =
    pathname.startsWith('/_next/') || pathname.startsWith('/_vercel/') || pathname.includes('.');

  // Handle API routes - add security headers and CORS
  if (isApiRoute) {
    const response = NextResponse.next();

    // Add security headers
    const securityHeaders = getSecurityHeaders(requestId);
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }

    // Add CORS headers
    if (origin && isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // API-specific headers
    response.headers.set('X-API-Version', 'v1');

    // Prevent caching of authenticated responses
    if (request.headers.has('authorization') || request.headers.has('x-api-key')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }

    return response;
  }

  // Skip locale handling for static files
  if (isStaticFile) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameLocale = getLocaleFromPathname(pathname);

  // If no locale in URL, redirect to locale-prefixed version
  if (!pathnameLocale) {
    const locale = getPreferredLocale(request);
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(newUrl);
  }

  // Create response with security headers
  const response = NextResponse.next();
  const securityHeaders = getSecurityHeaders(requestId);
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Add locale to response headers for downstream use
  response.headers.set('X-Locale', pathnameLocale);

  // Block suspicious paths (common attack vectors)
  const blockedPaths = [
    '/wp-admin',
    '/wp-login',
    '/.env',
    '/.git',
    '/phpMyAdmin',
    '/phpmyadmin',
    '/admin.php',
    '/xmlrpc.php',
    '/wp-content',
    '/wp-includes',
    '/.aws',
    '/.docker',
  ];

  const lowerPath = pathname.toLowerCase();
  if (blockedPaths.some((blocked) => lowerPath.includes(blocked))) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'X-Request-ID': requestId,
      },
    });
  }

  // Block requests with suspicious query parameters
  const suspiciousParams = ['cmd', 'exec', 'command', 'shell', 'eval'];
  const searchParams = request.nextUrl.searchParams;
  for (const param of suspiciousParams) {
    if (searchParams.has(param)) {
      return new NextResponse('Bad Request', {
        status: 400,
        headers: {
          'X-Request-ID': requestId,
        },
      });
    }
  }

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
