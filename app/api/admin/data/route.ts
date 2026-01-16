import { NextResponse } from 'next/server';
import { readExcel } from '@/lib/excel';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const sessionCookie = (await cookies()).get('user_session');
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse query parameters for filtering and search
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const search = searchParams.get('search')?.toLowerCase();

        let users = await readExcel('users.xlsx');
        let profiles = await readExcel('profiles.xlsx');

        // Filter by search query (name or mobile)
        if (search) {
            users = users.filter((user: any) =>
                user.name?.toLowerCase().includes(search) ||
                user.mobile?.toString().includes(search)
            );
            profiles = profiles.filter((profile: any) =>
                profile.mobile?.toString().includes(search)
            );
        }

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

        return new NextResponse(JSON.stringify({ users, profiles }), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
