# Proposal: HSN Code Automation & GST Compliance

## 1. Executive Summary
During the application analysis, a critical gap was identified in the B2B Tax Invoice generation logic. Currently, the **HSN (Harmonized System of Nomenclature)** codes—required for legal GST compliance in India—are "hardcoded" as a single value (`6204`) for all products. This document outlines a plan to automate HSN assignment based on product categories while maintaining flexibility for manual overrides.

---

## 2. Current Problem
In the existing codebase (`printDocuments.ts` and `pdfGeneratorService.ts`), the HSN summary table is static.
*   **Issue:** Every invoice generated (whether for Kids, Newborn, or Women's wear) displays HSN `6204` (Women's Garments).
*   **Risk:** This is technically incorrect for Kids' wear (typically HSN `6111`) and can cause compliance confusion for B2B customers claiming Input Tax Credit (ITC).
*   **Data Gap:** There is currently no field in the "Add Product" form or the Database to store unique HSN codes for different items.

---

## 3. Proposed Solution: "Auto-Fill with Override"
We suggest a two-layer approach that balances **speed** (automation) and **control** (flexibility).

### Layer 1: Category-Based Automation
We will define "Smart Rules" in the background. As soon as you select a category for a new product, the system will automatically know the correct HSN code.
*   **Kids Wear / Newborn** → Automatically assigns `6111`
*   **Women's Wear** → Automatically assigns `6204`
*   **Others** → Automatically assigns a defined default.

### Layer 2: The Product Field
A new, editable field called **"HSN Code"** will be added to the Product Creation form.
*   **How it works:** When you pick "Kids Wear", the number `6111` will instantly appear in this box. 
*   **Manual Control:** If you ever sell a special item that needs a different code, you can simply click the box and type a new number.

---

## 4. Implementation Roadmap

### Step 1: Database & Shared Types
*   Add `hsnCode` to the `WholesaleProduct` interface in the `shared` folder.
*   Update `categories.ts` to include a `defaultHsn` for each category.

### Step 2: Admin Interface
*   Add the "HSN Code" input field to `WholesaleProductForm.tsx`.
*   Add logic to detect category changes and auto-fill the HSN field.

### Step 3: Backend Order Logic
*   Update `wholesaleOrderService.ts` to ensure that when an order is placed, the HSN code is saved into the order records. This ensures that even if you change a product's HSN next year, the *old* invoices remain historically accurate.

### Step 4: PDF Generation
*   Update the PDF and Print engines to read the HSN from the order data.
*   The "GST Tax Summary" table will now dynamically list all HSN codes present in that specific order.

---

## 5. Benefits
1.  **Legal Compliance:** Your Tax Invoices will be 100% accurate for all product types.
2.  **Zero Effort:** You don't have to memorize or type codes; the computer does it based on the category.
3.  **B2B Professionalism:** Your buyers will receive accurate documents for their own tax filing.

---
**Status:** *Awaiting Approval to Begin Implementation*
**Date:** May 13, 2026
**Author:** Gemini CLI Agent
