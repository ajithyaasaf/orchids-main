/**
 * printDocuments.ts
 *
 * Generates and prints two professional document types for wholesale orders:
 *  1. GST Tax Invoice — A4, formally structured, GST-compliant
 *  2. Delivery Challan — Compact packing slip for the courier / warehouse
 *
 * Strategy: Opens a new browser window with a complete HTML document
 * and triggers window.print(). This gives perfect, dependency-free PDF output.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmtDate = (d: Date | any): string => {
    const date = d?.toDate ? d.toDate() : d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

function openAndPrint(html: string): void {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
        alert('Please allow popups for this site to print documents.');
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    // Small delay so fonts/styles render before print dialog opens
    win.onload = () => {
        win.focus();
        win.print();
    };
}

// ─── Shared Base Styles ───────────────────────────────────────────────────────

const BASE_CSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 13px;
        color: #111;
        background: #fff;
        padding: 0;
        margin: 0;
    }
    .page {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: 14mm 14mm 20mm 14mm;
    }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1a1a1a; color: #fff; text-align: left; padding: 7px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 7px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .bold { font-weight: 700; }
    .small { font-size: 11px; color: #555; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .tag-paid { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .tag-pending { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 10px 0; }
    .divider-thick { border: none; border-top: 2.5px solid #1a1a1a; margin: 10px 0; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .value { font-size: 13px; font-weight: 600; color: #111; }
    .value-mono { font-family: 'Courier New', monospace; font-size: 12px; }
    @media print {
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .page { padding: 10mm; }
        .no-print { display: none; }
    }
`;

// ─── 1. GST TAX INVOICE ───────────────────────────────────────────────────────

export function printTaxInvoice(order: any): void {
    const orderId = order.id?.toUpperCase() ?? '';
    const orderRef = orderId.slice(0, 8);
    const invoiceNo = order.invoiceNumber ?? `ORD-${orderRef}`;
    const orderDate = fmtDate(order.createdAt);
    const gstPct = ((order.gstRate ?? 0.18) * 100).toFixed(0);
    const payTag = order.paymentStatus === 'paid'
        ? '<span class="tag tag-paid">PAID</span>'
        : '<span class="tag tag-pending">PENDING</span>';

    const address = order.address ?? {};
    const addressLines = [
        address.addressLine1 || address.line1,
        address.addressLine2 || address.line2,
        [address.city, address.state].filter(Boolean).join(', '),
        address.pincode,
        address.country || 'India',
    ].filter(Boolean).join('<br/>');

    const itemRows = (order.items ?? []).map((item: any) => `
        <tr>
            <td>${item.productTitle ?? '—'}</td>
            <td class="text-center">${item.bundlesOrdered} Bndl × ${item.bundleQty} pcs</td>
            <td class="text-center">${item.bundlesOrdered * (item.bundleQty ?? 0)} pcs</td>
            <td class="text-right">₹${fmt(item.pricePerBundle ?? 0)}</td>
            <td class="text-right">₹${fmt(item.lineTotal ?? 0)}</td>
        </tr>
    `).join('');

    const discountRow = (order.adminDiscount ?? 0) > 0 ? `
        <tr>
            <td colspan="4" class="text-right text-right" style="color:#16a34a">Admin Discount</td>
            <td class="text-right bold" style="color:#16a34a">- ₹${fmt(order.adminDiscount)}</td>
        </tr>
    ` : '';

    const couponRow = order.appliedCoupon?.discount > 0 ? `
        <tr>
            <td colspan="4" class="text-right" style="color:#16a34a">Coupon (${order.appliedCoupon.code})</td>
            <td class="text-right bold" style="color:#16a34a">- ₹${fmt(order.appliedCoupon.discount)}</td>
        </tr>
    ` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Tax Invoice — ${invoiceNo}</title>
    <style>
        ${BASE_CSS}
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .brand-name { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #1a1a1a; }
        .brand-sub { font-size: 11px; color: #888; margin-top: 2px; }
        .invoice-title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1a1a1a; }
        .invoice-meta { font-size: 11px; color: #555; text-align: right; }
        .section-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 14px; }
        .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
        .totals-row.grand { border-top: 2px solid #1a1a1a; margin-top: 6px; padding-top: 8px; font-size: 16px; font-weight: 900; }
        .footer-note { font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; margin-top: 16px; }
        .watermark { font-size: 10px; color: #bbb; text-align: center; margin-top: 10px; }
        .gstin-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px 10px; display: inline-block; font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
<div class="page">

    <!-- Header -->
    <div class="header">
        <div>
            <div class="brand-name">🌸 ORCHID HUB</div>
            <div class="brand-sub">Wholesale Fashion — Factory Direct</div>
            <div class="brand-sub" style="margin-top:6px">Madurai, Tamil Nadu, India</div>
            <div class="brand-sub">support@orchidhub.in | +91 99446 55868</div>
        </div>
        <div style="text-align:right">
            <div class="invoice-title">Tax Invoice</div>
            <div class="invoice-meta" style="margin-top:6px">
                <div><span class="label">Invoice No.</span><br/><strong>${invoiceNo}</strong></div>
                <div style="margin-top:4px"><span class="label">Date</span><br/><strong>${orderDate}</strong></div>
                <div style="margin-top:6px">${payTag}</div>
            </div>
        </div>
    </div>

    <hr class="divider-thick"/>

    <!-- Billing Info -->
    <div class="grid-2" style="margin: 14px 0">
        <div class="section-box">
            <div class="label" style="margin-bottom:6px">Bill To</div>
            <div class="bold" style="font-size:14px">${address.name ?? '—'}</div>
            <div class="small" style="margin-top:4px;line-height:1.6">${addressLines}</div>
            ${address.phone ? `<div class="small" style="margin-top:4px">📞 ${address.phone}</div>` : ''}
        </div>
        <div class="section-box">
            <div class="label" style="margin-bottom:6px">Order Reference</div>
            <div class="label" style="margin-top:8px">Order ID</div>
            <div class="value-mono">${orderId}</div>
            ${order.gatewayPaymentId && !order.gatewayPaymentId.startsWith('test_') ? `
            <div class="label" style="margin-top:8px">Payment Reference</div>
            <div class="value-mono small">${order.gatewayPaymentId}</div>
            ` : ''}
            <div class="label" style="margin-top:8px">Order Status</div>
            <div class="value" style="text-transform:capitalize">${order.orderStatus ?? '—'}</div>
            ${order.trackingNumber ? `
            <div class="label" style="margin-top:8px">Shipment</div>
            <div class="value-mono small">${order.courierName} — ${order.trackingNumber}</div>
            ` : ''}
        </div>
    </div>

    <!-- Items Table -->
    <table style="margin-top:10px">
        <thead>
            <tr>
                <th style="width:40%">Product Description</th>
                <th class="text-center">Qty</th>
                <th class="text-center">Total Pcs</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${itemRows}
        </tbody>
    </table>

    <!-- Totals -->
    <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <div style="width:300px">
            <div class="totals-row">
                <span class="small">Subtotal (Before Tax)</span>
                <span>₹${fmt(order.subtotal ?? 0)}</span>
            </div>
            <div class="totals-row">
                <span class="small">GST @ ${gstPct}% (IGST)</span>
                <span>₹${fmt(order.gst ?? 0)}</span>
            </div>
            ${(order.adminDiscount ?? 0) > 0 ? `
            <div class="totals-row" style="color:#16a34a">
                <span>Admin Discount</span>
                <span>- ₹${fmt(order.adminDiscount)}</span>
            </div>` : ''}
            ${order.appliedCoupon?.discount > 0 ? `
            <div class="totals-row" style="color:#16a34a">
                <span>Coupon (${order.appliedCoupon.code})</span>
                <span>- ₹${fmt(order.appliedCoupon.discount)}</span>
            </div>` : ''}
            <div class="totals-row grand">
                <span>Total Amount</span>
                <span>₹${fmt(order.totalAmount ?? 0)}</span>
            </div>
        </div>
    </div>

    <!-- Amount in Words -->
    <div style="margin-top:10px;font-size:11px;color:#555">
        <strong>Amount in words:</strong> Rupees ${numberToWords(Math.round(order.totalAmount ?? 0))} Only
    </div>

    <!-- GST Summary Table -->
    <div style="margin-top:16px">
        <div class="label" style="margin-bottom:6px">GST Tax Summary</div>
        <table>
            <thead>
                <tr>
                    <th>HSN / SAC Code</th>
                    <th>Product Category</th>
                    <th class="text-right">Taxable Value</th>
                    <th class="text-center">GST Rate</th>
                    <th class="text-right">IGST Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>6204</td>
                    <td>Women's Garments / Apparel</td>
                    <td class="text-right">₹${fmt(order.subtotal ?? 0)}</td>
                    <td class="text-center">${gstPct}%</td>
                    <td class="text-right">₹${fmt(order.gst ?? 0)}</td>
                </tr>
            </tbody>
        </table>
        <div style="margin-top:6px;font-size:10px;color:#888">
            HSN 6204 — Women's suits, ensembles, jackets, blazers, dresses, skirts, and similar articles.
        </div>
    </div>

    <!-- Footer -->
    <div class="footer-note" style="margin-top:24px">
        <div style="display:flex;justify-content:space-between">
            <div>
                <div class="bold">Orchid Hub Wholesale</div>
                <div>This is a computer-generated invoice and does not require a physical signature.</div>
                <div style="margin-top:4px">For queries: support@orchidhub.in</div>
            </div>
            <div style="text-align:right">
                <div class="label">Authorised Signatory</div>
                <div style="margin-top:30px;border-top:1px solid #ccc;padding-top:4px;width:120px">Orchid Hub</div>
            </div>
        </div>
    </div>

    <div class="watermark" style="margin-top:30px">
        Generated by Orchid Hub Admin System • ${new Date().toLocaleString('en-IN')}
    </div>
</div>
</body>
</html>`;

    openAndPrint(html);
}

// ─── 2. DELIVERY CHALLAN ─────────────────────────────────────────────────────

export function printDeliveryChallan(order: any): void {
    const orderId = order.id?.toUpperCase() ?? '';
    const orderRef = orderId.slice(0, 8);
    const challanNo = `DC-${orderRef}-${new Date().getFullYear()}`;
    const orderDate = fmtDate(order.createdAt);
    const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const address = order.address ?? {};
    const addressBlock = [
        address.addressLine1 || address.line1,
        address.addressLine2 || address.line2,
        [address.city, address.state].filter(Boolean).join(', '),
        address.pincode,
        address.country || 'India',
    ].filter(Boolean).join(', ');

    const totalPieces = (order.items ?? []).reduce(
        (sum: number, item: any) => sum + (item.bundlesOrdered ?? 0) * (item.bundleQty ?? 0),
        0
    );
    const totalBundles = (order.items ?? []).reduce(
        (sum: number, item: any) => sum + (item.bundlesOrdered ?? 0),
        0
    );

    const itemRows = (order.items ?? []).map((item: any, i: number) => `
        <tr>
            <td>${i + 1}</td>
            <td>
                <strong>${item.productTitle ?? '—'}</strong>
                ${item.bundleComposition && Object.keys(item.bundleComposition).length > 0 ? `
                <div class="small" style="margin-top:2px">
                    Sizes: ${Object.entries(item.bundleComposition).map(([s, q]) => `${s}×${q}`).join(', ')}
                </div>` : ''}
            </td>
            <td class="text-center">${item.bundlesOrdered}</td>
            <td class="text-center">${item.bundleQty}</td>
            <td class="text-center bold">${item.bundlesOrdered * (item.bundleQty ?? 0)}</td>
            <td class="text-center">☐</td>
        </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Delivery Challan — ${challanNo}</title>
    <style>
        ${BASE_CSS}
        .challan-header { border: 2px solid #1a1a1a; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
        .challan-title { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 12px; }
        .address-box { border: 1px solid #1a1a1a; border-radius: 6px; padding: 10px 14px; height: 100%; }
        .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 6px; }
        .sig-box { border: 1px solid #ccc; border-radius: 6px; padding: 10px 14px; height: 80px; display: flex; flex-direction: column; justify-content: space-between; }
        .barcode-sim { font-family: monospace; font-size: 16px; letter-spacing: 2px; color: #333; text-align: center; background: #f9fafb; padding: 4px 8px; border-radius: 4px; border: 1px solid #e5e7eb; }
        @media print {
            .page { padding: 8mm; }
        }
    </style>
</head>
<body>
<div class="page">

    <!-- Challan Header Box -->
    <div class="challan-header">
        <div class="challan-title">Delivery Challan</div>
        <div class="grid-3" style="align-items:start">
            <div>
                <div class="section-title">From (Seller)</div>
                <div class="bold" style="font-size:14px">🌸 Orchid Hub</div>
                <div class="small" style="line-height:1.6;margin-top:2px">
                    Wholesale Fashion — Factory Direct<br/>
                    Madurai, Tamil Nadu, India<br/>
                    +91 99446 55868
                </div>
            </div>
            <div style="text-align:center">
                <div class="section-title">Challan Details</div>
                <div class="barcode-sim">${orderRef}</div>
                <div class="small" style="margin-top:6px"><strong>Challan No:</strong> ${challanNo}</div>
                <div class="small"><strong>Order Date:</strong> ${orderDate}</div>
                <div class="small"><strong>Print Date:</strong> ${printDate}</div>
            </div>
            <div style="text-align:right">
                <div class="section-title">Summary</div>
                <div><span class="label">Total Bundles</span><br/><span class="bold" style="font-size:20px">${totalBundles}</span></div>
                <div style="margin-top:6px"><span class="label">Total Pieces</span><br/><span class="bold" style="font-size:20px">${totalPieces}</span></div>
            </div>
        </div>
    </div>

    <!-- Addresses -->
    <div class="grid-2" style="margin-bottom:14px;gap:12px">
        <div class="address-box">
            <div class="section-title">Deliver To (Consignee)</div>
            <div class="bold" style="font-size:15px">${address.name ?? '—'}</div>
            <div class="small" style="line-height:1.7;margin-top:4px">${addressBlock}</div>
            ${address.phone ? `<div class="bold" style="margin-top:6px;font-size:13px">📞 ${address.phone}</div>` : ''}
        </div>
        <div>
            <div class="address-box">
                <div class="section-title">Shipment Info</div>
                ${order.courierName ? `
                <div><span class="label">Courier</span><br/><span class="bold">${order.courierName}</span></div>
                ` : '<div class="small" style="color:#bbb;margin-top:8px">Courier details to be filled</div>'}
                ${order.trackingNumber ? `
                <div style="margin-top:6px"><span class="label">Tracking No.</span><br/><span class="value-mono">${order.trackingNumber}</span></div>
                ` : `
                <div style="margin-top:8px">
                    <div class="label">Tracking No.</div>
                    <div style="border-bottom:1px solid #ccc;height:20px;margin-top:6px;width:100%"></div>
                </div>`}
                <div style="margin-top:8px"><span class="label">Mode of Transport</span><br/><span class="small">Surface</span></div>
            </div>
        </div>
    </div>

    <!-- Items Table -->
    <table>
        <thead>
            <tr>
                <th style="width:30px">#</th>
                <th>Product Description</th>
                <th class="text-center" style="width:70px">Bundles</th>
                <th class="text-center" style="width:70px">Pcs/Bundle</th>
                <th class="text-center" style="width:80px">Total Pcs</th>
                <th class="text-center" style="width:60px">✓ Packed</th>
            </tr>
        </thead>
        <tbody>
            ${itemRows}
            <tr style="background:#f9fafb">
                <td colspan="2" class="bold text-right">TOTAL</td>
                <td class="text-center bold">${totalBundles}</td>
                <td></td>
                <td class="text-center bold" style="font-size:16px">${totalPieces}</td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <!-- Signature Row -->
    <div class="grid-3" style="margin-top:24px;gap:12px;align-items:end">
        <div class="sig-box">
            <div class="section-title">Prepared By</div>
            <div class="small" style="border-top:1px solid #ccc;padding-top:4px">Signature & Name</div>
        </div>
        <div class="sig-box">
            <div class="section-title">Quality Checked By</div>
            <div class="small" style="border-top:1px solid #ccc;padding-top:4px">Signature & Name</div>
        </div>
        <div class="sig-box">
            <div class="section-title">Received By (Customer)</div>
            <div class="small" style="border-top:1px solid #ccc;padding-top:4px">Signature, Name & Date</div>
        </div>
    </div>

    <!-- Footer Note -->
    <div style="margin-top:16px;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:10px;display:flex;justify-content:space-between">
        <div>
            This Delivery Challan does not constitute a Tax Invoice.
            The official GST Tax Invoice will be provided separately.
        </div>
        <div>Order Ref: ${orderRef} | Generated: ${new Date().toLocaleString('en-IN')}</div>
    </div>
</div>
</body>
</html>`;

    openAndPrint(html);
}

// ─── Utility: Number to Words ─────────────────────────────────────────────────

function numberToWords(n: number): string {
    if (n === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function toWords(num: number): string {
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
        if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + toWords(num % 100) : '');
        if (num < 100000) return toWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + toWords(num % 1000) : '');
        if (num < 10000000) return toWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + toWords(num % 100000) : '');
        return toWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + toWords(num % 10000000) : '');
    }

    return toWords(n);
}
