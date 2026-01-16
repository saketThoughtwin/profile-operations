import { NextResponse } from 'next/server';
import { updateOrAppendToExcel } from '@/lib/excel';

export async function GET() {
    try {
        const newAdmin = {
            mobile: '8770924432',
            password: 'Ashish123',
            name: 'Ashish',
            role: 'admin'
        };

        await updateOrAppendToExcel('admins.xlsx', newAdmin, 'mobile');

        return NextResponse.json({
            message: 'Admin added successfully!',
            admin: {
                mobile: newAdmin.mobile,
                name: newAdmin.name,
                role: newAdmin.role
            }
        });
    } catch (error) {
        console.error('Failed to add admin:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
