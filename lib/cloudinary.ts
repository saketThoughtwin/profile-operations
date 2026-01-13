import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image buffer to Cloudinary
 * @param buffer - Image buffer
 * @param folder - Folder path in Cloudinary (default: 'profiles')
 * @returns Secure URL of uploaded image
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

export default cloudinary;
