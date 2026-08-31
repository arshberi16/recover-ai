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

  const { email, name, transaction_id, amount, bank_name, failure_reason } = req.body || {};
  if (!email || !transaction_id) {
    return res.status(400).json({ error: 'Email and transaction_id are required' });
  }

  const recipientName = name || email.split('@')[0];
  const formattedAmount = amount ? Number(amount).toLocaleString('en-IN') : '4,999';
  const payLink = `https://recover-ai-gilt.vercel.app/pay?txn=${transaction_id}`;

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
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
        .brand { color: #2563eb; font-size: 20px; font-weight: 800; tracking: -0.5px; }
        .badge { background-color: #fef2f2; color: #dc2626; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 8px; }
        .amount { font-size: 28px; font-weight: 800; font-family: monospace; color: #0f172a; margin: 12px 0; }
        .details { background-color: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; margin-bottom: 24px; }
        .btn { display: block; width: 100%; text-align: center; background-color: #2563eb; color: #ffffff !important; padding: 14px 0; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; margin-top: 24px; }
        .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">RecoverAI Revenue Intelligence</div>
          <div class="badge">Payment Interrupted (${failure_reason || 'Bank Timeout'})</div>
        </div>

        <p>Hi <strong>${recipientName}</strong>,</p>
        <p>Your recent payment of <strong>₹${formattedAmount}</strong> via ${bank_name || 'HDFC Bank'} could not be completed due to a temporary <strong>${failure_reason || 'Bank Timeout'}</strong>.</p>
        
        <div class="amount">₹${formattedAmount}</div>

        <div class="details">
          <strong>Transaction Details:</strong><br>
          • Transaction ID: <code>${transaction_id}</code><br>
          • Issuing Gateway: ${bank_name || 'HDFC Bank'}<br>
          • Failure Cause: ${failure_reason || 'Bank Timeout'}<br>
          • Status: Ready for 1-Click Retry
        </div>

        <p>No extra charges have been deducted from your account. You can complete your transaction securely below:</p>

        <a href="${payLink}" class="btn">Complete Payment Now (1-Click) &rarr;</a>

        <div class="footer">
          This is an automated payment recovery notification sent by RecoverAI Engine.<br>
          Protected by Merchant Auth & Gateway Security.
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: '"RecoverAI Engine" <recoveryai1909@gmail.com>',
      to: email,
      subject: `Action Required: Complete Your Payment of ₹${formattedAmount} for ${transaction_id}`,
      html: htmlContent
    });

    return res.status(200).json({ success: true, messageId: info.messageId, email });
  } catch (error) {
    console.error('Error dispatching recovery email:', error);
    return res.status(500).json({ error: 'Failed to send recovery email', details: error.message });
  }
}
