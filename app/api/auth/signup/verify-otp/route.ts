import { NextResponse } from 'next/server';
import { readExcel, writeExcel, appendToExcel } from '@/lib/excel';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mobile, otp } = body;

        if (!mobile || !otp) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Verify OTP via Twilio Verify
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
            try {
                const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                const verificationCheck = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
                    .verificationChecks
                    .create({ to: mobile, code: otp });

                if (verificationCheck.status !== 'approved') {
                    return NextResponse.json({ error: 'Invalid OTP or expired session' }, { status: 400 });
                }
            } catch (twilioError: any) {
                console.error('Twilio Verify Error:', twilioError);
                return NextResponse.json({
                    error: 'Failed to verify OTP',
                    details: twilioError.message
                }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: 'Twilio credentials missing' }, { status: 500 });
        }

        const pending = await readExcel('pending_registrations.xlsx');
        // Find by mobile only, since OTP is not stored
        const registrationIndex = pending.findIndex((p: any) => p.mobile === mobile);

        if (registrationIndex === -1) {
            return NextResponse.json({ error: 'Registration session not found' }, { status: 400 });
        }

        const registration: any = pending[registrationIndex];

        // Move to users.xlsx
        const newUser = {
            name: registration.name,
            password: registration.password,
            mobile: registration.mobile,
            createdAt: new Date().toISOString()
        };

        await appendToExcel('users.xlsx', newUser);

        // Remove from pending
        pending.splice(registrationIndex, 1);
        await writeExcel('pending_registrations.xlsx', pending);

        // Set session cookie for auto-login
        const cookieStore = await cookies();
        cookieStore.set('user_session', JSON.stringify({ mobile: newUser.mobile, name: newUser.name, role: 'user' }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return NextResponse.json({
            message: 'User registered successfully',
            user: { name: newUser.name, mobile: newUser.mobile, role: 'user' }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
