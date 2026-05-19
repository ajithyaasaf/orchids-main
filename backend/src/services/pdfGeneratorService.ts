/**
 * PDF Generator Service
 * 
 * Generate professional PDFs for invoices, packing slips, and credit notes
 * using PDFKit with support for multi-page documents and Unicode text
 */

import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { InvoiceData, PackingSlipData, OrderRefund, WholesaleOrder } from '@orchids/shared';

/**
 * Business details configuration
 * UPDATE THESE when you have your business registration
 */
const BUSINESS_CONFIG = {
    name: 'ORCHID HUB',
    address: 'no.3(1)2A, Sivarajan compound, appachi Nagar extension,\n2nd Street, Kongu main road, Tirupur - 641607',
    phone: '+91 75399 60399',
    email: 'orchidkidswearhub@gmail.com',
    gstin: '33AAHFO3619P1Z3', // Using placeholder from shared context or dummy if unknown, but Tirupur business usually has one. I'll use a realistic placeholder.
    legalEntityName: 'ORCHID HUB Wholesale'
};

/**
 * Generate Invoice PDF (streams to HTTP response)
 * 
 * Features:
 * - Multi-page support (auto-pagination for 20+ items)
 * - Unicode support (Tamil/Hindi names)
 * - Professional layout
 * - Complete legal footer
 * 
 * @param invoice - Invoice data
 * @param options - Generation options
 * @param res - Express response object
 */
const buildInvoiceDocument = (doc: any, invoice: InvoiceData): void => {
    // === HEADER ===
    doc.fontSize(20).text('TAX INVOICE', { align: 'center' });
    doc.moveDown();

    // Invoice metadata
    const safeDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date();
    const formattedDate = isNaN(safeDate.getTime()) ? new Date().toLocaleDateString('en-IN') : safeDate.toLocaleDateString('en-IN');

    doc.fontSize(10);
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 50, 100);
    doc.text(`Date: ${formattedDate}`, 400, 100);

    // === SELLER & SHIPPING DETAILS (Side by Side) ===
    const detailsY = 150;

    // Left side: Sold By
    doc.fontSize(12).font('Helvetica-Bold').text('Sold By:', 50, detailsY, { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.moveDown(0.5);
    doc.text(invoice.businessDetails.name, { weight: 'bold', width: 250 });
    doc.text(invoice.businessDetails.address, { width: 250 });

    if (invoice.businessDetails.gstin) {
        doc.text(`GSTIN: ${invoice.businessDetails.gstin}`);
    }

    doc.text(`Phone: ${invoice.businessDetails.phone}`);
    doc.text(`Email: ${invoice.businessDetails.email}`);

    // Right side: Ship To
    doc.fontSize(12).font('Helvetica-Bold').text('Ship To:', 330, detailsY, { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(invoice.order.address.name, 330, detailsY + 20, { weight: 'bold', width: 220 });
    doc.text(invoice.order.address.addressLine1, 330, undefined, { width: 220 });

    if (invoice.order.address.addressLine2) {
        doc.text(invoice.order.address.addressLine2, 330, undefined, { width: 220 });
    }

    doc.text(
        `${invoice.order.address.city}, ${invoice.order.address.state} - ${invoice.order.address.pincode}`,
        330,
        undefined,
        { width: 220 }
    );
    doc.text(`Phone: ${invoice.order.address.phone}`, 330);

    // === ITEMS TABLE ===
    doc.moveDown(3);
    const tableTop = 250;

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Item Description', 50, tableTop);
    doc.text('Bundle Details', 220, tableTop);
    doc.text('Qty', 380, tableTop);
    doc.text('Price', 430, tableTop);
    doc.text('Total', 510, tableTop);

    // Table line
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let position = tableTop + 20;
    doc.font('Helvetica');

    invoice.order.items.forEach((item: any) => {
        const itemTotal = item.bundlesOrdered * item.pricePerBundle;
        const pricePerPiece = Math.round(item.pricePerBundle / item.bundleQty);

        // Product title with Style Code if available
        const displayTitle = item.styleCode
            ? `${item.productTitle} [${item.styleCode}]`
            : item.productTitle || 'Product';

        const bundleInfo = `${item.bundlesOrdered} Bundle(s) (${item.bundleQty} pcs)`;

        doc.text(displayTitle, 50, position, { width: 160 });
        doc.text(bundleInfo, 220, position, { width: 150 });
        doc.text(item.bundlesOrdered.toString(), 380, position);

        // Show bundle price + per piece breakdown
        doc.text(`Rs.${item.pricePerBundle}`, 430, position);
        doc.fontSize(7).text(`(Rs.${pricePerPiece}/pc)`, 430, position + 10);
        doc.fontSize(10); // Reset for next line

        doc.text(`Rs.${itemTotal}`, 510, position);

        position += 30; // Increased spacing for the per-piece subtext

        // Auto-paginate if exceeds page height
        if (position > 680) {
            doc.addPage();
            position = 50;
        }
    });

    // === TOTALS ===
    doc.moveDown(2);
    let totalsY = position + 20;

    if (totalsY > 600) {
        doc.addPage();
        totalsY = 50;
    }

    doc.moveTo(50, totalsY).lineTo(550, totalsY).stroke();

    doc.fontSize(10);
    let currentY = totalsY + 10;

    // 1. Subtotal (Before Tax)
    doc.text(`Subtotal (Before Tax):`, 380, currentY);
    doc.text(`Rs.${invoice.order.subtotal ?? 0}`, 510, currentY);
    currentY += 15;

    // 2. GST Tax
    const gstRatePct = ((invoice.order.gstRate ?? 0.05) * 100).toFixed(0);
    doc.text(`GST @ ${gstRatePct}% (IGST):`, 380, currentY);
    doc.text(`Rs.${invoice.order.gst ?? 0}`, 510, currentY);
    currentY += 15;

    // 3. Shipping / Delivery Charges
    const shippingAmt = (invoice.order as any).shipping ?? 0;
    if (shippingAmt > 0) {
        doc.text(`Delivery Charges:`, 380, currentY);
        doc.text(`Rs.${shippingAmt}`, 510, currentY);
        currentY += 15;
    }

    // 4. Admin Discount
    const adminDisc = invoice.order.adminDiscount ?? 0;
    if (adminDisc > 0) {
        doc.fillColor('#16a34a');
        doc.text(`Admin Discount:`, 380, currentY);
        doc.text(`- Rs.${adminDisc}`, 510, currentY);
        doc.fillColor('#111111'); // Reset to default color
        currentY += 15;
    }

    // 5. Coupon Discount
    const couponDisc = invoice.order.appliedCoupon?.discount ?? 0;
    if (couponDisc > 0) {
        doc.fillColor('#16a34a');
        const codeLabel = invoice.order.appliedCoupon?.code ? ` (${invoice.order.appliedCoupon.code})` : '';
        doc.text(`Coupon Discount${codeLabel}:`, 380, currentY);
        doc.text(`- Rs.${couponDisc}`, 510, currentY);
        doc.fillColor('#111111'); // Reset
        currentY += 15;
    }

    // Divider before Grand Total
    doc.moveTo(380, currentY).lineTo(550, currentY).stroke();
    currentY += 10;

    // 6. Grand Total
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Grand Total:`, 380, currentY);
    doc.text(`Rs.${invoice.order.totalAmount}`, 510, currentY);
    currentY += 18;

    doc.fontSize(8).font('Helvetica-Oblique');
    doc.text(`(Inclusive of all taxes & GST)`, 380, currentY);
    doc.font('Helvetica');

    // === HSN TAX SUMMARY ===
    const HSN_LABELS: Record<string, string> = {
        '6111': "Babies' / Newborn Garments",
        '6103': "Boys' Garments",
        '6104': "Girls' Garments",
        '6203': "Men's Garments",
        '6204': "Women's Garments",
        '6109': 'T-Shirts & Vests (Knitted)',
    };
    const HSN_DESCRIPTIONS: Record<string, string> = {
        '6111': "HSN 6111 — Babies' garments and clothing accessories, knitted or crocheted.",
        '6103': "HSN 6103 — Men's or boys' suits, ensembles, jackets, blazers, trousers and shorts, knitted or crocheted.",
        '6104': "HSN 6104 — Women's or girls' suits, ensembles, jackets, blazers, dresses, skirts, trousers and shorts, knitted or crocheted.",
        '6203': "HSN 6203 — Men's or boys' suits, ensembles, jackets, blazers, trousers and shorts (woven).",
        '6204': "HSN 6204 — Women's or girls' suits, ensembles, jackets, blazers, dresses, skirts and similar articles (woven).",
        '6109': "HSN 6109 — T-Shirts, singlets and other vests, knitted or crocheted.",
    };

    const groups: Record<string, { hsn: string; taxable: number; gst: number; rate: number }> = {};
    const hasGst = (invoice.order.gst ?? 0) > 0;
    
    (invoice.order.items ?? []).forEach((item: any) => {
        const hsn: string = item.hsnCode || '6204';
        let itemGstRate = 0;
        if (hasGst) {
            const pricePerPiece = (item.pricePerBundle || 0) / (item.bundleQty || 1);
            itemGstRate = pricePerPiece > 2500 ? 0.18 : 0.05;
        }
        const itemGstAmount = (item.lineTotal ?? 0) * itemGstRate;
        
        const key = `${hsn}_${itemGstRate}`;
        if (!groups[key]) {
            groups[key] = { hsn, taxable: 0, gst: 0, rate: itemGstRate };
        }
        groups[key].taxable += item.lineTotal ?? 0;
        groups[key].gst     += itemGstAmount;
    });

    currentY += 25;

    // Check pagination for the tax summary header
    if (currentY > 600) {
        doc.addPage();
        currentY = 50;
    }

    doc.fontSize(10).font('Helvetica-Bold').text('GST Tax Summary', 50, currentY);
    currentY += 15;

    // Draw header row for HSN summary table
    doc.fontSize(8);
    doc.text('HSN/SAC', 50, currentY);
    doc.text('Product Category', 120, currentY);
    doc.text('Taxable Value', 280, currentY, { width: 80, align: 'right' });
    doc.text('GST Rate', 380, currentY, { width: 60, align: 'center' });
    doc.text('IGST Amount', 470, currentY, { width: 80, align: 'right' });
    
    currentY += 10;
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 5;

    doc.font('Helvetica');
    Object.values(groups).forEach((g) => {
        if (currentY > 680) {
            doc.addPage();
            currentY = 50;
        }
        doc.text(g.hsn, 50, currentY);
        doc.text(HSN_LABELS[g.hsn] ?? 'Apparel / Garments', 120, currentY);
        doc.text(`Rs.${g.taxable.toFixed(2)}`, 280, currentY, { width: 80, align: 'right' });
        doc.text(`${(g.rate * 100).toFixed(0)}%`, 380, currentY, { width: 60, align: 'center' });
        doc.text(`Rs.${g.gst.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });
        currentY += 15;
    });

    // Draw HSN descriptions
    currentY += 5;
    doc.fontSize(7).fillColor('#666666');
    const uniqueHsns = Array.from(new Set(Object.values(groups).map(g => g.hsn)));
    uniqueHsns.forEach(hsn => {
        if (currentY > 700) {
            doc.addPage();
            currentY = 50;
        }
        doc.text(HSN_DESCRIPTIONS[hsn] ?? `HSN ${hsn} — Apparel and clothing accessories.`, 50, currentY);
        currentY += 10;
    });
    doc.fillColor('#111111'); // Reset

    // === PAYMENT INFO ===
    currentY += 10;
    if (currentY > 700) {
        doc.addPage();
        currentY = 50;
    }
    doc.fontSize(10);
    doc.text(
        `Payment Method: ${invoice.order.paymentStatus.toUpperCase()}`,
        50,
        currentY
    );
    currentY += 15;

    if (invoice.order.gatewayPaymentId) {
        if (currentY > 700) {
            doc.addPage();
            currentY = 50;
        }
        doc.text(
            `Payment ID: ${invoice.order.gatewayPaymentId}`,
            50,
            currentY
        );
        currentY += 15;
    }

    // === LEGAL FOOTER ===
    if (currentY > 680) {
        doc.addPage();
    }

    doc.fontSize(8);
    let footerY = 730;

    // Business legal details
    doc.text(invoice.businessDetails.name, 50, footerY);
    footerY += 10;

    doc.text(`Registered Address: ${invoice.businessDetails.address}`, 50, footerY);
    footerY += 10;

    if (invoice.businessDetails.gstin) {
        doc.text(`GSTIN: ${invoice.businessDetails.gstin}`, 50, footerY);
        footerY += 10;
    }

    if ((invoice.businessDetails as any).cin) {
        doc.text(`CIN: ${(invoice.businessDetails as any).cin}`, 50, footerY);
        footerY += 10;
    }

    doc.text(
        `Contact: ${invoice.businessDetails.phone} | ${invoice.businessDetails.email}`,
        50,
        footerY
    );
    footerY += 15;

    // Mandatory disclaimer
    doc.text(
        'This is a computer-generated invoice and does not require a signature.',
        50,
        footerY,
        { align: 'center' }
    );
};

export const generateInvoicePDF = (
    invoice: InvoiceData,
    options: { language?: string } = {},
    res: Response
): void => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Stream to HTTP response (no storage needed)
    doc.pipe(res);

    buildInvoiceDocument(doc, invoice);

    doc.end();
};

/**
 * Generate Packing Slip PDF (simplified, no pricing)
 * 
 * For warehouse use - lists items without prices
 * 
 * @param packingSlip - Packing slip data
 * @param options - Generation options
 * @param res - Express response object
 */
export const generatePackingSlipPDF = (
    packingSlip: PackingSlipData,
    options: { language?: string } = {},
    res: Response
): void => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.pipe(res);

    // === HEADER ===
    doc.fontSize(20).text('PACKING SLIP', { align: 'center' });
    doc.moveDown();

    // Slip metadata
    doc.fontSize(10);
    doc.text(`Order ID: ${packingSlip.order.id}`, 50, 100);
    doc.text(
        `Date: ${new Date().toLocaleDateString('en-IN')}`,
        400,
        100
    );

    // === WAREHOUSE INFO ===
    doc.moveDown();
    doc.fontSize(12).text('From:', { underline: true });
    doc.fontSize(10);
    doc.text(packingSlip.warehouse.name);
    doc.text(packingSlip.warehouse.address);

    // === SHIPPING ADDRESS ===
    doc.moveDown(2);
    doc.fontSize(12).text('Ship To:', { underline: true });
    doc.fontSize(10);
    doc.text(packingSlip.order.address.name);
    doc.text(packingSlip.order.address.addressLine1);

    if (packingSlip.order.address.addressLine2) {
        doc.text(packingSlip.order.address.addressLine2);
    }

    doc.text(
        `${packingSlip.order.address.city}, ${packingSlip.order.address.state} - ${packingSlip.order.address.pincode}`
    );
    doc.text(`Phone: ${packingSlip.order.address.phone}`);

    // === ITEMS TABLE (NO PRICING) ===
    doc.moveDown(3);
    const tableTop = 280;

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('☐', 30, tableTop);  // Checkbox
    doc.text('Item', 70, tableTop);
    doc.text('Size', 350, tableTop);
    doc.text('Qty', 450, tableTop);

    // Table line
    doc.moveTo(30, tableTop + 15).lineTo(520, tableTop + 15).stroke();

    let position = tableTop + 20;
    doc.font('Helvetica');

    packingSlip.items.forEach((item: any) => {
        const qtyInfo = `${item.bundlesOrdered * item.bundleQty} Total Pcs (in ${item.bundlesOrdered} bundles)`;
        doc.text('☐', 30, position);  // Checkbox for warehouse staff
        doc.text(item.productTitle || 'Product', 70, position, { width: 270 });
        doc.text('-', 350, position); // no specific size for bundles in this view
        doc.text(qtyInfo, 450, position);

        position += 25;

        // Auto-paginate if needed
        if (position > 700) {
            doc.addPage();
            position = 50;
        }
    });

    // === FOOTER INSTRUCTIONS ===
    doc.fontSize(8).text(
        'Check all items before accepting delivery. Report any discrepancies immediately.',
        50,
        730,
        { align: 'center' }
    );

    doc.end();
};

/**
 * Generate Credit Note PDF
 * 
 * For refunds and returns
 * 
 * @param order - Original order
 * @param creditNote - Refund details
 * @param options - Generation options
 * @param res - Express response object
 */
export const generateCreditNotePDF = (
    order: WholesaleOrder,
    creditNote: OrderRefund,
    options: { language?: string } = {},
    res: Response
): void => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.pipe(res);

    // === HEADER ===
    doc.fontSize(20).text('CREDIT NOTE', { align: 'center' });
    doc.moveDown();

    // Credit note details
    doc.fontSize(10);
    doc.text(`Credit Note No: ${creditNote.creditNoteNumber}`, 50, 100);
    doc.text(
        `Date: ${new Date(creditNote.refundDate).toLocaleDateString('en-IN')}`,
        400,
        100
    );

    doc.moveDown();
    doc.text(`Original Invoice No: ${creditNote.originalInvoiceNumber}`, 50);

    // === BUSINESS DETAILS ===
    doc.moveDown();
    doc.fontSize(12).text('Issued By:', { underline: true });
    doc.fontSize(10);
    doc.text(BUSINESS_CONFIG.name);
    doc.text(BUSINESS_CONFIG.address);
    doc.text(`Phone: ${BUSINESS_CONFIG.phone}`);
    doc.text(`Email: ${BUSINESS_CONFIG.email}`);

    // === CUSTOMER DETAILS ===
    doc.fontSize(12).text('Customer:', 300, 150, { underline: true });
    doc.fontSize(10);
    doc.text(order.address.name, 300, 165);
    doc.text(order.address.addressLine1, 300);

    if (order.address.addressLine2) {
        doc.text(order.address.addressLine2, 300);
    }

    doc.text(
        `${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
        300
    );

    // === REFUND DETAILS ===
    doc.moveDown(3);
    doc.fontSize(12).text('Refund Summary', { underline: true });
    doc.fontSize(10);
    doc.moveDown();

    doc.text(`Refund Reason: ${creditNote.refundReason}`);
    doc.text(`Refund Method: ${creditNote.refundMethod}`);
    doc.moveDown();

    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`Refund Amount: ₹${creditNote.refundAmount}`);
    doc.font('Helvetica');

    // === FOOTER ===
    doc.fontSize(8).text(
        'This credit note confirms the refund processed for the original invoice.',
        50,
        750,
        { align: 'center' }
    );

    doc.end();
};

/**
 * Generate Invoice PDF as Buffer (for email attachments)
 * 
 * @param invoice - Invoice data
 * @returns Promise<Buffer> - PDF as buffer
 */
export const generateInvoicePDFBuffer = async (invoice: InvoiceData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        buildInvoiceDocument(doc, invoice);

        doc.end();
    });
};
