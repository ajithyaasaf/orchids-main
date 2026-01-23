/**
 * Invoice Routes
 * 
 * API endpoints for invoice, packing slip, and credit note operations.
 * 
 * Endpoints:
 * - GET /api/invoices/:orderId - Download/view invoice PDF
 * - GET /api/invoices/:orderId/packing-slip - Download packing slip (admin)
 * - GET /api/invoices/:orderId/credit-notes/:creditNoteNumber - Download credit note
 * - POST /api/invoices/:orderId/generate - Force generate invoice
 * - POST /api/invoices/refunds - Create refund with credit note (admin)
 * - GET /api/invoices/:orderId/status - Get invoice status
 */

import express, { Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleCheck';
import { getOrderById } from '../services/orderService';
import {
    canGenerateInvoice,
    generateInvoice,
    generateCreditNote,
    getCreditNote,
    markPackingSlipPrinted,
} from '../services/invoiceService';
import {
    generateInvoicePDF,
    generatePackingSlipPDF,
    generateCreditNotePDF,
} from '../services/pdfGeneratorService';
import { InvoiceData, PackingSlipData } from '@tntrends/shared';

const router = express.Router();

/**
 * GET /api/invoices/:orderId
 * Download or view invoice PDF
 * 
 * Query params:
 * - download=true: Force download (attachment)
 * - download=false: View in browser (inline)
 * 
 * Authorization:
 * - Customer: Own orders only
 * - Admin: Any order
 */
router.get('/:orderId', verifyToken, async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const { download } = req.query;

        const order = await getOrderById(orderId);

        if (!order) {
            res.status(404).json({ success: false, error: 'Order not found' });
            return;
        }

        // Authorization: customers can only access their own orders
        if (req.user!.role === 'customer' && order.userId !== req.user!.uid) {
            res.status(403).json({ success: false, error: 'Access denied' });
            return;
        }

        // CRITICAL: Payment status gate
        if (!canGenerateInvoice(order)) {
            res.status(400).json({
                success: false,
                error: 'Invoice not available. Order must be paid and not cancelled.',
            });
            return;
        }

        // IMPROVEMENT #2: Auto-generate invoice number if not exists (button safeguard)
        let invoiceNumber = order.invoiceNumber;
        if (!invoiceNumber) {
            invoiceNumber = await generateInvoice(orderId);
            // Refresh order to get updated data
            const updatedOrder = await getOrderById(orderId);
            if (updatedOrder) {
                order.invoiceNumber = updatedOrder.invoiceNumber;
                order.invoiceGeneratedAt = updatedOrder.invoiceGeneratedAt;
            }
        }

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');

        // IMPROVEMENT #1: View in browser vs download
        if (download === 'true') {
            res.setHeader(
                'Content-Disposition',
                `attachment; filename=invoice-${invoiceNumber}.pdf`
            );
        } else {
            res.setHeader(
                'Content-Disposition',
                `inline; filename=invoice-${invoiceNumber}.pdf`
            );
        }

        // Build invoice data
        const invoiceData: InvoiceData = {
            invoiceNumber,
            invoiceDate: order.invoiceGeneratedAt || new Date(),
            order,
            businessDetails: {
                name: 'TNtrends',
                address: 'Your Business Address, City, State, PIN',  // UPDATE THIS
                phone: 'Your Phone',                                 // UPDATE THIS
                email: 'your@email.com',                            // UPDATE THIS
                // IMPROVEMENT #3: Add when registered
                // gstin: 'Your GSTIN',
                // cin: 'Your CIN',
                // legalEntityName: 'TNtrends Private Limited'
            },
        };

        // Generate and stream PDF
        generateInvoicePDF(invoiceData, undefined, res);

    } catch (error: any) {
        console.error('Invoice generation error:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Failed to generate invoice',
        });
    }
});

/**
 * GET /api/invoices/:orderId/packing-slip
 * Download packing slip PDF (admin/warehouse only)
 */
router.get(
    '/:orderId/packing-slip',
    verifyToken,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
        try {
            const { orderId } = req.params;
            const { download } = req.query;

            const order = await getOrderById(orderId);

            if (!order) {
                res.status(404).json({ success: false, error: 'Order not found' });
                return;
            }

            // Mark as printed
            await markPackingSlipPrinted(orderId);

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');

            if (download === 'true') {
                res.setHeader(
                    'Content-Disposition',
                    `attachment; filename=packing-slip-${orderId.slice(-8)}.pdf`
                );
            } else {
                res.setHeader(
                    'Content-Disposition',
                    `inline; filename=packing-slip-${orderId.slice(-8)}.pdf`
                );
            }

            // Build packing slip data
            const packingSlipData: PackingSlipData = {
                slipNumber: orderId,
                order,
                items: order.items,
                warehouse: {
                    name: 'TNtrends Warehouse',
                    address: 'Warehouse Address',  // UPDATE THIS
                },
            };

            // Generate and stream PDF
            generatePackingSlipPDF(packingSlipData, undefined, res);

        } catch (error: any) {
            console.error('Packing slip generation error:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || 'Failed to generate packing slip',
            });
        }
    }
);

/**
 * GET /api/invoices/:orderId/credit-notes/:creditNoteNumber
 * Download credit note PDF
 */
router.get(
    '/:orderId/credit-notes/:creditNoteNumber',
    verifyToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const { orderId, creditNoteNumber } = req.params;
            const { download } = req.query;

            const order = await getOrderById(orderId);

            if (!order) {
                res.status(404).json({ success: false, error: 'Order not found' });
                return;
            }

            // Authorization
            if (req.user!.role === 'customer' && order.userId !== req.user!.uid) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }

            // Find the credit note
            const creditNote = await getCreditNote(orderId, creditNoteNumber);

            if (!creditNote) {
                res.status(404).json({ success: false, error: 'Credit note not found' });
                return;
            }

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');

            if (download === 'true') {
                res.setHeader(
                    'Content-Disposition',
                    `attachment; filename=credit-note-${creditNoteNumber}.pdf`
                );
            } else {
                res.setHeader(
                    'Content-Disposition',
                    `inline; filename=credit-note-${creditNoteNumber}.pdf`
                );
            }

            // Generate and stream PDF
            generateCreditNotePDF(order, creditNote, undefined, res);

        } catch (error: any) {
            console.error('Credit note generation error:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || 'Failed to generate credit note',
            });
        }
    }
);

/**
 * POST /api/invoices/:orderId/generate
 * Force generate or regenerate invoice number
 */
router.post(
    '/:orderId/generate',
    verifyToken,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
        try {
            const { orderId } = req.params;

            const invoiceNumber = await generateInvoice(orderId);

            res.json({
                success: true,
                data: { invoiceNumber },
                message: 'Invoice generated successfully',
            });

        } catch (error: any) {
            console.error('Invoice generation error:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || 'Failed to generate invoice',
            });
        }
    }
);

/**
 * POST /api/invoices/refunds
 * Create a refund with credit note (admin only)
 */
router.post(
    '/refunds',
    verifyToken,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
        try {
            const { orderId, refundAmount, refundReason, refundMethod } = req.body;

            // Validation
            if (!orderId) {
                res.status(400).json({ success: false, error: 'Order ID required' });
                return;
            }

            if (!refundAmount || refundAmount <= 0) {
                res.status(400).json({ success: false, error: 'Valid refund amount required' });
                return;
            }

            if (!refundReason) {
                res.status(400).json({ success: false, error: 'Refund reason required' });
                return;
            }

            const creditNoteNumber = await generateCreditNote(
                orderId,
                refundAmount,
                refundReason,
                refundMethod || 'razorpay'
            );

            res.json({
                success: true,
                data: { creditNoteNumber },
                message: 'Credit note generated successfully',
            });

        } catch (error: any) {
            console.error('Credit note generation error:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || 'Failed to generate credit note',
            });
        }
    }
);

/**
 * GET /api/invoices/:orderId/status
 * Get invoice status for an order
 */
router.get(
    '/:orderId/status',
    verifyToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const { orderId } = req.params;

            const order = await getOrderById(orderId);

            if (!order) {
                res.status(404).json({ success: false, error: 'Order not found' });
                return;
            }

            // Authorization
            if (req.user!.role === 'customer' && order.userId !== req.user!.uid) {
                res.status(403).json({ success: false, error: 'Access denied' });
                return;
            }

            res.json({
                success: true,
                data: {
                    canGenerateInvoice: canGenerateInvoice(order),
                    invoiceNumber: order.invoiceNumber || null,
                    invoiceGeneratedAt: order.invoiceGeneratedAt || null,
                    invoiceSent: order.invoiceSent || false,
                    packingSlipPrinted: order.packingSlipPrinted || false,
                    refunds: order.refunds || [],
                },
            });

        } catch (error: any) {
            console.error('Invoice status error:', error);
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message || 'Failed to get invoice status',
            });
        }
    }
);

export default router;
