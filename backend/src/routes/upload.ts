import express, { Request, Response } from 'express';
import multer from 'multer';
import { uploadImage } from '../services/imageService';
import { verifyToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed'));
            return;
        }
        cb(null, true);
    },
});

/**
 * POST /api/upload
 * Upload image to Cloudinary (admin only)
 */
router.post(
    '/',
    verifyToken,
    requireAdmin,
    upload.single('image'),
    async (req: Request, res: Response) => {
        try {
            console.log('📸 Upload request received');
            console.log('User:', req.user);
            console.log('File:', req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : 'No file');

            if (!req.file) {
                console.error('❌ No file in request');
                res.status(400).json({
                    success: false,
                    error: 'No image file provided',
                });
                return;
            }

            console.log('🔄 Uploading to Cloudinary...');
            const result = await uploadImage(req.file.buffer, req.file.originalname);
            console.log('✅ Upload successful:', result);

            res.json({
                success: true,
                data: result,
                message: 'Image uploaded successfully',
            });
        } catch (error: any) {
            console.error('❌ Upload error:', error);
            console.error('Error stack:', error.stack);
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || 'Failed to upload image',
            });
        }
    }
);

export default router;
