import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/settings';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const sessionCookie = (await cookies()).get('user_session');
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const sessionCookie = (await cookies()).get('user_session');
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { twilioEnabled } = body;

        if (typeof twilioEnabled !== 'boolean') {
            return NextResponse.json({ error: 'Invalid settings' }, { status: 400 });
        }

        updateSettings({ twilioEnabled });

        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
