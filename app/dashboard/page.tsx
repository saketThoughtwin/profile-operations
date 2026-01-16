'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function DashboardPage() {
    const router = useRouter();
    const [userName, setUserName] = useState('User');
    const [accessDenied, setAccessDenied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        fatherName: '',
        motherName: '',
        fatherOccupation: '',
        motherOccupation: '',
        dob: '',
        education: '',
        address: ''
    });
    const [existingPicture, setExistingPicture] = useState<string | null>(null);

    // Cropping state
    const [imgSrc, setImgSrc] = useState('');
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [showCropModal, setShowCropModal] = useState(false);
    const [croppedFile, setCroppedFile] = useState<File | null>(null);

    const ASPECT_RATIO = 35 / 45; // 35mm * 45mm

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

            // Get user name from API
            let sessionName = 'User';
            try {
                const meRes = await fetch('/api/auth/me');
                if (meRes.ok) {
                    const meData = await meRes.json();
                    sessionName = meData.name || 'User';
                    setUserName(sessionName);
                }
            } catch (e) {
                console.error('Error fetching session:', e);
            }

            // Fetch profile data
            const profileRes = await fetch('/api/user/profile');
            const data = await profileRes.json();

            if (data && !data.error && Object.keys(data).length > 0) {
                setFormData({
                    fullName: data.fullName || sessionName,
                    fatherName: data.fatherName || '',
                    motherName: data.motherName || '',
                    fatherOccupation: data.fatherOccupation || '',
                    motherOccupation: data.motherOccupation || '',
                    dob: data.dob || '',
                    education: data.education || '',
                    address: data.address || ''
                });
                if (data.picture) {
                    setExistingPicture(data.picture);
                }
            } else {
                // Pre-fill with session name if no profile exists yet
                setFormData(prev => ({ ...prev, fullName: sessionName }));
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

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Reset crop
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
            setShowCropModal(true);
        }
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const initialCrop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                ASPECT_RATIO,
                width,
                height
            ),
            width,
            height
        );
        setCrop(initialCrop);
    };

    const getCroppedImg = async () => {
        if (!imgRef.current || !completedCrop) return;

        const canvas = document.createElement('canvas');
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(
                imgRef.current,
                completedCrop.x * scaleX,
                completedCrop.y * scaleY,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY,
                0,
                0,
                completedCrop.width,
                completedCrop.height
            );

            return new Promise<File>((resolve) => {
                canvas.toBlob((blob) => {
                    if (!blob) return;
                    const file = new File([blob], 'cropped_image.jpg', { type: 'image/jpeg' });
                    resolve(file);
                }, 'image/jpeg');
            });
        }
    };

    const handleCropComplete = async () => {
        const file = await getCroppedImg();
        if (file) {
            setCroppedFile(file);
            setShowCropModal(false);
            toast.success('Image cropped successfully!');
        }
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

        // Use cropped file if available
        if (croppedFile) {
            submitData.set('picture', croppedFile);
        } else if (existingPicture) {
            // If no new file but existing picture, we don't need to re-upload
            // But the API expects a file if it's a required field in some logic
            // Let's check the API.
        }

        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                body: submitData,
            });

            if (res.ok) {
                toast.success('Profile saved successfully!');
                // Refresh data to show new image
                checkAccessAndFetchData();
                setCroppedFile(null);
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
                    <div>
                        <label className="block text-sm font-medium text-gray-900">Full Name</label>
                        <input
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full border-2 border-black p-2 rounded text-gray-900"
                        />
                    </div>

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

                    <div className="grid grid-cols-2 gap-4">
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
                            <label className="block text-sm font-medium text-gray-900 mb-1">Picture</label>
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block text-sm">
                                    Upload Picture
                                    <input
                                        name="picture"
                                        type="file"
                                        accept="image/*"
                                        onChange={onSelectFile}
                                        className="hidden"
                                    />
                                </label>
                                {croppedFile && (
                                    <span className="text-xs text-green-600 font-medium truncate max-w-[100px]">
                                        Cropped: {croppedFile.name}
                                    </span>
                                )}
                                {!croppedFile && existingPicture && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-500 font-medium">Existing:</span>
                                        <a href={existingPicture} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[80px]">
                                            View Image
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
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

                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                        Save Profile
                    </button>
                </form>
            </div>

            {/* Crop Modal */}
            {showCropModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                        <h2 className="text-xl font-bold mb-4 text-black">Crop Your Picture (35x45mm)</h2>
                        <div className="max-h-[60vh] overflow-auto mb-4 flex justify-center bg-gray-100 rounded">
                            {imgSrc && (
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={ASPECT_RATIO}
                                >
                                    <img
                                        ref={imgRef}
                                        src={imgSrc}
                                        alt="Crop me"
                                        onLoad={onImageLoad}
                                        className="max-w-full"
                                    />
                                </ReactCrop>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowCropModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCropComplete}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Crop & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
