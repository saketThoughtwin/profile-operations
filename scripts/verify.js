const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:3001';
let cookie = '';
let otp = '';
const mobile = '+919876543210';
const password = 'Password1';

async function run() {
    try {
        console.log('--- Starting Verification ---');

        // 1. Send OTP
        console.log('1. Sending OTP...');
        const sendOtpRes = await fetch(`${BASE_URL}/api/auth/signup/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Script User', mobile, password })
        });
        const sendOtpData = await sendOtpRes.json();
        if (!sendOtpRes.ok) throw new Error(sendOtpData.error);
        console.log('   OTP Sent (Twilio/Console). Fetching from Excel for verification...');

        // Read OTP from Excel for verification script
        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(path.join(__dirname, '../pending_registrations.xlsx'));
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const pending = XLSX.utils.sheet_to_json(sheet);
        const registration = pending.find(p => p.mobile === mobile);
        if (!registration) throw new Error('Registration not found in Excel');
        otp = registration.otp;
        console.log('   OTP Retrieved from Excel:', otp);

        // 2. Verify OTP
        console.log('2. Verifying OTP...');
        const verifyRes = await fetch(`${BASE_URL}/api/auth/signup/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, otp })
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(verifyData.error);
        console.log('   User Verified.');

        // 3. Login
        console.log('3. Logging in...');
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error);

        const setCookie = loginRes.headers.get('set-cookie');
        if (setCookie) {
            cookie = setCookie.split(';')[0];
        }
        console.log('   Login Successful. Cookie:', cookie);

        // 4. Submit Profile
        console.log('4. Submitting Profile...');
        const formData = new FormData();
        formData.append('fatherName', 'Dad');
        formData.append('motherName', 'Mom');
        formData.append('fatherOccupation', 'Work');
        formData.append('motherOccupation', 'Work');
        formData.append('dob', '2000-01-01');
        formData.append('education', 'PhD');

        // Create a dummy file
        const blob = new Blob(['fake image'], { type: 'text/plain' });
        formData.append('picture', blob, 'test.txt');

        const profileRes = await fetch(`${BASE_URL}/api/user/profile`, {
            method: 'POST',
            headers: {
                'Cookie': cookie
            },
            body: formData
        });

        if (!profileRes.ok) {
            const text = await profileRes.text();
            throw new Error(`Profile upload failed: ${text}`);
        }
        console.log('   Profile Submitted.');

        // 5. Check Admin Data
        console.log('5. Checking Admin Data...');
        const adminRes = await fetch(`${BASE_URL}/api/admin/data`, {
            headers: {
                'Cookie': cookie
            }
        });
        const adminData = await adminRes.json();
        if (!adminRes.ok) throw new Error(adminData.error);

        const userFound = adminData.users.find(u => u.mobile === mobile);
        const profileFound = adminData.profiles.find(p => p.mobile === mobile);

        if (userFound && profileFound) {
            console.log('   SUCCESS: User and Profile found in Admin data.');
        } else {
            console.error('   FAILURE: User or Profile not found.', { userFound, profileFound });
        }

    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

run();
