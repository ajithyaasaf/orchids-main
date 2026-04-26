# Orchid Wholesale - Cloudinary Image Handling Guide

This document outlines the standard operating procedure for handling product images in the Orchid Wholesale application. We use Cloudinary to automatically resize, compress, and deliver images to the frontend in Next-Gen formats (WebP/AVIF).

## Core Principle

**NEVER store full `https://res.cloudinary.com/...` URLs in the database.**
**ALWAYS store just the Cloudinary `public_id` (e.g. `wholesale/products/boys/shirts/style1`).**

Our frontend app uses a centralized utility function (`getCloudinaryUrl`) to dynamically build the absolute URL at render-time. 

### Why do we do this?
1. **Performance**: We can apply `f_auto` and `q_auto` to ensure the smallest possible payload is delivered without manual compression.
2. **Responsiveness**: `w_{width}` scaling allows the server to generate thumbnails dynamically, without requiring multiple images to be uploaded per product.
3. **Maintainability**: If the Cloudinary Cloud Name changes, or we decide to change optimization strategies, we just update the utility function instead of migrating thousands of database records.

---

## Workflow: How to upload images for a New Product Category

When you need to add a completely new product category and corresponding images to the database, follow these steps:

### Option 1: Updating via Backend Sync Script (Recommended for Bulk)
If you are uploading dozens of new images to Cloudinary via their dashboard and you want the database to cleanly sync all of them:

1. **Upload** all the new product images into specifically categorized folders in Cloudinary (e.g. `wholesale/products/girls/frocks/frock16`). 
2. Open the script `backend/src/scripts/fixProductImages.ts`.
3. Locate the `FOLDER_MAP` dictionary at the top of the file.
4. Add the exact name of the new Cloudinary folder and the corresponding Firestore product document title.
   ```ts
   const FOLDER_MAP: Record<string, string> = {
     // ... existing mappings
     'frock16': 'Wholesale Frock - Style 16',
   };
   ```
5. Run the script:
   ```bash
   cd backend
   npx ts-node -r tsconfig-paths/register src/scripts/fixProductImages.ts
   ```
   *The script will query Cloudinary, grab the new `public_id` for every image in that folder, sort them recursively, and save those exact strings into your Firebase product document.*

### Option 2: Uploading via the Admin Panel / Firebase Manual Entry
If you are adding a single product using the internal Admin Panel or manually editing the Firebase document:

1. **Upload** the new image directly to Cloudinary using their Media Library Dashboard.
2. Under the image in the dashboard, trace the **Public ID** (it usually looks like `wholesale/products/category/file_name`).
3. **Copy only the Public ID.** 
4. In your admin dashboard or Firestore console, paste just that string into the products `images` array. Do **NOT** paste `https://...`.

---

## Developer Guide: Rendering Images on the Frontend

Whenever you are building a new component that requires a product image, you must use the `getCloudinaryUrl` builder function, wrapped in the Next.js `<Image>` component.

### Example: Product Cards
```tsx
import Image from 'next/image';
import { getCloudinaryUrl, PRODUCT_CARD_IMG_OPTS } from '@/lib/cloudinaryImage';

export function ProductCard({ imagePublicId }) {
  // getCloudinaryUrl converts the public_id into an optimized absolute URL.
  const optimizedUrl = getCloudinaryUrl(imagePublicId, PRODUCT_CARD_IMG_OPTS);

  return (
    <Image
      src={optimizedUrl}
      alt="Product"
      fill // use fill layout usually
      className="object-cover"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      // Note: Do not pass a static `quality` prop. Cloudinary q_auto handles it!
    />
  );
}
```

### Fallback/Legacy Compatibility
If an admin *accidentally* pastes a full `https://res.cloudinary.com/...` string into the database instead of the `public_id`, the `getCloudinaryUrl` function has a built-in safety net:
```ts
if (isAbsoluteUrl(publicId)) {
  return publicId; // Fails gracefully and serves the unoptimized URL instead of breaking.
}
```
However, using the raw `public_id` is strictly required for the site to maintain 100 on Google Lighthouse performance scores.

---

## ⚙️ Environment Variables & Configuration
For the local development server or production builds to connect to Cloudinary, the following environment variables **must** be set:
- **Frontend** (`.env.local` / Vercel):
  `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name`
- **Backend Sync Script** (`.env`):
  `CLOUDINARY_CLOUD_NAME=your_cloud_name`
  `CLOUDINARY_API_KEY=your_api_key`
  `CLOUDINARY_API_SECRET=your_api_secret`

---

## 📈 Advanced Strategy & SEO Best Practices

Future developers modifying the UI should adhere to these Next.js performance strategies when handling Cloudinary images:

1. **LCP (Largest Contentful Paint) & Priority:** 
   If an image appears "Above the fold" (visible immediately on page load, like the hero image or the first 2-4 product cards), you MUST pass `priority={true}` to the Next.js `<Image/>` component. This prevents lazy loading and tells the browser to fetch the image immediately, securing a fast LCP score.
2. **Next.js Loader Configuration:**
   We have bypassed the default Next.js server-side image optimization in `next.config.js` by explicitly using a custom Cloudinary loader. Do not change this back to `default`, as that would cause "double processing" (Next.js trying to compress an image Cloudinary already compressed), skyrocketing server costs and slowing down load times.
3. **Database Script Limits:**
   The `fixProductImages.ts` script fetches images via the `resources_by_asset_folder` API. Note that it currently passes `{ max_results: 20 }`. If a single product has more than 20 images in its specific folder, you must increase this limit in the script.

---

## 🧹 Housekeeping & Organization

To keep the Cloudinary media library manageable as the business grows, follow these organizational standards:

### 1. Naming Conventions (Public IDs)
When uploading manually, always rename your files locally **before** uploading to Cloudinary.
- **Good**: `red-cotton-shirt-front.jpg` -> becomes `red-cotton-shirt-front`
- **Bad**: `IMG_5921.jpg` -> becomes `IMG_5921` (unsearchable)
- **Folder Path**: Always follow the nested structure: `wholesale/products/[department]/[category]/[product-name]`

### 2. Backups
Cloudinary acts as your **Delivery Source of Truth**, but you should always maintain a local or external drive backup of the original high-resolution master files. Cloudinary provides a "Download Folder" feature if you ever need to retrieve assets in bulk.

### 3. Missing Images / Fallbacks
In the `getCloudinaryUrl` utility, we recommend adding a `placeholder` public ID to the config. If a product in the database refers to a `public_id` that was accidentally deleted from Cloudinary, you can update the utility to return a "Image Coming Soon" placeholder globally.


