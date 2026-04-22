/**
 * Cloudinary Image Utilities
 *
 * Best Practice: Store only the Cloudinary `public_id` in the database.
 * Construct the full optimized URL at render time using this utility.
 *
 * Benefits:
 *  - f_auto: Serves WebP/AVIF to browsers that support it, JPEG to older ones
 *  - q_auto: Compresses to the lowest quality that is visually indistinguishable
 *  - w_{width}: Delivers exactly the right pixel width for the device
 *  - Changing cloud name, CDN, or format options requires a 1-line change,
 *    not a database migration.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';

if (!CLOUD_NAME && typeof window !== 'undefined') {
  console.warn(
    '[Orchid] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set. ' +
      'Images will not load. Add it to your .env.local file.'
  );
}

const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

/** Supported Cloudinary crop modes */
type CropMode = 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';

export interface CloudinaryImageOptions {
  /** Pixel width to request. Cloudinary will rescale the image accordingly. */
  width?: number;
  /** Pixel height to request. */
  height?: number;
  /** Crop strategy. Defaults to "fill" (covers the area, maintains aspect ratio). */
  crop?: CropMode;
  /** Override quality. Defaults to "auto" which lets Cloudinary choose. */
  quality?: 'auto' | 'auto:best' | 'auto:eco' | number;
  /** Override format. Defaults to "auto" which delivers WebP/AVIF. */
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
}

/**
 * Detect whether a value is already a full URL (starts with http/https or //).
 * This handles legacy products that still have absolute URLs in the database
 * during migration — they are returned as-is without modification.
 */
function isAbsoluteUrl(value: string): boolean {
  return /^(https?:)?\/\//i.test(value);
}

/**
 * Build an optimized Cloudinary URL from a `public_id`.
 *
 * @example
 * // Returns: https://res.cloudinary.com/my-cloud/image/upload/f_auto,q_auto,w_800/1_kbiftz
 * getCloudinaryUrl('1_kbiftz', { width: 800 })
 *
 * @example
 * // Returns the input unchanged if it's already a full URL (migration safety)
 * getCloudinaryUrl('https://res.cloudinary.com/...', { width: 800 })
 */
export function getCloudinaryUrl(
  publicId: string,
  options: CloudinaryImageOptions = {}
): string {
  if (!publicId) return '';

  // Backwards-compatibility: if a full URL is stored, return it as-is.
  // This prevents breakage during the migration window.
  if (isAbsoluteUrl(publicId)) {
    return publicId;
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  // Build transformation string
  const parts: string[] = [`f_${format}`, `q_${quality}`];

  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if ((width || height) && crop) parts.push(`c_${crop}`);

  const transformation = parts.join(',');
  return `${BASE_URL}/${transformation}/${publicId}`;
}

/**
 * Returns a set of commonly-needed sizes for a product card image.
 * Use this with the `sizes` attribute on `next/image` for responsive images.
 *
 * @example
 * <Image
 *   src={getCloudinaryUrl(publicId, PRODUCT_CARD_IMG_OPTS)}
 *   sizes={PRODUCT_CARD_SIZES}
 *   ...
 * />
 */
export const PRODUCT_CARD_IMG_OPTS: CloudinaryImageOptions = {
  width: 800,
  quality: 'auto',
  format: 'auto',
  crop: 'fill',
};

export const PRODUCT_GALLERY_MAIN_OPTS: CloudinaryImageOptions = {
  width: 1200,
  quality: 'auto:best',
  format: 'auto',
  crop: 'fill',
};

export const PRODUCT_GALLERY_THUMB_OPTS: CloudinaryImageOptions = {
  width: 200,
  quality: 'auto:eco',
  format: 'auto',
  crop: 'fill',
};

export const OG_IMAGE_OPTS: CloudinaryImageOptions = {
  width: 1200,
  height: 630,
  quality: 'auto',
  format: 'jpg', // OG images should always be JPEG for maximum compatibility
  crop: 'fill',
};
