import { NextResponse } from 'next/server';
import { readExcel, writeExcel, appendToExcel } from '@/lib/excel';
import { isTwilioEnabled } from '@/lib/settings';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, password, mobile } = body;

        // Validation
        if (!name || !password || !mobile) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Password Regex: 1 upper, 1 lower, 1 number, min 6 chars
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json({
                error: 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and be at least 6 characters long.'
            }, { status: 400 });
        }

        // Mobile Regex: +91 followed by 10 digits
        if (!/^\+91\d{10}$/.test(mobile)) {
            return NextResponse.json({ error: 'Mobile number must be 10 digits.' }, { status: 400 });
        }

        // Check if user already exists
        const users = await readExcel('users.xlsx');
        if (users.find((u: any) => u.mobile === mobile)) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Check if Twilio is enabled
        const twilioEnabledSetting = await isTwilioEnabled();

        if (!twilioEnabledSetting) {
            // Direct registration without OTP
            const newUser = {
                name,
                password,
                mobile,
                createdAt: new Date().toISOString()
            };

            await appendToExcel('users.xlsx', newUser);

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
                twilioEnabled: false,
                user: { name: newUser.name, mobile: newUser.mobile, role: 'user' }
            });
        }

        // Twilio OTP flow
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID) {
            try {
                const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

                const verifyParams: any = {
                    to: mobile,
                    channel: 'sms'
                };

                // Add messaging service SID if provided
                if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
                    verifyParams.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
                }

                await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
                    .verifications
                    .create(verifyParams);
            } catch (twilioError: any) {
                console.error('Twilio Error:', twilioError);
                console.error('Error details:', JSON.stringify(twilioError, null, 2));
                return NextResponse.json({
                    error: 'Failed to send OTP via Twilio',
                    details: twilioError.message
                }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: 'Twilio credentials missing (need ACCOUNT_SID, AUTH_TOKEN, VERIFY_SERVICE_SID)' }, { status: 500 });
        }

        // Save to pending_registrations.xlsx (OTP is handled by Twilio now)
        let pending = await readExcel('pending_registrations.xlsx');
        // Remove previous pending for this mobile
        pending = pending.filter((p: any) => p.mobile !== mobile);

        pending.push({ name, password, mobile, otp: 'PENDING_TWILIO', timestamp: Date.now() });
        await writeExcel('pending_registrations.xlsx', pending);

        return NextResponse.json({
            message: 'OTP sent successfully',
            twilioEnabled: true
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
