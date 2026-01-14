'use client';

import { generateProfilesPdf } from '@/lib/generateProfilesPdf';
import { useEffect, useState } from 'react';

export default function AdminPage() {
    const [data, setData] = useState<{ users: any[], profiles: any[] }>({ users: [], profiles: [] });
    const [twilioEnabled, setTwilioEnabled] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchData();
        fetchSettings();
    }, []);

    const fetchData = (start?: string, end?: string) => {
        let url = '/api/admin/data';
        if (start && end) {
            url += `?startDate=${start}&endDate=${end}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(setData)
            .catch(console.error);
    };

    const fetchSettings = () => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(settings => {
                setTwilioEnabled(settings.twilioEnabled);
            })
            .catch(console.error);
    };

    const handleTwilioToggle = async () => {
        const newValue = !twilioEnabled;

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ twilioEnabled: newValue })
            });

            if (res.ok) {
                setTwilioEnabled(newValue);
                setMessage(`Twilio OTP ${newValue ? 'enabled' : 'disabled'} successfully!`);
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    };

    const handleDateFilter = () => {
        if (startDate && endDate) {
            fetchData(startDate, endDate);
        } else {
            setMessage('Please select both start and end dates');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const clearDateFilter = () => {
        setStartDate('');
        setEndDate('');
        fetchData();
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
            window.location.href = '/login'; // Fallback
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 text-black">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Admin Panel</h1>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                    >
                        Logout
                    </button>
                </div>

                {message && (
                    <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
                        {message}
                    </div>
                )}

                {/* Settings Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-bold mb-4">Settings</h2>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center cursor-pointer">
                            <span className="mr-3 text-gray-700 font-medium">Twilio OTP Verification</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={twilioEnabled}
                                    onChange={handleTwilioToggle}
                                    className="sr-only"
                                />
                                <div className={`block w-14 h-8 rounded-full transition ${twilioEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${twilioEnabled ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                        <span className={`text-sm ${twilioEnabled ? 'text-green-600' : 'text-red-600'}`}>
                            {twilioEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        When disabled, users can register directly without OTP verification
                    </p>
                </div>

                {/* Date Filter Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-bold mb-4">Filter Profiles by Date</h2>
                    <div className="flex items-center gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={handleDateFilter}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Apply Filter
                            </button>
                            <button
                                onClick={clearDateFilter}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-bold mb-4">Registered Users</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.users.map((user, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{user.mobile}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{user.createdAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Profiles Table */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">User Profiles</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Father's Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mother's Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Father's Occupation</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mother's Occupation</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Education</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Picture</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.profiles.map((profile, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 whitespace-nowrap">{profile.mobile}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{profile.fatherName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{profile.motherName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{profile.fatherOccupation}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{profile.motherOccupation}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{profile.dob}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{profile.education}</td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={profile.address}>{profile.address}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {profile.picture && (
                                                <a href={profile.picture} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Image</a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="flex justify-end mt-6">
                <button
                    onClick={() => generateProfilesPdf(data.profiles)}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
                >
                    Generate PDF
                </button>
            </div>

        </div>
    );
}
