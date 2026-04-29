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
 * If a full Cloudinary URL is stored in the database (legacy or bulk-upload),
 * extract the public_id from it so we can re-apply transformations.
 *
 * Handles two formats:
 *  1. With existing transformations:
 *     .../image/upload/f_auto,q_auto/wholesale/products/.../1.png
 *     → public_id: "wholesale/products/.../1.png"
 *
 *  2. Without transformations (raw upload):
 *     .../image/upload/wholesale/products/.../1.png
 *     → public_id: "wholesale/products/.../1.png"
 *
 * Returns null if the URL is not a Cloudinary URL (e.g. an external CDN).
 */
/**
 * Known Cloudinary single-letter/short transformation keys.
 * A URL segment is a transformation if every comma-separated part
 * starts with one of these keys followed by an underscore.
 * e.g. "c_scale,w_600" → YES | "wholesale" → NO
 */
const CLOUDINARY_PARAM_RE =
  /^(?:w|h|c|q|f|e|g|x|y|z|r|b|l|u|t|ar|fl|bo|co|dpr|pg|vs|du|eo|so|dl)_/;

function isTransformSegment(segment: string): boolean {
  if (!segment) return false;
  return segment.split(',').every((part) => CLOUDINARY_PARAM_RE.test(part.trim()));
}

function extractCloudinaryPublicId(url: string): string | null {
  const uploadMarker = '/image/upload/';
  const idx = url.indexOf(uploadMarker);
  if (idx === -1) return null;

  // Split everything after /image/upload/ into slash-delimited segments
  const segments = url.slice(idx + uploadMarker.length).split('/');

  // Walk forward, discarding every leading segment that looks like a
  // Cloudinary transformation (e.g. "c_scale,w_600", "q_auto", "f_auto").
  // Stop at the first segment that is a real folder or filename.
  let i = 0;
  while (i < segments.length && isTransformSegment(segments[i])) {
    i++;
  }

  const publicId = segments.slice(i).join('/');
  return publicId || null;
}

/**
 * Build an optimized Cloudinary URL from a `public_id` or a stored full URL.
 *
 * @example
 * // Returns: https://res.cloudinary.com/my-cloud/image/upload/f_auto,q_auto,w_800/1_kbiftz
 * getCloudinaryUrl('1_kbiftz', { width: 800 })
 *
 * @example
 * // Parses the public_id and rebuilds with transformations — does NOT return raw
 * getCloudinaryUrl('https://res.cloudinary.com/ajithyaasaf/image/upload/wholesale/products/1.png', { width: 1200 })
 * // → https://res.cloudinary.com/ajithyaasaf/image/upload/f_auto,q_auto,w_1200,c_fill/wholesale/products/1.png
 */
export function getCloudinaryUrl(
  publicId: string,
  options: CloudinaryImageOptions = {}
): string {
  if (!publicId) return '';

  // If a full URL is stored (legacy bulk uploads save full https:// URLs),
  // extract the public_id and fall through to build an optimized URL.
  // We only bypass optimization for truly non-Cloudinary external URLs.
  if (/^(https?:)?\/\//i.test(publicId)) {
    const extracted = extractCloudinaryPublicId(publicId);
    if (!extracted) {
      // Genuinely external URL (e.g. a Firebase Storage or S3 link) — return as-is.
      return publicId;
    }
    // Re-enter with the raw public_id — transformations will now be applied.
    publicId = extracted;
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
  // A card in a 4-column grid is ~300px wide. 400px is plenty for 2x DPR.
  width: 400,
  quality: 'auto',
  format: 'auto',
  crop: 'fill',
};

export const PRODUCT_GALLERY_MAIN_OPTS: CloudinaryImageOptions = {
  // 600px wide: GPU RAM ≈ 600×800×4 ≈ 1.9 MB (Tiny!)
  // Even with 10 images pre-decoded, it's only 20MB. Zero crash risk.
  width: 600,
  quality: 'auto:best',
  format: 'auto',
  crop: 'fill',
};

export const PRODUCT_GALLERY_THUMB_OPTS: CloudinaryImageOptions = {
  width: 150,
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
