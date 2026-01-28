import { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { auth } from '@/lib/firebase';

/**
 * ImageUpload Component
 * 
 * Reusable component for uploading images to Cloudinary
 * Features:
 * - Drag & drop support
 * - Multiple image upload
 * - Preview gallery
 * - Delete uploaded images
 * - Loading states
 * - Error handling
 */

interface ImageUploadProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    maxImages?: number;
    className?: string;
}

export default function ImageUpload({
    images,
    onImagesChange,
    maxImages = 5,
    className = '',
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string>('');
    const [dragActive, setDragActive] = useState(false);

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('Not authenticated');

        // Force refresh token to ensure latest claims (admin role) are present
        const token = await currentUser.getIdToken(true);

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Upload failed');
        }

        return data.url;
    };

    const handleFiles = async (files: FileList) => {
        if (images.length >= maxImages) {
            setError(`Maximum ${maxImages} images allowed`);
            return;
        }

        const remainingSlots = maxImages - images.length;
        const filesToUpload = Array.from(files).slice(0, remainingSlots);

        // Validate file types
        const validFiles = filesToUpload.filter(file => {
            if (!file.type.startsWith('image/')) {
                setError(`${file.name} is not an image`);
                return false;
            }
            // Max 5MB per image
            if (file.size > 5 * 1024 * 1024) {
                setError(`${file.name} is too large (max 5MB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setUploading(true);
        setError('');

        try {
            const uploadPromises = validFiles.map(file => uploadToCloudinary(file));
            const uploadedUrls = await Promise.all(uploadPromises);
            onImagesChange([...images, ...uploadedUrls]);
        } catch (err: any) {
            setError(err.message || 'Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const removeImage = (index: number) => {
        onImagesChange(images.filter((_, i) => i !== index));
    };

    return (
        <div className={className}>
            <label className="block text-sm font-medium mb-2">
                Product Images {images.length > 0 && `(${images.length}/${maxImages})`}
            </label>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                    {error}
                </div>
            )}

            {/* Image Gallery */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                    {images.map((url, index) => (
                        <div key={index} className="relative group aspect-square">
                            <img
                                src={url}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {index === 0 && (
                                <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                                    Primary
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Area */}
            {images.length < maxImages && (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                    <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        multiple
                        onChange={handleFileInput}
                        className="hidden"
                        disabled={uploading}
                    />

                    <label htmlFor="image-upload" className="cursor-pointer">
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                                <p className="text-sm text-gray-600">Uploading images...</p>
                            </>
                        ) : (
                            <>
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    PNG, JPG, WEBP up to 5MB each ({maxImages - images.length} remaining)
                                </p>
                            </>
                        )}
                    </label>
                </div>
            )}
        </div>
    );
}
