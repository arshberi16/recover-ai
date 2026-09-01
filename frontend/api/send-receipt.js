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

  const { email, name, transaction_id, amount, receipt_number } = req.body || {};
  const cleanEmail = String(email || '').toLowerCase().trim();

  if (!cleanEmail || !transaction_id) {
    return res.status(400).json({ error: 'Valid Email and transaction_id are required' });
  }

  const recipientName = name || cleanEmail.split('@')[0];
  const formattedAmount = amount ? Number(amount).toLocaleString('en-IN') : '4,999';
  const receiptNum = receipt_number || `REC-${Math.floor(100000 + Math.random() * 900000)}`;

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
        .brand { color: #10b981; font-size: 20px; font-weight: 800; tracking: -0.5px; }
        .badge { background-color: #ecfdf5; color: #047857; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 8px; }
        .amount { font-size: 28px; font-weight: 800; font-family: monospace; color: #065f46; margin: 12px 0; }
        .details { background-color: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; margin-bottom: 24px; }
        .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">RecoverAI Payment Gateway</div>
          <div class="badge">✓ Payment Confirmed & Verified</div>
        </div>

        <p>Hi <strong>${recipientName}</strong>,</p>
        <p>Thank you! Your payment of <strong>₹${formattedAmount}</strong> has been successfully received, verified, and settled.</p>
        
        <div class="amount">₹${formattedAmount}</div>

        <div class="details">
          <strong>Official Payment Receipt:</strong><br>
          • Receipt Number: <code>${receiptNum}</code><br>
          • Transaction ID: <code>${transaction_id}</code><br>
          • Status: <strong>COMPLETED (RECOVERED)</strong><br>
          • Timestamp: ${new Date().toLocaleString('en-IN')}
        </div>

        <p>Your payment recovery is complete. You may retain this receipt for your financial records.</p>

        <div class="footer">
          Thank you for using RecoverAI Gateway Mesh.<br>
          Protected by Merchant Auth & SSL Encryption.
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: '"RecoverAI Payment Gateway" <recoveryai1909@gmail.com>',
      replyTo: 'recoveryai1909@gmail.com',
      to: cleanEmail,
      subject: `Payment Confirmed: Receipt ${receiptNum} for ₹${formattedAmount}`,
      html: htmlContent
    });

    return res.status(200).json({ success: true, messageId: info.messageId, email: cleanEmail });
  } catch (error) {
    console.error('Error dispatching receipt email:', error);
    return res.status(500).json({ error: 'Failed to send receipt email', details: error.message });
  }
}
