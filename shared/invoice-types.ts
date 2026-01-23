/**
 * Invoice & Packing Slip Types
 * 
 * Complete type definitions for invoice generation system
 */

import { Order, OrderItem } from './types';

/**
 * Business Details for Invoice Header
 */
export interface BusinessDetails {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin?: string;              // Future-proof for GST registration
    cin?: string;                // Corporate Identification Number
    legalEntityName?: string;    // Legal business name
}

/**
 * Warehouse Details for Packing Slip
 */
export interface WarehouseDetails {
    name: string;
    address: string;
}

/**
 * Complete Invoice Data
 */
export interface InvoiceData {
    invoiceNumber: string;       // INV-2025-000001
    invoiceDate: Date;
    order: Order;                // Full order snapshot
    businessDetails: BusinessDetails;
}

/**
 * Packing Slip Data (no pricing information)
 */
export interface PackingSlipData {
    slipNumber: string;          // Order ID based
    order: Order;
    items: OrderItem[];
    warehouse: WarehouseDetails;
}

/**
 * GST Line Item (for future expansion)
 */
export interface GSTLineItem {
    hsn?: string;                // Harmonized System of Nomenclature code
    gstRate?: number;            // 5%, 12%, 18%, or 28%
    cgst?: number;               // Central GST
    sgst?: number;               // State GST
    igst?: number;               // Integrated GST (for interstate)
}

/**
 * Order Refund (for credit notes)
 */
export interface OrderRefund {
    creditNoteNumber: string;    // CN-2025-000001
    refundAmount: number;        // Partial or full refund amount
    refundReason: string;        // Customer-facing reason
    refundDate: Date;            // When refund was processed
    originalInvoiceNumber: string; // Reference to original invoice
    refundMethod: 'razorpay' | 'bank_transfer' | 'store_credit';
}

/**
 * Credit Note Data
 */
export interface CreditNoteData {
    creditNoteNumber: string;
    creditNoteDate: Date;
    order: Order;
    refund: OrderRefund;
    businessDetails: BusinessDetails;
}

/**
 * GST Calculation Result
 */
export interface GSTBreakdown {
    taxableAmount: number;
    igst: number;
    cgst: number;
    sgst: number;
    totalGST: number;
}

/**
 * Invoice Generation Options
 */
export interface InvoiceGenerationOptions {
    includeGST?: boolean;
    language?: 'en' | 'hi' | 'ta';  // Future: Multi-language support
}

/**
 * Invoice Download Options
 */
export interface InvoiceDownloadOptions {
    download: boolean;           // true = attachment, false = inline view
}

/**
 * Invoice Response
 */
export interface InvoiceResponse {
    success: boolean;
    invoiceNumber?: string;
    message?: string;
    error?: string;
}

/**
 * Credit Note Response
 */
export interface CreditNoteResponse {
    success: boolean;
    creditNoteNumber?: string;
    message?: string;
    error?: string;
}
