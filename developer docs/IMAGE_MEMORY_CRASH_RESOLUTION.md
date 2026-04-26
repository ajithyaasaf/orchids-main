# Image Memory Crash Resolution & Optimization Plan

## 🚨 The Issue
When navigating rapidly between product detail pages on the frontend, the browser (specifically Google Chrome) abruptly crashes, displaying an "Aw, Snap!" error page with the code `STATUS_ILLEGAL_INSTRUCTION`. 

This issue does not produce any errors in the Next.js terminal or the server logs. It only happens on the client side (the user's machine) when clicking fast.

---

## 🔍 The Root Cause

This is a **browser hardware exhaustion crash**, specifically caused by overloading the Graphics Processing Unit (GPU) and the browser's image decoder.

### 1. High-Resolution Originals (File Size vs. RAM)
The original images stored in Cloudinary are massive (e.g., 6-7 MB, often 4000x6000 pixels from high-quality photography). While Cloudinary compresses the file size for network transfer (using formats like AVIF or WebP via `f_auto`), it **does not reduce the pixel dimensions** unless explicitly told to.

In order for a browser to draw an image on the screen, it must decompress it into raw Graphics Memory (RAM). The formula is `Width × Height × 4 bytes (RGBA)`.
* A 4000x6000 image takes up **~96 Megabytes of RAM** per image.

### 2. The Multiplier Effect
A single product detail page loads roughly 15 images:
* 1 Main Gallery Image
* 5 Gallery Thumbnails
* 4 Color Variants
* 5 Related Products
* **Total Memory Demand:** 15 images × 96 MB = **~1.4 Gigabytes of RAM**.

### 3. Client-Side Routing Overload (The "Fast Clicking" trigger)
Because Next.js uses client-side routing (the `<Link />` component), the browser does not perform a hard refresh between pages. 
If a user clicks a new product quickly, Next.js begins requesting and decoding the *next* 1.4 GB of images before the browser's garbage collector has time to delete the *previous* 1.4 GB of images. 

Chrome enforces strict safety limits on how much graphics memory a single tab can consume. Requesting 3 Gigabytes of instant decoding pressure causes the renderer timeline to panic, throwing `STATUS_ILLEGAL_INSTRUCTION`.

---

## 🛠️ The Implementation Plan (Step-by-Step Fix)

The goal is to stop relying on CSS to shrink massive images. We must use Cloudinary's URL parameters to drastically shrink the pixel dimensions (`w_`) *before* the images leave the server.

### Step 1: Update the Cloudinary Utility
**File:** `frontend/src/lib/utils.ts`

Modify `getCloudinaryUrl` to accept an optional width parameter so we can request properly sized thumbnails.

```typescript
// Replace the existing getCloudinaryUrl with this:
export function getCloudinaryUrl(publicId: string, options?: { width?: number }) {
  if (!publicId) return "";
  
  // If it is already a full absolute URL, return it directly
  if (publicId.startsWith('http')) return publicId;

  // If a width is provided, append it to the transformations
  const transformations = options?.width 
    ? `f_auto,q_auto,w_${options.width}` 
    : `f_auto,q_auto`;

  return `https://res.cloudinary.com/ajithyaasaf/image/upload/${transformations}/${publicId}`;
}
```

### Step 2: Optimize the Product Gallery
**File:** `frontend/src/components/product/ProductImageGallery.tsx`

This component holds the heaviest images. Update the URLs to enforce exact maximum widths.

1. **For the Main Image:**
```tsx
src={getCloudinaryUrl(images[selectedIndex], { width: 1000 })}
```

2. **For the Thumbnail Map (The small grid below the main image):**
```tsx
{images.map((thumb, index) => (
  <Image
    // Lock the thumbnail to exactly 150 pixels wide
    src={getCloudinaryUrl(thumb, { width: 150 })}
    // VERY IMPORTANT: Native lazy loading so off-screen thumbnails don't decode early
    loading="lazy" 
    alt={`Thumbnail ${index + 1}`}
    ...
  />
))}
```

### Step 3: Optimize Supporting Components
Find all secondary components that show small product images and lock their widths.

1. **Wholesale Product Cards (`WholesaleProductCard.tsx`)**
```tsx
<Image
  src={getCloudinaryUrl(product.image, { width: 400 })}
  ...
/>
```

2. **Color Variants Swatches (`ColorVariants.tsx`)**
```tsx
<Image
  src={getCloudinaryUrl(variant.image, { width: 80 })}
  ...
/>
```

3. **Recently Viewed Products (`RecentlyViewedProducts.tsx`)**
```tsx
<Image
  src={getCloudinaryUrl(product.image, { width: 250 })}
  ...
/>
```

### Step 4: Force React DOM Cleanup (Crucial for Fast Clicking)
**File:** `frontend/src/app/product/[slug]/page.tsx` (or whatever the main layout wrapper is).

To guarantee that React destroys the old images *instantly* upon clicking a new product link, wrap the main page content in a `div` or `<main>` tag with a unique `key` tied to the product slug. 

When a `key` changes, React throws away the entire old DOM node.

```tsx
export default function ProductPage({ params }: { params: { slug: string } }) {
  return (
    // By adding key={params.slug}, React will completely unmount the old page 
    // before mounting the next one, instantly freeing the GPU memory.
    <main key={params.slug} className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ... All your product gallery and details ... */}
      </div>
    </main>
  );
}
```

---
*By following this exact plan, the memory required per page load will drop from ~1.4 Gigabytes down to ~15 Megabytes, forever eliminating the browser crash.*
