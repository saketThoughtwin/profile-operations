import { NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobile, password } = body;

        if (!mobile || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Helper to normalize mobile (remove +91 if present)
        const normalizeMobile = (m: string) => m ? m.replace(/^\+91/, '') : '';
        const inputMobile = normalizeMobile(mobile);

        // 1. Check Admin Credentials
        const admins = await readExcel('admins.xlsx');
        const admin = admins.find((a: any) => normalizeMobile(a.mobile) === inputMobile && a.password === password);

        if (admin) {
            // Set admin session
            const cookieStore = await cookies();
            cookieStore.set('user_session', JSON.stringify({ mobile: admin.mobile, name: admin.name, role: 'admin' }), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24, // 1 day
                path: '/',
            });
            return NextResponse.json({ message: 'Admin login successful', user: { name: admin.name, mobile: admin.mobile, role: 'admin' } });
        }

        // 2. Check User Credentials
        const users = await readExcel('users.xlsx');
        const user = users.find((u: any) => normalizeMobile(u.mobile) === inputMobile && u.password === password);

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Set user session
        const cookieStore = await cookies();
        cookieStore.set('user_session', JSON.stringify({ mobile: user.mobile, name: user.name, role: 'user' }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return NextResponse.json({ message: 'Login successful', user: { name: user.name, mobile: user.mobile, role: 'user' } });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
