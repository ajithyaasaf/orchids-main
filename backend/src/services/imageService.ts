import cloudinary from '../config/cloudinary';
import { ProductImage } from '@tntrends/shared';

// Default fallback if no folder is specified
const DEFAULT_FOLDER = 'tntrends/products';

interface UploadResult {
    url: string;
    publicId: string;
}

/**
 * Upload image to Cloudinary with optimizations
 * @param folder - (Optional) Target folder. e.g. 'tntrends/banners'
 */
export const uploadImage = async (
    fileBuffer: Buffer,
    filename: string,
    folder: string = DEFAULT_FOLDER // <--- CHANGE 1: Added folder parameter
): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
        console.log(`📤 Starting Cloudinary upload for: ${filename}`);
        console.log(`📁 Target folder: ${folder}`);
        console.log(`📊 Buffer size: ${fileBuffer.length} bytes`);

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder, // <--- CHANGE 2: Use the dynamic folder variable
                public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`,
                transformation: [
                    { width: 600, crop: 'scale' },
                    { quality: 'auto' },
                    { fetch_format: 'auto' },
                ],
            },
            (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error);
                    console.error('Error details:', JSON.stringify(error, null, 2));
                    reject(error);
                } else if (result) {
                    console.log('✅ Cloudinary upload success');
                    console.log('URL:', result.secure_url);
                    console.log('Public ID:', result.public_id);
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Delete image from Cloudinary
 */
export const deleteImage = async (publicId: string): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`✅ Deleted image: ${publicId}`);
    } catch (error) {
        console.error(`❌ Failed to delete image: ${publicId}`, error);
        throw error;
    }
};

/**
 * Delete multiple images from Cloudinary
 */
export const deleteMultipleImages = async (
    images: ProductImage[]
): Promise<void> => {
    try {
        const deletePromises = images.map((img) => deleteImage(img.publicId));
        await Promise.all(deletePromises);
        console.log(`✅ Deleted ${images.length} images`);
    } catch (error) {
        console.error('❌ Failed to delete images:', error);
        throw error;
    }
};