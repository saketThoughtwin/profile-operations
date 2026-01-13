'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();
    const [message, setMessage] = useState('');
    const [userName, setUserName] = useState('User');
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
        fetch('/api/user/profile')
            .then(res => res.json())
            .then(data => {
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
            })
            .catch(console.error);
    }, []);

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
        setMessage('');

        const submitData = new FormData(e.currentTarget);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                body: submitData,
            });

            if (res.ok) {
                setMessage('Profile saved successfully!');
            } else {
                setMessage('Failed to save profile.');
            }
        } catch (err) {
            setMessage('Error saving profile.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">User Dashboard</h1>
                        <p className="text-sm text-gray-600 mt-1">Welcome, {userName}</p>
                    </div>
                    <button onClick={handleLogout} className="text-red-500 hover:text-red-700">Logout</button>
                </div>

                {message && <p className="text-green-500 mb-4">{message}</p>}

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
                                className="mt-1 block w-full border-gray-600 p-2 rounded text-gray-900"
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
                                className="mt-1 block w-full border-gray-600 p-2 rounded text-gray-900"
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
                                className="mt-1 block w-full border-gray-600 p-2 rounded text-gray-900"
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
                                className="mt-1 block w-full border-gray-600 p-2 rounded text-gray-900"
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
                            className="mt-1 block w-full border-gray-600 p-2 rounded text-gray-900"
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
                            className="mt-1 block w-full border-gray-600 p-2 rounded text-gray-900"
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
                            className="mt-1 block w-full border-gray-600 p-2 rounded text-gray-900"
                            placeholder="Enter your complete address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-900">Picture</label>
                        <input name="picture" type="file" accept="image/*" required className="mt-1 block w-full text-gray-900" />
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                        Save Profile
                    </button>
                </form>
            </div>
        </div>
    );
}
