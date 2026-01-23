/**
 * Invoice Service
 * 
 * Core business logic for invoice generation and management
 * with payment status gates and credit note support
 */

import { Order, OrderRefund } from '@tntrends/shared';
import { AppError } from '../middleware/errorHandler';
import { collections } from '../config/firebase';
import { getOrderById } from './orderService';
import { generateInvoiceNumber, generateCreditNoteNumber, hasInvoice } from './invoiceNumberService';

/**
 * CRITICAL: Invoice eligibility check
 * 
 * Invoice MUST NOT generate for:
 * - Payment failed
 * - Payment pending (including COD until delivered)
 * - Payment cancelled
 * - Order cancelled
 * 
 * @param order - Order to check
 * @returns boolean - True if invoice can be generated
 */
export const canGenerateInvoice = (order: Order): boolean => {
    // RULE 1: Only paid orders
    if (order.paymentStatus !== 'paid') {
        return false;
    }

    // RULE 2: Not cancelled orders
    if (order.orderStatus === 'cancelled') {
        return false;
    }

    return true;
};

/**
 * Check if invoice generation is needed (eligible but not yet generated)
 * 
 * @param order - Order to check
 * @returns boolean - True if invoice should be generated
 */
export const needsInvoiceGeneration = (order: Order): boolean => {
    return canGenerateInvoice(order) && !hasInvoice(order);
};

/**
 * Generate and store invoice number for an order
 * 
 * @param orderId - ID of the order
 * @returns Promise<string> - Generated invoice number
 * @throws AppError if order not found or not eligible
 */
export const generateInvoice = async (orderId: string): Promise<string> => {
    const order = await getOrderById(orderId);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Check if already has invoice
    if (hasInvoice(order)) {
        return order.invoiceNumber!;
    }

    // Check eligibility
    if (!canGenerateInvoice(order)) {
        throw new AppError(
            'Order not eligible for invoice generation (payment not confirmed or order cancelled)',
            400
        );
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Update order with invoice metadata
    await collections.orders.doc(orderId).update({
        invoiceNumber,
        invoiceGeneratedAt: new Date(),
    });

    return invoiceNumber;
};

/**
 * Mark invoice as sent via email
 * 
 * @param orderId - ID of the order
 */
export const markInvoiceSent = async (orderId: string): Promise<void> => {
    await collections.orders.doc(orderId).update({
        invoiceSent: true,
        updatedAt: new Date(),
    });
};

/**
 * Mark packing slip as printed (warehouse workflow)
 * 
 * @param orderId - ID of the order
 */
export const markPackingSlipPrinted = async (orderId: string): Promise<void> => {
    await collections.orders.doc(orderId).update({
        packingSlipPrinted: true,
        updatedAt: new Date(),
    });
};

/**
 * Generate credit note for a refund
 * 
 * @param orderId - ID of the order
 * @param refundAmount - Amount to refund
 * @param refundReason - Reason for refund
 * @param refundMethod - Method of refund
 * @returns Promise<string> - Generated credit note number
 * @throws AppError if order not found or doesn't have invoice
 */
export const generateCreditNote = async (
    orderId: string,
    refundAmount: number,
    refundReason: string,
    refundMethod: 'razorpay' | 'bank_transfer' | 'store_credit' = 'razorpay'
): Promise<string> => {
    const order = await getOrderById(orderId);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    if (!order.invoiceNumber) {
        throw new AppError('Cannot create credit note without invoice', 400);
    }

    // Validate refund amount
    const existingRefunds = order.refunds || [];
    const totalRefunded = existingRefunds.reduce((sum, r) => sum + r.refundAmount, 0);

    if (totalRefunded + refundAmount > order.totalAmount) {
        throw new AppError('Refund amount exceeds order total', 400);
    }

    // Generate credit note number
    const creditNoteNumber = await generateCreditNoteNumber();

    // Create refund record
    const refund: OrderRefund = {
        creditNoteNumber,
        refundAmount,
        refundReason,
        refundDate: new Date(),
        originalInvoiceNumber: order.invoiceNumber,
        refundMethod,
    };

    // Update order with refund
    await collections.orders.doc(orderId).update({
        refunds: [...existingRefunds, refund],
        updatedAt: new Date(),
    });

    return creditNoteNumber;
};

/**
 * Get all credit notes for an order
 * 
 * @param orderId - ID of the order
 * @returns Promise<OrderRefund[]> - Array of refunds
 */
export const getOrderCreditNotes = async (orderId: string): Promise<OrderRefund[]> => {
    const order = await getOrderById(orderId);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    return order.refunds || [];
};

/**
 * Get specific credit note
 * 
 * @param orderId - ID of the order
 * @param creditNoteNumber - Credit note number
 * @returns Promise<OrderRefund | null> - Found refund or null
 */
export const getCreditNote = async (
    orderId: string,
    creditNoteNumber: string
): Promise<OrderRefund | null> => {
    const creditNotes = await getOrderCreditNotes(orderId);
    return creditNotes.find(r => r.creditNoteNumber === creditNoteNumber) || null;
};
