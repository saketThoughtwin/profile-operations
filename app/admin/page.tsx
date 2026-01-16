'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
    const [twilioEnabled, setTwilioEnabled] = useState(false);
    const [registrationOpen, setRegistrationOpen] = useState(true);
    const [registrationStartDate, setRegistrationStartDate] = useState('');
    const [registrationEndDate, setRegistrationEndDate] = useState('');

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchSettings();
        fetchUsers();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowFilter(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const fetchUsers = (params?: { start?: string, end?: string, search?: string }) => {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (params?.start) queryParams.append('startDate', params.start);
        else if (startDate) queryParams.append('startDate', startDate);
        if (params?.end) queryParams.append('endDate', params.end);
        else if (endDate) queryParams.append('endDate', endDate);
        if (params?.search !== undefined) {
            if (params.search) queryParams.append('search', params.search);
        } else if (search) {
            queryParams.append('search', search);
        }

        fetch('/api/admin/data?' + queryParams.toString())
            .then(res => res.json())
            .then(data => setUsers(data.users))
            .catch(console.error)
            .finally(() => setLoading(false));
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

                toast.success('Settings updated successfully!');
            } else {
                toast.error(`Error: ${result.error || 'Failed to update settings'}`);
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Error updating settings');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers({ search });
    };

    const handleApplyFilter = () => {
        if (startDate && endDate) {
            fetchUsers({ start: startDate, end: endDate });
            setShowFilter(false);
        } else {
            toast.error('Please select both start and end dates');
        }
    };

    const clearFilter = () => {
        setStartDate('');
        setEndDate('');
        fetchUsers({ start: '', end: '' });
        setShowFilter(false);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 text-black">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>

            {/* Settings Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
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
                </div>
            </div>

            {/* Registered Users Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Registered Users</h2>

                    <div className="flex items-center gap-4">
                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Search by name or mobile..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none w-64 transition-all"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </form>

                        {/* Filter Icon */}
                        <div className="relative" ref={filterRef}>
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className={`p-2 rounded-lg border-2 transition-all ${showFilter || startDate ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </button>

                            {showFilter && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                                    <h3 className="font-semibold text-gray-800 mb-4">Filter by Date</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">End Date</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={handleApplyFilter} className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700">Apply</button>
                                            <button onClick={clearFilter} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-md text-sm font-medium hover:bg-gray-200">Clear</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                                {loading ? (
                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                                ) : users.length > 0 ? (
                                    users.map((user, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.mobile}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No users found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
