# Detailed Technical Specification: HSN Code Automation & GST Compliance

## 1. Introduction & Context
In the Indian B2B (Business-to-Business) landscape, the **Harmonized System of Nomenclature (HSN)** code is not just a label; it is a legal requirement for Goods and Services Tax (GST) compliance. Every product category in the apparel industry is governed by specific HSN codes that determine the taxability and classification of the goods.

This document provides an exhaustive technical and functional roadmap for implementing a robust HSN management system within the Orchid Hub platform.

---

## 2. Analysis of the Current "Hardcoded" State
### 2.1 The Bottleneck
Currently, the system's invoice generation logic (`printDocuments.ts` and `pdfGeneratorService.ts`) utilizes a **static implementation**.
*   **Static HSN:** `6204`
*   **Static Description:** "Women's Garments / Apparel"
*   **Impact:** Even if a bulk order consists entirely of "Newborn Essentials" (which should be HSN `6111`), the generated Tax Invoice will incorrectly claim them as Women's Suits/Blazers.

### 2.2 The Technical Gap
*   **Database (Firestore):** The `wholesaleProducts` collection lacks an `hsnCode` field.
*   **Form Logic:** The `WholesaleProductForm.tsx` component does not have an input for tax classification.
*   **Order Snapshot:** The `wholesaleOrders` collection does not store the HSN code at the time of purchase, making it impossible to reconstruct accurate historical invoices if global rules change.

---

## 3. The Proposed "Smart Inheritance" Architecture
The core philosophy is **Automation with Manual Sovereignty**. We will implement a system where the computer handles the "Common Case" while allowing the human to handle the "Exception."

### 3.1 Data Model Changes
We will update the shared type definitions (`shared/types.ts`) to include:
*   `WholesaleProduct.hsnCode`: The specific code for the product.
*   `WholesaleBundleItem.hsnCode`: The "Snapshot" code stored within an order.

### 3.2 Category-Level Rule Engine
In `shared/categories.ts`, each category object will be enhanced with a `defaultHsn` property:
*   **Newborn / Kids:** `6111` (Babies' garments and clothing accessories, knitted or crocheted).
*   **Boys / Girls:** `6103` / `6104`.
*   **Women:** `6204` (Suits, ensembles, jackets, dresses, skirts).

---

## 4. Technical Implementation Detail

### Step 1: Frontend Admin Workflow
1.  **Form Enhancement:** Add a new "Taxation" section in `WholesaleProductForm.tsx`.
2.  **Auto-Fill Logic:** 
    *   Add a `useEffect` hook that watches the `category` field.
    *   When the category changes, look up the `defaultHsn` from the category rules.
    *   Automatically update the `hsnCode` state in the form.
3.  **UI Visual Feedback:** The field will be pre-filled but highlighted so the admin knows they can click and change it if necessary.

### Step 2: Backend Order Integrity
1.  **Order Creation (`wholesaleOrderService.ts`):** During the `createWholesaleOrder` transaction, the service will fetch the `hsnCode` from the product document.
2.  **Snapshotting:** This code will be saved directly into the `items` array inside the `wholesaleOrders` document.
    *   *Why?* If the government changes the HSN for "Kids Wear" in 2027, your invoices from 2026 must still show the 2026 code.

### Step 3: Dynamic PDF & Print Rendering
1.  **Aggregation Logic:** Instead of printing a single row in the GST Summary, the engine will:
    *   Scan all items in the order.
    *   Group items by their HSN code (e.g., all 6111 items together, all 6204 items together).
    *   Calculate the subtotal and tax for each group.
2.  **Dynamic Table Construction:** The Tax Summary table will now have one row for every unique HSN code found in the order.

---

## 5. User Interface (UI) Mockup Description
*   **Location:** Under "Pricing & Inventory" section in the Add Product form.
*   **Label:** "HSN / SAC Code"
*   **Hint Text:** "Automatically assigned based on category. Change only if this specific item falls under a different tax bracket."
*   **Validation:** Must be a 4, 6, or 8-digit numeric string (Standard GST format).

---

## 6. Business Benefits & Compliance
*   **Accuracy:** Eliminates incorrect HSN reporting on B2B invoices.
*   **Scalability:** Allows Orchid Hub to expand into accessories, footwear, or other textiles by simply adding new categories with different HSN rules.
*   **Audit-Ready:** Provides a clear paper trail for GST audits, as every line item is correctly classified at the source.

---
**Status:** *Specification Finalized*
**Author:** Gemini CLI Agent (Software Architect)
**Project:** Orchid Hub Wholesale Platform
