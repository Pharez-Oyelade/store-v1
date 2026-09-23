/**
 * Email & Notification Delivery Service
 * Ready for Resend / Termii API credentials, with robust logging for local testing.
 */

export const sendEmail = async ({ to, subject, html, text }) => {
  // L4: Validate recipient email address safety guard
  if (!to || typeof to !== "string" || !to.includes("@")) {
    console.warn(`⚠️ [Email Skipped] Invalid or missing recipient: "${to}" for subject: "${subject}"`);
    return { success: false, skipped: true, reason: "Invalid or missing recipient email" };
  }

  // If RESEND_API_KEY is provided, dispatch via Resend (works in both dev and prod)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Vendra <onboarding@resend.dev>",
          to,
          subject,
          html: html || `<p>${text}</p>`,
          text,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("❌ Resend API Error:", data);
        return { success: false, error: data };
      }
      console.log(`✅ 📧 [Resend Sent] To: ${to} | Subject: ${subject} | ID: ${data.id}`);
      return { success: true, data };
    } catch (err) {
      console.error("❌ Failed to send email via Resend:", err.message);
      return { success: false, error: err.message };
    }
  }

  // Fallback: local terminal logging when RESEND_API_KEY is not configured
  console.log(`\n📧 [MOCK EMAIL LOG] To: ${to} | Subject: ${subject}`);
  if (text) console.log(`📝 Content: ${text}\n`);
  return { success: true, mocked: true };
};


export const sendPasswordResetEmail = async (email, resetUrl) => {
  const subject = "Reset your Vendra password";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0D6B31;">Vendra</h2>
      <p>Hello,</p>
      <p>We received a request to reset your Vendra store password.</p>
      <div style="margin: 24px 0;">
        <a href="${resetUrl}" style="background-color: #0D6B31; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #666; font-size: 14px;">This link will expire in 24 hours. If you did not request this, please ignore this email.</p>
    </div>
  `;
  const text = `Reset your Vendra password by visiting: ${resetUrl}`;
  return sendEmail({ to: email, subject, html, text });
};

export const sendWelcomeTrialEmail = async (email, { businessName, trialDays = 14 }) => {

  const subject = `Welcome to Vendra — Your ${trialDays}-Day Free Trial on The Stitch Plan`;
  const dashboardUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0D6B31;">Vendra</h2>
      <p>Hello <strong>${businessName}</strong>,</p>
      <p>Welcome to Vendra! Your account has been activated with a <strong>${trialDays}-day free trial on The Stitch Plan</strong>.</p>
      <p>Here is what you have unlocked during your trial:</p>
      <ul>
        <li>Up to <strong>50 ready-to-wear products</strong> with variant inventory</li>
        <li><strong>Bespoke customer demands</strong> & body measurements manager</li>
        <li>Fabric & material requirements with supplier tracking</li>
        <li>Customer debt & balance collection tracking</li>
      </ul>
      <div style="margin: 24px 0;">
        <a href="${dashboardUrl}" style="background-color: #0D6B31; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Your Dashboard</a>
      </div>
      <p style="color: #666; font-size: 14px;">No credit card required. Enjoy building your fashion business!</p>
    </div>
  `;
  const text = `Welcome to Vendra! Your ${trialDays}-day free trial on The Stitch Plan is now active. Access your dashboard at: ${dashboardUrl}`;
  return sendEmail({ to: email, subject, html, text });
};

export const sendSubscriptionExpiringEmail = async (email, { businessName, plan = "Stitch", daysLeft = 3, renewUrl }) => {
  const subject = `Action Required: Your Vendra ${plan} Plan expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
  const url = renewUrl || `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/settings`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0D6B31;">Vendra</h2>
      <p>Hello <strong>${businessName}</strong>,</p>
      <p>Your subscription/trial on <strong>The ${plan} Plan</strong> will expire in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>.</p>
      <p>To keep your expanded product catalog (50 products) and active bespoke orders without interruption, renew or upgrade your subscription before it ends.</p>
      <div style="margin: 24px 0;">
        <a href="${url}" style="background-color: #0D6B31; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Renew / Upgrade Plan</a>
      </div>
      <p style="color: #666; font-size: 14px;">If not renewed, your account will automatically transition to the Free plan (5 products, 5 orders/month).</p>
    </div>
  `;
  const text = `Your Vendra ${plan} Plan expires in ${daysLeft} day(s). Renew now at: ${url}`;
  return sendEmail({ to: email, subject, html, text });
};

export const sendSubscriptionExpiredEmail = async (email, { businessName, plan = "Stitch", upgradeUrl }) => {
  const subject = `Your Vendra ${plan} Plan has expired — Account moved to Free plan`;
  const url = upgradeUrl || `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/settings`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0D6B31;">Vendra</h2>
      <p>Hello <strong>${businessName}</strong>,</p>
      <p>Your <strong>The ${plan} Plan</strong> has ended. Your store has now been moved to the <strong>Free Plan</strong>.</p>
      <p>On the Free Plan:</p>
      <ul>
        <li>You can manage up to <strong>5 products</strong></li>
        <li>Record up to <strong>5 orders / bespoke demands per month</strong></li>
      </ul>
      <p>Your existing data is safe. You can upgrade anytime to unlock higher limits.</p>
      <div style="margin: 24px 0;">
        <a href="${url}" style="background-color: #0D6B31; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Upgrade Back to Stitch (₦4,900/mo)</a>
      </div>
    </div>
  `;
  const text = `Your Vendra ${plan} Plan has expired and your store is now on the Free Plan. Upgrade anytime at: ${url}`;
  return sendEmail({ to: email, subject, html, text });
};

export const sendOnlinePaymentConfirmationEmail = async (email, {
  customerName = "Valued Customer",
  invoiceNumber,
  amountPaid,
  balanceRemaining = 0,
  orderNumber,
  storeName = "Vendra Store",
  viewUrl,
}) => {
  const subject = `Payment Confirmed: ${invoiceNumber} — ${storeName}`;
  const formattedAmount = `₦${Number(amountPaid || 0).toLocaleString()}`;
  const formattedBalance = `₦${Number(balanceRemaining || 0).toLocaleString()}`;
  const url = viewUrl || `${process.env.FRONTEND_URL || "http://localhost:3000"}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #0D6B31; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #0D6B31; margin: 0; font-size: 22px;">${storeName}</h2>
        <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 13px;">Payment Receipt & Confirmation</p>
      </div>
      <p style="font-size: 15px; color: #111827;">Hello <strong>${customerName}</strong>,</p>
      <p style="font-size: 14px; color: #374151; line-height: 1.5;">
        Thank you for your payment! We have successfully received and verified your payment of <strong>${formattedAmount}</strong> for Invoice <strong>${invoiceNumber}</strong>${orderNumber ? ` (Order #${orderNumber})` : ""}.
      </p>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #f3f4f6;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Invoice Number:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #111827;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Amount Paid:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0D6B31;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280;">Outstanding Balance:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: ${balanceRemaining > 0 ? '#b91c1c' : '#0D6B31'};">
              ${balanceRemaining > 0 ? formattedBalance : "₦0 (Fully Paid)"}
            </td>
          </tr>
        </table>
      </div>

      <div style="margin: 24px 0; text-align: center;">
        <a href="${url}" style="background-color: #0D6B31; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">View Invoice & Order Status</a>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        Powered by Vendra Fashion Commerce OS
      </p>
    </div>
  `;

  const text = `Payment Confirmed for ${invoiceNumber}: ${formattedAmount} received. Balance remaining: ${balanceRemaining > 0 ? formattedBalance : "₦0"}. View: ${url}`;
  return sendEmail({ to: email, subject, html, text });
};

export const sendManualPaymentProofPromptEmail = async (vendorEmail, {
  vendorName = "Merchant",
  invoiceNumber,
  customerName = "Customer",
  amount,
  senderName,
  bankName,
  reference,
  proofImageUrl,
  reviewUrl,
}) => {
  const subject = `⚠️ Action Required: New Payment Proof Uploaded for Invoice ${invoiceNumber}`;
  const formattedAmount = `₦${Number(amount || 0).toLocaleString()}`;
  const url = reviewUrl || `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/invoices`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #92400e; margin: 0; font-size: 20px;">Payment Proof Verification Needed</h2>
        <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 13px;">Customer submitted bank transfer details</p>
      </div>
      <p style="font-size: 15px; color: #111827;">Hello <strong>${vendorName}</strong>,</p>
      <p style="font-size: 14px; color: #374151; line-height: 1.5;">
        Customer <strong>${customerName}</strong> has just submitted a bank transfer payment proof for Invoice <strong>${invoiceNumber}</strong>. Please check your bank account and confirm receipt.
      </p>

      <div style="background-color: #fffbeb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #fef3c7;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #78350f;">Reported Amount:</td>
            <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #92400e;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #78350f;">Sender Account Name:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #111827;">${senderName || "Not provided"}</td>
          </tr>
          ${bankName ? `<tr><td style="padding: 6px 0; color: #78350f;">Sender Bank:</td><td style="padding: 6px 0; font-weight: 600; text-align: right; color: #111827;">${bankName}</td></tr>` : ""}
          ${reference ? `<tr><td style="padding: 6px 0; color: #78350f;">Transfer Ref / Notes:</td><td style="padding: 6px 0; font-weight: 600; text-align: right; color: #111827;">${reference}</td></tr>` : ""}
        </table>
      </div>

      ${proofImageUrl ? `
        <div style="margin: 20px 0; text-align: center;">
          <a href="${proofImageUrl}" target="_blank" style="display: inline-block; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; max-width: 250px;">
            <img src="${proofImageUrl}" alt="Payment Receipt" style="width: 100%; max-height: 200px; object-fit: cover; display: block;" />
            <div style="padding: 6px; font-size: 12px; background: #f3f4f6; color: #374151;">Click to view receipt image</div>
          </a>
        </div>
      ` : ""}

      <div style="margin: 24px 0; text-align: center;">
        <a href="${url}" style="background-color: #0D6B31; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Open Invoice & Verify Payment</a>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        Once verified in your dashboard, the order status and customer receipt will automatically update.
      </p>
    </div>
  `;

  const text = `Action Required: Customer ${customerName} submitted a payment proof of ${formattedAmount} for Invoice ${invoiceNumber}. Review and confirm at: ${url}`;
  return sendEmail({ to: vendorEmail, subject, html, text });
};

/**
 * Notifies the store / merchant when an online payment is received for an invoice.
 */
export const sendStorePaymentNotificationEmail = async (vendorEmail, {
  vendorName = "Merchant",
  invoiceNumber,
  customerName = "Customer",
  amountPaid,
  balanceRemaining = 0,
  channel = "Paystack Online",
  viewUrl,
}) => {
  const formattedAmount = `₦${Number(amountPaid || 0).toLocaleString()}`;
  const formattedBalance = `₦${Number(balanceRemaining || 0).toLocaleString()}`;
  const subject = `💰 Payment Received: ${formattedAmount} for Invoice #${invoiceNumber}`;
  const url = viewUrl || `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/invoices`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #0D6B31; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #0D6B31; margin: 0; font-size: 20px;">Payment Received!</h2>
        <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 13px;">Funds successfully processed & recorded</p>
      </div>
      <p style="font-size: 15px; color: #111827;">Hello <strong>${vendorName}</strong>,</p>
      <p style="font-size: 14px; color: #374151; line-height: 1.5;">
        You have received a payment of <strong>${formattedAmount}</strong> for Invoice <strong>#${invoiceNumber}</strong> from customer <strong>${customerName}</strong> via ${channel}.
      </p>

      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #166534;">Invoice Number:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #111827;">#${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #166534;">Amount Collected:</td>
            <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #0D6B31;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #166534;">Remaining Balance:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: ${balanceRemaining > 0 ? '#b91c1c' : '#0D6B31'};">
              ${balanceRemaining > 0 ? formattedBalance : "₦0 (Fully Settled)"}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #166534;">Payment Channel:</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #111827;">${channel}</td>
          </tr>
        </table>
      </div>

      <div style="margin: 24px 0; text-align: center;">
        <a href="${url}" style="background-color: #0D6B31; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">View Invoice in Dashboard</a>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        Vendra Fashion Commerce OS • Real-Time Financial Management
      </p>
    </div>
  `;

  const text = `Payment Received: ${formattedAmount} received for Invoice #${invoiceNumber} from ${customerName}. Outstanding balance: ${balanceRemaining > 0 ? formattedBalance : "₦0"}. View invoice: ${url}`;
  return sendEmail({ to: vendorEmail, subject, html, text });
};



