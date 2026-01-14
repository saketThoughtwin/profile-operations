'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        mobile: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile: `+91${formData.mobile}`,
                    password: formData.password
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error);
                return;
            }

            // Redirect based on role
            if (data.user.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('Something went wrong');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center text-black">Login</h1>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-900">Mobile</label>
                        <input
                            type="text"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-2 border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 text-gray-900 placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-900">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-2 border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 text-gray-900 placeholder-gray-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Login
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <Link href="/signup" className="text-sm text-indigo-600 hover:text-indigo-500">
                        Don't have an account? Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}
