import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('user_session');
    const path = request.nextUrl.pathname;

    // 1. Check if user is authenticated
    if (!sessionCookie && (path.startsWith('/dashboard') || path.startsWith('/admin'))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Role-based access control
    if (sessionCookie) {
        try {
            const session = JSON.parse(sessionCookie.value);

            // Protect /admin routes - only allow 'admin' role
            if (path.startsWith('/admin') && session.role !== 'admin') {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }

            // Optional: Redirect logged-in users away from auth pages? (Not requested but good practice)
            // if ((path === '/login' || path === '/signup') && session) {
            //     return NextResponse.redirect(new URL(session.role === 'admin' ? '/admin' : '/dashboard', request.url));
            // }

        } catch (e) {
            // Invalid cookie
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*'],
};
