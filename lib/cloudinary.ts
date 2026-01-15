import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image buffer to Cloudinary
 */
export const uploadToCloudinary = async (
    buffer: Buffer,
    folder: string = 'profiles'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else if (result) {
                    resolve(result.secure_url);
                } else {
                    reject(new Error('Upload failed: no result'));
                }
            }
        );

        uploadStream.end(buffer);
    });
};

/**
 * Upload a raw file buffer to Cloudinary
 */
export const uploadRawToCloudinary = async (
    buffer: Buffer,
    publicId: string,
    folder: string = 'data'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                resource_type: 'raw',
                overwrite: true,
                invalidate: true
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary raw upload error:', error);
                    reject(error);
                } else if (result) {
                    resolve(result.secure_url);
                } else {
                    reject(new Error('Upload failed: no result'));
                }
            }
        );

        uploadStream.end(buffer);
    });
};

/**
 * Get a raw file from Cloudinary
 */
export const getRawFromCloudinary = async (url: string): Promise<Buffer> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch raw file from Cloudinary: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
};

export default cloudinary;
