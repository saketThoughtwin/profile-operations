import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/settings';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const sessionCookie = (await cookies()).get('user_session');
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await getSettings();
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
        const { twilioEnabled, registrationOpen, registrationStartDate, registrationEndDate } = body;

        const updates: any = {};

        if (typeof twilioEnabled === 'boolean') {
            updates.twilioEnabled = twilioEnabled;
        }
        if (typeof registrationOpen === 'boolean') {
            updates.registrationOpen = registrationOpen;
        }
        if (typeof registrationStartDate === 'string') {
            updates.registrationStartDate = registrationStartDate;
        }
        if (typeof registrationEndDate === 'string') {
            updates.registrationEndDate = registrationEndDate;
        }

        try {
            await updateSettings(updates);
            return NextResponse.json({ message: 'Settings updated successfully' });
        } catch (err: any) {
            console.error('Failed to save settings:', err);
            return NextResponse.json({ error: `Failed to save settings: ${err.message}` }, { status: 500 });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
