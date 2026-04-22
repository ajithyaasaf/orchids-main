import path from 'path';
import fs from 'fs';
import cloudinary from '../config/cloudinary';

/**
 * Cloudinary Upload Script
 * 
 * Usage:
 * 1. Ensure .env has CLOUDINARY credentials
 * 2. Set the LOCAL_DIR to the folder containing images
 * 3. Set the CLOUDINARY_BASE_FOLDER (e.g., 'products/wholesale/frocks')
 * 4. Run: npx ts-node -r tsconfig-paths/register src/scripts/uploadToCloudinary.ts
 */

const LOCAL_DIR = path.resolve(__dirname, '../../../frontend/public/images/Products/Frocks');
const CLOUDINARY_BASE_FOLDER = 'wholesale/products/girls/frocks';

async function uploadFolder(localPath: string, cloudinaryPath: string) {
    const items = fs.readdirSync(localPath);

    for (const item of items) {
        const fullLocalPath = path.join(localPath, item);
        const stats = fs.statSync(fullLocalPath);

        if (stats.isDirectory()) {
            // Recursive upload for nested folders (frock1, frock2, etc.)
            await uploadFolder(fullLocalPath, `${cloudinaryPath}/${item}`);
        } else if (stats.isFile() && /\.(jpg|jpeg|png|webp|gif)$/i.test(item)) {
            // Upload image file
            const publicId = path.parse(item).name; // Use filename as public ID
            
            try {
                console.log(`📤 Uploading ${item} to ${cloudinaryPath}/${publicId}...`);
                
                const result = await cloudinary.uploader.upload(fullLocalPath, {
                    folder: cloudinaryPath,
                    public_id: publicId,
                    overwrite: true,
                    resource_type: 'image'
                });

                console.log(`✅ Success! URL: ${result.secure_url}`);
            } catch (error) {
                console.error(`❌ Failed to upload ${item}:`, error);
            }
        }
    }
}

async function run() {
    console.log('🚀 Starting Cloudinary Bulk Upload...');
    console.log(`📂 Source: ${LOCAL_DIR}`);
    console.log(`☁️  Destination: ${CLOUDINARY_BASE_FOLDER}`);

    if (!fs.existsSync(LOCAL_DIR)) {
        console.error('❌ Error: Local directory does not exist!');
        return;
    }

    try {
        await uploadFolder(LOCAL_DIR, CLOUDINARY_BASE_FOLDER);
        console.log('\n✨ All uploads finished!');
    } catch (err) {
        console.error('💥 Fatal error during upload process:', err);
    }
}

run();
