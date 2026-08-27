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

  const { email, name } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const recipientName = name || email.split('@')[0];

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
        .card { background-color: #ffffff; max-width: 550px; margin: 0 auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }
        .brand { color: #2563eb; font-size: 22px; font-weight: 800; tracking: -0.5px; }
        .badge { background-color: #ecfdf5; color: #047857; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 8px; }
        .details { background-color: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; margin: 20px 0; }
        .btn { display: block; width: 100%; text-align: center; background-color: #2563eb; color: #ffffff !important; padding: 14px 0; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; margin-top: 24px; }
        .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">RecoverAI Revenue Intelligence</div>
          <div class="badge">✓ Account Registration Confirmed</div>
        </div>

        <p>Hi <strong>${recipientName}</strong>,</p>
        <p>Welcome to <strong>RecoverAI Intelligence Portal</strong>! Your merchant operations account has been successfully created and configured.</p>

        <div class="details">
          <strong>Registered Account Details:</strong><br>
          • Account Name: ${recipientName}<br>
          • Merchant Work Email: <code>${email}</code><br>
          • Status: Active & Authenticated<br>
          • ML Failure Recovery Engine: Online
        </div>

        <p>You can now upload transaction telemetry, run automated payment recovery workflows, and access real-time ML analytics.</p>

        <a href="https://recover-ai-gilt.vercel.app" class="btn">Access Your Merchant Portal &rarr;</a>

        <div class="footer">
          This is an official account registration confirmation from RecoverAI.<br>
          Protected by Merchant Auth & Enterprise Security.
        </div>
      </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: 'RecoverAI Engine <recoveryai1909@gmail.com>',
      to: email,
      subject: `Welcome to RecoverAI, ${recipientName}! Account Created Successfully 🎉`,
      html: htmlContent
    });

    return res.status(200).json({ success: true, email, provider: 'Vercel Serverless Gmail SMTP' });
  } catch (error) {
    console.error('Vercel Email Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
