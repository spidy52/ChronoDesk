import nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

let cachedTransporter: nodemailer.Transporter | null = null;

export async function sendMail(options: SendMailOptions): Promise<{ previewUrl?: string; messageId: string }> {
  const hasSmtpConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (hasSmtpConfig && process.env.SMTP_HOST === 'smtp.resend.com') {
    // Use Resend's HTTP REST API instead of SMTP to bypass cloud firewall blocks on port 465/587
    console.log('[MAILER] Using Resend REST API for delivery...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SMTP_PASS}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.SMTP_FROM || 'ChronoDesk Support <onboarding@resend.dev>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    const data: any = await response.json();
    if (!response.ok) {
      throw new Error(`Resend API Error: ${data.message || JSON.stringify(data)}`);
    }

    console.log(`[MAILER] Email sent successfully via Resend API: ${data.id}`);
    return {
      messageId: data.id,
    };
  }

  let transporter: nodemailer.Transporter;
  let previewUrl: string | undefined;

  if (cachedTransporter) {
    transporter = cachedTransporter;
  } else {
    if (hasSmtpConfig) {
      // 1. Production SMTP Configuration
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // 2. Development Ethereal SMTP Fallback (creates preview links automatically)
      console.log('[MAILER] No SMTP configuration found in .env. Creating Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
    cachedTransporter = transporter;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"ChronoDesk Support" <support@chronodesk.app>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[MAILER] Email sent successfully: ${info.messageId}`);

  if (!hasSmtpConfig) {
    previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    console.log(`[MAILER] Ethereal Preview URL: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl,
  };
}

export function getResetPasswordHtml(resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your ChronoDesk Password</title>
  <style>
    /* Responsive styling */
    @media only screen and (max-width: 600px) {
      .container {
        margin: 20px auto !important;
        border-radius: 16px !important;
      }
      .header, .content, .footer {
        padding: 24px !important;
      }
    }
  </style>
</head>
<body style="background-color: #0b0d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 40px 20px; color: #f4f4f5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <div class="container" style="max-width: 500px; margin: 0 auto; background-color: #121520; border: 1px solid #23273a; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); text-align: left;">
    <!-- Brand Header -->
    <div class="header" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%); border-bottom: 1px solid #1e2235; padding: 36px 32px; text-align: center;">
      <a href="http://localhost:5173" style="font-size: 26px; font-weight: 800; color: #ffffff; text-decoration: none; letter-spacing: -0.5px; display: inline-flex; align-items: center; gap: 8px;">
        <span style="color: #ffffff;">Chrono</span><span style="color: #a855f7;">Desk</span>
      </a>
      <div style="margin-top: 12px; font-size: 13px; color: #818cf8; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px;">Security Service</div>
    </div>
    
    <!-- Email Content -->
    <div class="content" style="padding: 36px 32px;">
      <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.5px; line-height: 1.3;">Reset your password</h1>
      <p style="color: #94a3b8; font-size: 15px; line-height: 24px; margin-top: 0; margin-bottom: 24px;">Hello,</p>
      <p style="color: #94a3b8; font-size: 15px; line-height: 24px; margin-top: 0; margin-bottom: 24px;">We received a request to reset the password for your ChronoDesk account. Click the button below to choose a new password. This secure link will remain active for <strong>1 hour</strong>.</p>
      
      <!-- Action Button -->
      <div class="btn-container" style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" target="_blank" style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.2s ease;">Reset Password</a>
      </div>
      
      <p style="color: #94a3b8; font-size: 15px; line-height: 24px; margin-top: 0; margin-bottom: 0;">If you did not request a password reset, you can safely ignore this email. Your account remains secure and no changes have been made.</p>
    </div>
    
    <!-- Footer -->
    <div class="footer" style="padding: 24px 32px; background-color: #0b0d16; border-top: 1px solid #1e2235; text-align: center;">
      <p style="color: #475569; font-size: 12px; line-height: 18px; margin: 0 0 6px 0;">This is an automated notification, please do not reply directly to this email.</p>
      <p style="color: #475569; font-size: 12px; line-height: 18px; margin: 0;">&copy; 2026 ChronoDesk. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
