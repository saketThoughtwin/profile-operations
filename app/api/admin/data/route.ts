import { NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const sessionCookie = (await cookies()).get('user_session');
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters for date filtering
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const users = readExcel('users.xlsx');
        let profiles = readExcel('profiles.xlsx');

        // Filter profiles by date range if provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include entire end date

            profiles = profiles.filter((profile: any) => {
                if (!profile.createdAt) return false;
                const profileDate = new Date(profile.createdAt);
                return profileDate >= start && profileDate <= end;
            });
        }

        return NextResponse.json({ users, profiles });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
