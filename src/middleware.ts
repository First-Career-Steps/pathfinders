import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/resume', '/career-roadmap', '/builder', '/success'];

// Routes that should redirect to builder if already authenticated
const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    try {
        // Create a response object
        const response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        });

        // Create Supabase client with proper cookie handling for middleware
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            request.cookies.set(name, value);
                            response.cookies.set(name, value, options);
                        });
                    },
                },
            }
        );

        // Get the current user - more reliable than getSession() in middleware
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            logger.error('Middleware', userError, { pathname });
        }

        const isAuthenticated = !!user;
        const isProtectedApi = pathname.startsWith('/api/ai/') || pathname.startsWith('/api/resumes/') || ['/api/create-checkout', '/api/check-subscription'].includes(pathname);
        if (isProtectedApi && !user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
        if (user?.app_metadata?.deletion_in_progress && !['/', '/privacy', '/terms', '/dashboard/settings', '/login', '/signup', '/blocked'].includes(pathname)) {
            if (isProtectedApi) return NextResponse.json({ error: 'Account deletion in progress' }, { status: 409 });
            return NextResponse.redirect(new URL('/dashboard/settings', request.url));
        }
        if (isProtectedApi || protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
            response.headers.set('Cache-Control', 'private, no-store');
            response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        }


        logger.debug('Middleware', 'Route access check', {
            pathname,
            isAuthenticated,
            userId: user?.id,
        });

        // Admin routes: separate URL /admin, dedicated login at /admin/login
        const isAdminLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/');
        const isAdminRoot = pathname === '/admin' || pathname === '/admin/';
        const isAdminRoute = pathname.startsWith('/admin');

        if (isAdminRoute) {
            // Always redirect /admin and /admin/ to login or dashboard (avoids 404 if page not found)
            if (isAdminRoot) {
                if (!isAuthenticated) return NextResponse.redirect(new URL('/admin/login', request.url));
                const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single();
                if (userRow?.role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
            if (isAdminLogin) return response;
            if (!isAuthenticated) return NextResponse.redirect(new URL('/admin/login', request.url));
            const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single();
            if (userRow?.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', request.url));
            return response;
        }

        // Blocked users: redirect to /blocked when accessing app routes (not public pages)
        if (isAuthenticated && !['/blocked', '/', '/privacy', '/terms', '/dashboard/settings'].includes(pathname) && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
            const { data: userRow } = await supabase.from('users').select('blocked_at').eq('id', user.id).single();
            if (userRow?.blocked_at) {
                return NextResponse.redirect(new URL('/blocked', request.url));
            }
        }

        // Check if the route is protected
        const isProtectedRoute = protectedRoutes.some((route) =>
            pathname === route || pathname.startsWith(route + '/')
        );

        // Check if the route is an auth route
        const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

        // Redirect to login if accessing protected route without authentication
        if (isProtectedRoute && !isAuthenticated) {
            logger.warn('Middleware', 'Unauthorized access attempt', {
                pathname,
                redirectTo: '/login',
            });

            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Redirect to dashboard if accessing auth routes while authenticated
        if (isAuthRoute && isAuthenticated) {
            logger.info('Middleware', 'Authenticated user accessing auth route', {
                pathname,
                redirectTo: '/dashboard',
                userId: user.id,
            });

            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        return response;
    } catch (error) {
        logger.error('Middleware', error as Error, { pathname });
        // Fail closed on account pages; public information remains available.
        if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Authentication unavailable' }, { status: 503 });
        if (protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/')) || pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }
}

// Configure which routes use this middleware
export const config = {
    matcher: [
        '/api/ai/:path*',
        '/api/resumes/:path*',
        '/api/create-checkout',
        '/api/check-subscription',
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
