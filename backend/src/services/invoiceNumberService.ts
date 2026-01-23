/**
 * Invoice Number Generation Service
 * 
 * GST-COMPLIANT INVOICE NUMBERING
 * 
 * Rules:
 * 1. Format: INV-YYYY-XXXXXX (continuous, non-month-resetting)
 * 2. Never reuse numbers (even for cancelled orders)
 * 3. Sequential without gaps (legal requirement)
 * 4. Thread-safe (Firestore transaction)
 */

import { db } from '../config/firebase';
import { Order } from '@tntrends/shared';

/**
 * Generate sequential invoice number using Firestore transaction
 * 
 * Format: INV-2025-000001
 * 
 * @returns Promise<string> - Generated invoice number
 */
export const generateInvoiceNumber = async (): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const counterRef = db.collection('counters').doc('invoice');

    return await db.runTransaction(async (transaction) => {
        const counter = await transaction.get(counterRef);
        const data = counter.data();

        // CRITICAL: Never reset counter (continuous numbering for GST compliance)
        const count = data?.count || 0;
        const newCount = count + 1;

        // Update counter
        transaction.set(counterRef, {
            year: currentYear,
            count: newCount,
            lastUpdated: new Date(),
        }, { merge: true });

        // Format: INV-2025-000001
        return `INV-${currentYear}-${String(newCount).padStart(6, '0')}`;
    });
};

/**
 * Generate sequential credit note number
 * 
 * Format: CN-2025-000001
 * 
 * @returns Promise<string> - Generated credit note number
 */
export const generateCreditNoteNumber = async (): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const counterRef = db.collection('counters').doc('creditNote');

    return await db.runTransaction(async (transaction) => {
        const counter = await transaction.get(counterRef);
        const count = counter.data()?.count || 0;
        const newCount = count + 1;

        transaction.set(counterRef, {
            year: currentYear,
            count: newCount,
            lastUpdated: new Date(),
        }, { merge: true });

        // Format: CN-2025-000001
        return `CN-${currentYear}-${String(newCount).padStart(6, '0')}`;
    });
};

/**
 * Check if order already has an invoice
 * 
 * @param order - Order to check
 * @returns boolean - True if invoice exists
 */
export const hasInvoice = (order: Order): boolean => {
    return !!(order.invoiceNumber && order.invoiceGeneratedAt);
};

/**
 * Get current invoice counter status (for admin visibility)
 * 
 * @returns Promise<{ year: number, count: number }>
 */
export const getInvoiceCounterStatus = async (): Promise<{ year: number; count: number }> => {
    const counterRef = db.collection('counters').doc('invoice');
    const counter = await counterRef.get();
    const data = counter.data();

    return {
        year: data?.year || new Date().getFullYear(),
        count: data?.count || 0,
    };
};

/**
 * Get current credit note counter status
 * 
 * @returns Promise<{ year: number, count: number }>
 */
export const getCreditNoteCounterStatus = async (): Promise<{ year: number; count: number }> => {
    const counterRef = db.collection('counters').doc('creditNote');
    const counter = await counterRef.get();
    const data = counter.data();

    return {
        year: data?.year || new Date().getFullYear(),
        count: data?.count || 0,
    };
};
