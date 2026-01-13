import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    const cookieStore = await cookies();

    // Clear the session cookie
    cookieStore.delete('user_session');

    return NextResponse.json({ message: 'Logged out successfully' });
}
