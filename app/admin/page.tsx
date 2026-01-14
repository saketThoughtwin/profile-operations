'use client';

import { useEffect, useState } from 'react';

export default function AdminPage() {
    const [data, setData] = useState<{ users: any[], profiles: any[] }>({ users: [], profiles: [] });
    const [twilioEnabled, setTwilioEnabled] = useState(true);
    const [registrationOpen, setRegistrationOpen] = useState(true);
    const [registrationStartDate, setRegistrationStartDate] = useState('');
    const [registrationEndDate, setRegistrationEndDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'registered_users' | 'user_profiles'>('registered_users');

    useEffect(() => {
        fetchData();
        fetchSettings();
    }, [activeTab]);

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
                setRegistrationOpen(settings.registrationOpen);
                setRegistrationStartDate(settings.registrationStartDate || '');
                setRegistrationEndDate(settings.registrationEndDate || '');
            })
            .catch(console.error);
    };

    const updateSetting = async (key: string, value: any) => {
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            });

            const result = await res.json();

            if (res.ok) {
                if (key === 'twilioEnabled') setTwilioEnabled(value);
                if (key === 'registrationOpen') setRegistrationOpen(value);
                if (key === 'registrationStartDate') setRegistrationStartDate(value);
                if (key === 'registrationEndDate') setRegistrationEndDate(value);

                setMessage('Settings updated successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(`Error: ${result.error || 'Failed to update settings'}`);
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            setMessage('Error updating settings');
            setTimeout(() => setMessage(''), 3000);
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
        <div className="min-h-screen bg-gray-100 flex text-black">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
                </div>
                <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                        <li>
                            <button
                                onClick={() => setActiveTab('registered_users')}
                                className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'registered_users'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                Registered Users
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('user_profiles')}
                                className={`w-full text-left px-4 py-2 rounded transition ${activeTab === 'user_profiles'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                User Profiles
                            </button>
                        </li>
                    </ul>
                </nav>
                <div className="p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {message && (
                    <div className={`mb-4 p-4 rounded ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                {/* Settings Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-bold mb-4">Settings</h2>

                    {/* Twilio Toggle */}
                    <div className="flex items-center gap-4 mb-6">
                        <label className="flex items-center cursor-pointer">
                            <span className="mr-3 text-gray-700 font-medium">Twilio OTP Verification</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={twilioEnabled}
                                    onChange={(e) => updateSetting('twilioEnabled', e.target.checked)}
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

                    {/* Registration Slot Configuration */}
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold mb-3">Registration Slot Control</h3>
                        <div className="flex items-center gap-4 mb-4">
                            <label className="flex items-center cursor-pointer">
                                <span className="mr-3 text-gray-700 font-medium">Registration Open</span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={registrationOpen}
                                        onChange={(e) => updateSetting('registrationOpen', e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`block w-14 h-8 rounded-full transition ${registrationOpen ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${registrationOpen ? 'transform translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                            <span className={`text-sm ${registrationOpen ? 'text-green-600' : 'text-red-600'}`}>
                                {registrationOpen ? 'Open' : 'Closed'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Start Date</label>
                                <input
                                    type="date"
                                    value={registrationStartDate}
                                    onChange={(e) => updateSetting('registrationStartDate', e.target.value)}
                                    className="border-2 border-black rounded px-3 py-2 w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Registration End Date</label>
                                <input
                                    type="date"
                                    value={registrationEndDate}
                                    onChange={(e) => updateSetting('registrationEndDate', e.target.value)}
                                    className="border-2 border-black rounded px-3 py-2 w-full"
                                />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Users can only access the form if "Registration Open" is enabled AND the current date is within the specified range.
                        </p>
                    </div>
                </div>

                {/* Date Filter Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-xl font-bold mb-4">Filter Data by Date</h2>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border-2 border-black rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border-2 border-black rounded px-3 py-2"
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

                {/* Content based on active tab */}
                {activeTab === 'registered_users' && (
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
                                    {data.users.length > 0 ? (
                                        data.users.map((user, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{user.mobile}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{user.createdAt}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No users found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'user_profiles' && (
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
                                    {data.profiles.length > 0 ? (
                                        data.profiles.map((profile, idx) => (
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
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="px-6 py-4 text-center text-gray-500">No profiles found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
