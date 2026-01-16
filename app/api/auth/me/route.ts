import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const sessionCookie = (await cookies()).get('user_session');
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = JSON.parse(sessionCookie.value);
        return NextResponse.json({
            name: session.name,
            mobile: session.mobile,
            role: session.role
        });
    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
