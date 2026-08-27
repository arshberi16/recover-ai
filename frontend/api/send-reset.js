import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, reset_code } = req.body || {};
  if (!email || !reset_code) {
    return res.status(400).json({ error: 'Email and reset_code are required' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'recoveryai1909@gmail.com',
        pass: 'mgvegyphvywjuclw'
      }
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; margin: 0; }
        .card { background-color: #ffffff; max-width: 500px; margin: 0 auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 24px; text-align: center; }
        .brand { color: #2563eb; font-size: 22px; font-weight: 800; tracking: -0.5px; }
        .badge { background-color: #fef2f2; color: #dc2626; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 8px; }
        .reset-box { background-color: #fff1f2; border: 2px dashed #f43f5e; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }
        .reset-code { font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #be123c; font-family: monospace; }
        .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">RecoverAI Security Portal</div>
          <div class="badge">🔒 Password Reset Requested</div>
        </div>

        <p>Hi Merchant,</p>
        <p>You requested to reset your password for merchant account <code>${email}</code>. Your 6-digit Security Verification Code is:</p>
        
        <div class="reset-box">
          <div class="reset-code">${reset_code}</div>
        </div>

        <p>Enter this code in your RecoverAI portal along with your new password. This code will expire in <strong>15 minutes</strong>.</p>

        <div class="footer">
          If you did not request a password reset, please ignore this email.<br>
          Protected by RecoverAI Enterprise Auth Security.
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: 'RecoverAI Engine <recoveryai1909@gmail.com>',
      to: email,
      subject: `${reset_code} is your RecoverAI Password Reset Code`,
      html: htmlContent
    });

    return res.status(200).json({ success: true, email, provider: 'Vercel Serverless Gmail SMTP' });
  } catch (error) {
    console.error('Vercel Reset Email Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
