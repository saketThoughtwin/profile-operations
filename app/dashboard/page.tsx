'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
    const router = useRouter();
    const [userName, setUserName] = useState('User');
    const [accessDenied, setAccessDenied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        fatherName: '',
        motherName: '',
        fatherOccupation: '',
        motherOccupation: '',
        dob: '',
        education: '',
        address: ''
    });

    useEffect(() => {
        checkAccessAndFetchData();
    }, []);

    const checkAccessAndFetchData = async () => {
        try {
            // Check settings first
            const settingsRes = await fetch('/api/admin/settings');
            const settings = await settingsRes.json();

            if (settings) {
                const { registrationOpen, registrationStartDate, registrationEndDate } = settings;

                // Use local date (YYYY-MM-DD)
                const now = new Date();
                const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                let isOpen = registrationOpen;

                if (isOpen && registrationStartDate && registrationEndDate) {
                    if (today < registrationStartDate || today > registrationEndDate) {
                        isOpen = false;
                    }
                } else if (isOpen && registrationStartDate) {
                    if (today < registrationStartDate) isOpen = false;
                } else if (isOpen && registrationEndDate) {
                    if (today > registrationEndDate) isOpen = false;
                }

                if (!isOpen) {
                    setAccessDenied(true);
                    setLoading(false);
                    return; // Stop execution if access is denied
                }
            }

            // Get user name from cookie
            const cookies = document.cookie.split(';');
            const sessionCookie = cookies.find(c => c.trim().startsWith('user_session='));
            if (sessionCookie) {
                try {
                    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
                    setUserName(sessionData.name || 'User');
                } catch (e) {
                    console.error('Error parsing session:', e);
                }
            }

            // Fetch profile data
            const profileRes = await fetch('/api/user/profile');
            const data = await profileRes.json();

            if (data && !data.error && Object.keys(data).length > 0) {
                setFormData({
                    fatherName: data.fatherName || '',
                    motherName: data.motherName || '',
                    fatherOccupation: data.fatherOccupation || '',
                    motherOccupation: data.motherOccupation || '',
                    dob: data.dob || '',
                    education: data.education || '',
                    address: data.address || ''
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            router.push('/login');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const submitData = new FormData(form);
        const dob = submitData.get('dob') as string;

        // Validation: DOB cannot be in the future
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (dob > today) {
            toast.error('Date of Birth cannot be in the future');
            return;
        }

        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                body: submitData,
            });

            if (res.ok) {
                toast.success('Profile saved successfully!');
                // Reset form
                setFormData({
                    fatherName: '',
                    motherName: '',
                    fatherOccupation: '',
                    motherOccupation: '',
                    dob: '',
                    education: '',
                    address: ''
                });
                form.reset();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to save profile.');
            }
        } catch (err) {
            toast.error('Error saving profile.');
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-gray-700 mb-6">All slots are closed now.</p>
                    <button
                        onClick={handleLogout}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                    >
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-black">User Dashboard</h1>
                        <p className="text-sm text-gray-600 mt-1">Welcome, {userName}</p>
                    </div>
                    <button onClick={handleLogout} className="text-red-500 hover:text-red-700">Logout</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900">Father's Name</label>
                            <input
                                name="fatherName"
                                type="text"
                                value={formData.fatherName}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border-2 border-black p-2 rounded text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900">Mother's Name</label>
                            <input
                                name="motherName"
                                type="text"
                                value={formData.motherName}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border-2 border-black p-2 rounded text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900">Father's Occupation</label>
                            <input
                                name="fatherOccupation"
                                type="text"
                                value={formData.fatherOccupation}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border-2 border-black p-2 rounded text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900">Mother's Occupation</label>
                            <input
                                name="motherOccupation"
                                type="text"
                                value={formData.motherOccupation}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full border-2 border-black p-2 rounded text-gray-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900">Date of Birth</label>
                        <input
                            name="dob"
                            type="date"
                            value={formData.dob}
                            onChange={handleChange}
                            required
                            max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                            className="mt-1 block w-full border-2 border-black p-2 rounded text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900">Education</label>
                        <input
                            name="education"
                            type="text"
                            value={formData.education}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border-2 border-black p-2 rounded text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900">Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="mt-1 block w-full border-2 border-black p-2 rounded text-gray-900"
                            placeholder="Enter your complete address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Picture</label>
                        <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block">
                            Upload Picture
                            <input
                                name="picture"
                                type="file"
                                accept="image/*"
                                required
                                className="hidden"
                            />
                        </label>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                        Save Profile
                    </button>
                </form>
            </div>
        </div>
    );
}
