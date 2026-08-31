/**
 * Email & Notification Delivery Service
 * Ready for Resend / Termii API credentials, with robust logging for local testing.
 */

export const sendEmail = async ({ to, subject, html, text }) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n📧 [EMAIL DISPATCH] To: ${to} | Subject: ${subject}`);
    if (text) console.log(`📝 Content: ${text}\n`);
    return { success: true, mocked: true };
  }

  // If a RESEND_API_KEY or SMTP is provided:
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Vendra <notifications@vendra.ng>",
          to,
          subject,
          html: html || `<p>${text}</p>`,
          text,
        }),
      });
      return await response.json();
    } catch (err) {
      console.error("Failed to send email via Resend:", err.message);
      return { success: false, error: err.message };
    }
  }

  console.log(`[Email] No production email provider configured. Logged to server.`);
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

