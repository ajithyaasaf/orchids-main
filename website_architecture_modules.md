# WholeSale Orchids Website - Module Architecture Analysis

This document provides a comprehensive structural breakdown of the WholeSale Orchids website, detailing the various modules that make up its decoupled architecture (Next.js frontend and Node.js/Express backend).

## 1. Frontend Architecture (Next.js App Router)

The frontend application (`website/frontend`) is organized into feature-based routes and shared component modules.

### Feature Modules (Routes - `src/app`)
There are approximately **14 distinct functional route areas**:

1. **Admin (`/admin`)**: Administrative dashboard, product and user management operations.
2. **Authentication (`/auth`)**: Core user authentication flows including login, registration, and password recovery.
3. **E-commerce Core**:
   - `products`, `product`: Main product catalog and individual product detail pages.
   - `collection`: Visual grouping and categorization of products.
   - `search`: Site-wide product and content search functionality.
4. **Checkout & Order Flow (`/checkout` related):**
   - `shipping`: Collection of shipping details and configuration.
   - `order-success`: Post-purchase confirmation and immediate order details.
   - `orders`: Historical order tracking for users.
5. **Wholesale Operations (`/wholesale`)**: Dedicated business-to-business (B2B) specific views and purchasing logic.
6. **User Account (`/profile`)**: User settings, address management, and profile updates.
7. **Information & Legal**: `contact`, `privacy`, `terms` - static informational pages and legal policies.

### Shared Component Modules (`src/components`)
There are **11 core component categories** that provide reusable UI elements across the application:
- `admin` (Admin-specific UI)
- `analytics` (Tracking and metrics UI integrations)
- `checkout` (Checkout forms and summaries)
- `home` (Landing page sections)
- `layout` (Structural elements like headers, footers, sidebars)
- `pages` (Page-level composite components)
- `product` & `products` (Product cards, galleries, and grids)
- `providers` (Global state and context providers)
- `seo` (Search Engine Optimization meta tags and structure)
- `ui` (Base operational UI elements like buttons, inputs, modals)

---

## 2. Backend Architecture (Node.js & Express)

The backend (`website/backend`) utilizes a highly structured Service-Oriented Architecture (SOA), segregating API routing layer from the underlying business logic layer.

### API Route Modules (`src/routes`)
There are **13 distinct API routing controllers** handling HTTP endpoints:

1. **E-Commerce Catalog**: `collections.ts`, `combos.ts` (Product routes are handled indirectly).
2. **Cart & Checkout Flow**: `coupons.ts`, `payment.ts`, `webhook.ts` (for external payment/notification integrations), `settings.ts`.
3. **Internal Operations**: `dashboard.ts`, `invoices.ts`, `upload.ts` (media handling).
4. **B2B / Wholesale Capabilities**:
   - `createWholesaleOrder.ts`
   - `wholesaleCheckout.ts`
   - `wholesaleOrders.ts`
   - `wholesaleProducts.ts`

### Business Logic Services (`src/services`)
The core processing is distributed across **21 specialized domain services**:

1. **Product & Pricing Capabilities**:
   - `collectionService.ts`
   - `comboService.ts`, `comboPricingService.ts`
   - `wholesaleProductService.ts`, `wholesalePricingService.ts`
2. **Analytics & Reporting**:
   - `customerAnalyticsService.ts`
   - `comboAnalyticsService.ts`
   - `dashboardService.ts`
3. **Operations, Stock & Logistics**:
   - `logisticsService.ts`
   - `wholesaleStockService.ts`
4. **Transactions, Invoicing & Billing**:
   - `paymentService.ts`
   - `invoiceService.ts`, `invoiceNumberService.ts`, `pdfGeneratorService.ts`
   - `couponService.ts`
   - `wholesaleOrderService.ts`
5. **Core Infrastructure & Utilities**:
   - `emailService.ts`
   - `imageService.ts`
   - `settingsService.ts`
   - `userService.ts`
   - `webhookService.ts`

## Summary Configuration
The platform's module distribution explicitly reflects a robust separation of concerns, clearly demarcating normal **Retail (B2C)** flows from dedicated **Wholesale (B2B)** operations across both the frontend display and the backend processing pipelines.
