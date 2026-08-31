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
