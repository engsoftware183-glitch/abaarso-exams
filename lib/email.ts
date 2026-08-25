import nodemailer from "nodemailer";

// ======================================================
// EMAIL SERVICE ABSTRACTION
// ======================================================
//
// No email provider existed in this project before. This is a thin
// SMTP abstraction driven entirely by environment variables - no
// credentials are hardcoded. Required env vars:
//
//   EMAIL_FROM     - e.g. "Abaarso Tech University <no-reply@atu.edu>"
//   SMTP_HOST
//   SMTP_PORT
//   SMTP_USER
//   SMTP_PASSWORD
//
// If these are not configured, sendPasswordResetEmail() logs a
// server-side warning and resolves without throwing, so the caller
// (forgot-password route) can still return its generic response
// without revealing delivery success/failure to the client.

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

export async function sendPasswordResetEmail(to: string, code: string) {
  const transport = getTransport();

  if (!transport) {
    if (process.env.NODE_ENV === "production") {
      console.error("EMAIL_NOT_CONFIGURED: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD are not set.");
    }
    return;
  }

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background:#B03060;padding:20px 24px;border-radius:12px 12px 0 0;">
        <p style="color:#ffffff;font-weight:700;letter-spacing:0.04em;margin:0;font-size:14px;">ABAARSO TECH UNIVERSITY</p>
        <p style="color:#F5DBE5;margin:4px 0 0;font-size:12px;">Examination Management System</p>
      </div>
      <div style="border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
        <h2 style="color:#111827;margin:0 0 8px;font-size:18px;">Password reset code</h2>
        <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 20px;">
          Use the verification code below to reset your account password. This code expires in 10 minutes.
        </p>
        <p style="font-size:32px;font-weight:700;letter-spacing:0.3em;color:#B03060;text-align:center;margin:0 0 20px;">
          ${code}
        </p>
        <p style="color:#6B7280;font-size:13px;line-height:1.6;margin:0;">
          If you did not request this, you can safely ignore this email - your password will not be changed.
        </p>
      </div>
    </div>
  `;

  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? "Abaarso Tech University <no-reply@atu.edu>",
    to,
    subject: "Your ATU password reset code",
    html,
  });
}
