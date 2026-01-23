import { Resend } from 'resend';
import { encode as encodeHtml } from 'he';
import { Order } from '@tntrends/shared';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (!resend) {
  console.warn('⚠️ Resend API key missing. Email features will not work.');
}
const FROM_EMAIL = process.env.FROM_EMAIL || 'orders@tntrends.shop';

/**
 * Send order confirmation email
 */
export const sendOrderConfirmationEmail = async (
  order: Order,
  customerEmail: string
): Promise<boolean> => {
  try {
    if (!resend) {
      console.warn('⚠️ Email service not configured. Skipping order confirmation email.');
      return false;
    }

    const emailHtml = generateOrderEmailTemplate(order);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Order Confirmation - ${order.id}`,
      html: emailHtml,
    });

    console.log(`✅ Order confirmation email sent to ${customerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    return false;
  }
};

/**
 * Generate order confirmation email HTML template
 * SECURITY: All user-provided data is HTML-escaped to prevent XSS
 */
const generateOrderEmailTemplate = (order: Order): string => {
  // SECURITY: Escape all user-controlled data
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
        ${encodeHtml(item.productTitle || 'Product')} (Size: ${encodeHtml(item.size)})
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">
        ₹${item.price}
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #00b0b5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">TNtrends</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Order Confirmation</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 18px; margin-top: 0;">Dear ${encodeHtml(order.address.name)},</p>
        <p>Thank you for your order! We're excited to let you know that we've received your order and it's being processed.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <h2 style="margin-top: 0; color: #046e7b; font-size: 20px;">Order Details</h2>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
          <p><strong>Payment Status:</strong> <span style="color: ${order.paymentStatus === 'paid' ? '#22c55e' : '#ef4444'};">${order.paymentStatus.toUpperCase()}</span></p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <h2 style="margin-top: 0; color: #046e7b; font-size: 20px;">Items Ordered</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Product</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e2e8f0;">Qty</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e2e8f0;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
            <p style="text-align: right; font-size: 18px; margin: 0;"><strong>Total Amount: ₹${order.totalAmount}</strong></p>
          </div>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <h2 style="margin-top: 0; color: #046e7b; font-size: 20px;">Shipping Address</h2>
          <p style="margin: 5px 0;">${encodeHtml(order.address.name)}</p>
          <p style="margin: 5px 0;">${encodeHtml(order.address.addressLine1)}</p>
          ${order.address.addressLine2 ? `<p style="margin: 5px 0;">${encodeHtml(order.address.addressLine2)}</p>` : ''}
          <p style="margin: 5px 0;">${encodeHtml(order.address.city)}, ${encodeHtml(order.address.state)} - ${encodeHtml(order.address.pincode)}</p>
          <p style="margin: 5px 0;">${encodeHtml(order.address.country)}</p>
          <p style="margin: 5px 0;">Phone: ${encodeHtml(order.address.phone)}</p>
        </div>
        
        <p style="margin-top: 30px;">We'll send you another email when your order ships.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p style="margin-top: 30px;">Best regards,<br><strong>TNtrends Team</strong></p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
        <p>&copy; ${new Date().getFullYear()} TNtrends. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
};
