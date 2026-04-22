const nodemailer = require("nodemailer");
const config = require("../config/config");
const logger = require("../config/logger");

const transport = nodemailer.createTransport(config.email.smtp);

if (config.env !== "test") {
  transport
    .verify()
    .then(() => logger.info("Connected to email server"))
    .catch(() => logger.warn("Unable to connect to email server. Check SMTP config in .env"));
}

const sendEmail = async (to, subject, html) => {
  const msg = { from: config.email.from, to, subject, html };
  await transport.sendMail(msg);
};

// ─── Shared layout wrapper ────────────────────────────────────────────────────

const layout = (content) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#f59e0b);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
              🎴 PromoterCard
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">NFC-Powered Promoter Cards</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} PromoterCard. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Admin: email verification OTP ───────────────────────────────────────────

const sendEmailVerification = async (to, otp) => {
  const html = layout(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;">Verify your email</h2>
    <p style="color:#64748b;margin:0 0 28px;">Use the code below to verify your PromoterCard admin account.</p>
    <div style="background:linear-gradient(135deg,#f97316,#f59e0b);color:#fff;padding:20px;border-radius:12px;font-size:36px;font-weight:900;letter-spacing:8px;text-align:center;margin-bottom:24px;">${otp}</div>
    <p style="color:#94a3b8;font-size:13px;text-align:center;">This code expires in 10 minutes. If you didn't register, ignore this email.</p>
  `);
  await sendEmail(to, "PromoterCard — Verify your email", html);
};

// ─── Admin: password reset OTP ────────────────────────────────────────────────

const sendResetPasswordEmail = async (to, otp) => {
  const html = layout(`
    <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;">Reset your password</h2>
    <p style="color:#64748b;margin:0 0 28px;">We received a request to reset your password. Use the code below:</p>
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:20px;border-radius:12px;font-size:36px;font-weight:900;letter-spacing:8px;text-align:center;margin-bottom:24px;">${otp}</div>
    <p style="color:#94a3b8;font-size:13px;text-align:center;">Valid for 10 minutes. If you didn't request this, ignore this email.</p>
  `);
  await sendEmail(to, "PromoterCard — Password reset code", html);
};

// ─── Admin: new enquiry notification ─────────────────────────────────────────

const sendNewEnquiryNotification = async (adminEmail, enquiry) => {
  const html = layout(`
    <h2 style="margin:0 0 4px;color:#1e293b;font-size:22px;">New Enquiry Received 🎉</h2>
    <p style="color:#64748b;margin:0 0 28px;">Someone filled out the Get Started form on your landing page.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      ${[
        ["Name", enquiry.name],
        ["Business", enquiry.businessName],
        ["Email", enquiry.email],
        ["Phone", enquiry.phone || "—"],
        ["Cards Requested", enquiry.cardQuantity || "—"],
        ["Message", enquiry.message || "—"],
      ].map(([label, value], i) => `
        <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
          <td style="padding:12px 16px;font-size:13px;color:#64748b;font-weight:600;width:140px;">${label}</td>
          <td style="padding:12px 16px;font-size:14px;color:#1e293b;">${value}</td>
        </tr>`).join("")}
    </table>

    <div style="text-align:center;">
      <a href="${process.env.CLIENT_URL || "https://promotercard.sobhoy.com"}/admin"
         style="display:inline-block;background:linear-gradient(135deg,#f97316,#f59e0b);color:#fff;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">
        View in Admin Panel →
      </a>
    </div>
  `);
  await sendEmail(adminEmail, `PromoterCard — New enquiry from ${enquiry.businessName}`, html);
};

// ─── Venue: welcome email with account credentials ────────────────────────────

const sendVenueWelcomeEmail = async (to, { venueName, username, password, loginUrl }) => {
  const html = layout(`
    <h2 style="margin:0 0 4px;color:#1e293b;font-size:22px;">Welcome to PromoterCard! 🎴</h2>
    <p style="color:#64748b;margin:0 0 28px;">
      Your venue account for <strong>${venueName}</strong> has been set up by the PromoterCard team.
      Use the details below to log in and start managing your promoters.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:28px;">
      <tr style="background:#fff7ed;">
        <td style="padding:14px 20px;font-size:13px;color:#ea580c;font-weight:700;width:130px;">Login URL</td>
        <td style="padding:14px 20px;font-size:14px;color:#1e293b;">
          <a href="${loginUrl}" style="color:#f97316;">${loginUrl}</a>
        </td>
      </tr>
      <tr style="background:#ffffff;">
        <td style="padding:14px 20px;font-size:13px;color:#64748b;font-weight:700;">Username</td>
        <td style="padding:14px 20px;font-size:14px;color:#1e293b;font-weight:600;letter-spacing:1px;">${username}</td>
      </tr>
      <tr style="background:#f8fafc;">
        <td style="padding:14px 20px;font-size:13px;color:#64748b;font-weight:700;">Password</td>
        <td style="padding:14px 20px;font-size:14px;color:#1e293b;font-weight:600;letter-spacing:1px;">${password}</td>
      </tr>
    </table>

    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;color:#92400e;">
        ⚠️ Please change your password after your first login for security.
      </p>
    </div>

    <div style="text-align:center;">
      <a href="${loginUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#f97316,#f59e0b);color:#fff;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">
        Log In to Your Dashboard →
      </a>
    </div>

    <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;">
      Need help? Reply to this email and our team will assist you.
    </p>
  `);
  await sendEmail(to, `PromoterCard — Your venue account is ready, ${venueName}!`, html);
};

module.exports = {
  transport,
  sendEmail,
  sendEmailVerification,
  sendResetPasswordEmail,
  sendNewEnquiryNotification,
  sendVenueWelcomeEmail,
  // legacy alias kept for backward compat
  sendVerificationEmail: sendEmailVerification,
};
