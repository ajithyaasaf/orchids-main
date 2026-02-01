# Delivery System & Wholesale Migration Analysis

**Date:** 2026-02-01
**Project:** Wholesale Orchids (Migration from TN Trends Retail)
**Status:** Validated Plan (Simplified)

## 1. Executive Summary
This document consolidates all analysis regarding the current delivery infrastructure and its suitability for a wholesale orchid business.

**Core Verdict:** The existing retail "Hybrid Bundled" shipping model (Hidden Buffer + Flat Fee) is unsuitable. We will migrate to a straightforward **"To-Pay" (FOB) Model**. Complex ERP features like Split Shipments or Order Drafts are **out of scope** as the current retail-style fulfillment is sufficient for client needs.

---

## 2. Analysis of Existing Retail System (Current State)

### A. The "Hidden Shipping Buffer"
*   **Mechanism:** A constant `STANDARD_SHIPPING_BUFFER` (₹79) is automatically added to the base price of every product in `backend/src/config/shippingConfig.ts`.
*   **Effect:** A ₹500 item is displayed as ₹579.
*   **Wholesale Impact:** ❌ **Critical Failure.** Bulk buyers effectively pay double shipping. **Action: Must be removed.**

### B. Tiered Location Logic
*   **Mechanism:** The system splits India into two zones using Pincode prefixes (South vs. Rest of India).
*   **Verdict:** ✅ **Keep Logic.** Useful for simple zoning validation.

---

## 3. Operational Resilience Audit (Strengths) ✅

### A. Invoice Sequencing (GST Compliant)
*   **Status:** **Robust.**
*   **Proof:** `backend/src/services/invoiceNumberService.ts` uses Firestore Transactions. Guarantees no duplicate invoices.

### B. Payment Webhooks (Browser Safe)
*   **Status:** **Robust.**
*   **Proof:** `backend/src/routes/webhook.ts` correctly handles idempotency and stock deduction.

---

## 4. Deep Dive: Systemic Gaps & Risks ❌

### A. Backend Data Schema Gaps
1.  **No Shipping Fee Field:** `WholesaleOrder` database schema has no column to store shipping cost.
2.  **No Weight/Dimensions:** `Product` schema lacks physical specs needed for any future weight estimation.

### B. Checkout "Blindness"
*   **Frontend:** `frontend/src/app/wholesale/checkout/page.tsx`
*   **Issue:** The wholesale checkout summary calculates `Subtotal + GST = Total` but ignores shipping entirely.
*   **Risk:** Customers will assume shipping is free.

### C. Edge Case Risks (Critical)
1.  **Pincode Fragility:** Strict allow-list blocks valid new districts. **Fix:** Default unknown 6-digit codes to "Rest of India" instead of blocking.
2.  **GST Rounding:** Subtotal-based calculation causes minor penny differences. **Fix:** Move to Line-Item rounding.
3.  **Refund Automation:** Admin "Cancel" does not auto-refund money. **Fix:** Integrate Razorpay Refund API.

---

## 5. Strategic Recommendations

### Recommendation A: The "To-Pay" (FOB) Model (Primary)
**Why:** Solves the complexity of live plant shipping costs without over-engineering.
1.  **Process:** Customer pays **Goods + GST** online.
2.  **Logistics:** The UI explicitly states **"Shipping: To Pay on Delivery"**.
3.  **Execution:** You ship via transport (VRL, Professional, Railways). The customer pays the transporter directly.

### Recommendation B: Simple Schema Updates
1.  **Update Schema:** Add `shippingMethod` ('to_pay') to `WholesaleOrder`.
2.  **Future Proofing:** Add `weight` to `Product` schema (optional, but good practice).

---

## 6. Migration Checklist
1.  [ ] **Pricing:** Remove `STANDARD_SHIPPING_BUFFER` from wholesale logic.
2.  [ ] **Schema:** Add `shippingMethod` to `WholesaleOrder`.
3.  [ ] **Checkout UI:** Add "Freight to be paid on delivery" disclaimer.
4.  [ ] **Resilience:** Relax Pincode validation rules (Allow unknown 6-digit codes).
5.  [ ] **Finance:** Implement Line-Item GST calculation logic.
6.  [ ] **Admin:** Integrate Razorpay Refund API for cancellations.
