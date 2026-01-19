'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

export default function ProfilesPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [isSlotOpen, setIsSlotOpen] = useState(false);
    const [hasFiltered, setHasFiltered] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchInitialData();
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

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch settings to check slot
            const settingsRes = await fetch('/api/admin/settings');
            const settings = await settingsRes.json();

            const now = new Date();
            const start = settings.registrationStartDate ? new Date(settings.registrationStartDate) : null;
            const end = settings.registrationEndDate ? new Date(settings.registrationEndDate) : null;

            // Set end to end of day
            if (end) end.setHours(23, 59, 59, 999);

            const isOpen = settings.registrationOpen &&
                (!start || now >= start) &&
                (!end || now <= end);

            setIsSlotOpen(isOpen);

            // 2. Fetch profiles
            if (isOpen) {
                const dataRes = await fetch('/api/admin/data');
                const data = await dataRes.json();
                setProfiles(data.profiles);
            } else {
                setProfiles([]); // Show nothing by default if slot is closed
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const fetchData = (params?: { start?: string, end?: string, search?: string }) => {
        setLoading(true);
        setHasFiltered(true); // Mark that user has applied a filter/search

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
            .then(data => setProfiles(data.profiles))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData({ search });
    };

    const handleApplyFilter = () => {
        if (startDate && endDate) {
            fetchData({ start: startDate, end: endDate });
            setShowFilter(false);
        } else {
            toast.error('Please select both start and end dates');
        }
    };

    const clearFilter = () => {
        setStartDate('');
        setEndDate('');
        setHasFiltered(false);
        fetchInitialData(); // Reset to initial state
        setShowFilter(false);
    };

    return (
        <div className="space-y-8 text-black">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">User Profiles</h1>

                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Search by mobile..."
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Father's Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mother's Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Education</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Picture</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                            ) : profiles.length > 0 ? (
                                profiles.map((profile, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{profile.fullName || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{profile.mobile}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{profile.fatherName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{profile.motherName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{profile.dob}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{profile.education}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {profile.picture ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-12 border rounded overflow-hidden bg-gray-50">
                                                        <img src={profile.picture} alt="Profile" className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 truncate max-w-[60px]" title={profile.picture.split('/').pop()}>
                                                        {profile.picture.split('/').pop()}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">No Image</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        {!isSlotOpen && !hasFiltered ? (
                                            <div className="flex flex-col items-center">
                                                <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p>No active registration slot. Apply a filter to see historical data.</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p>No profiles found</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
