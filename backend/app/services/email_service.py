import os
import json
import smtplib
import urllib.request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_recovery_email(
    to_email: str,
    customer_name: str,
    transaction_id: str,
    amount: float,
    bank_name: str,
    failure_reason: str
) -> dict:
    """
    Dispatches a real HTML payment recovery email to the customer's inbox via Resend or SMTP.
    For Resend API/SMTP, from address uses onboarding@resend.dev for test deliverability.
    """
    resend_api_key = os.getenv("RESEND_API_KEY")
    smtp_host = os.getenv("SMTP_HOST", "smtp.resend.com")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER", "resend")
    smtp_pass = os.getenv("SMTP_PASSWORD") or resend_api_key

    from_sender = "RecoverAI Engine <onboarding@resend.dev>"

    subject = f"Action Required: Complete Your Payment of ₹{amount:,.0f} for {transaction_id}"
    pay_link = f"http://localhost:5173/pay?txn={transaction_id}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; margin: 0; }}
        .card {{ background-color: #ffffff; max-width: 550px; margin: 0 auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
        .header {{ border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }}
        .brand {{ color: #2563eb; font-size: 20px; font-weight: 800; tracking: -0.5px; }}
        .badge {{ background-color: #fef2f2; color: #dc2626; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 8px; }}
        .amount {{ font-size: 28px; font-weight: 800; font-family: monospace; color: #0f172a; margin: 12px 0; }}
        .details {{ background-color: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; margin-bottom: 24px; }}
        .btn {{ display: block; width: 100%; text-align: center; background-color: #2563eb; color: #ffffff !important; padding: 14px 0; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; margin-top: 24px; }}
        .footer {{ font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">RecoverAI Revenue Intelligence</div>
          <div class="badge">Payment Interrupted ({failure_reason})</div>
        </div>

        <p>Hi <strong>{customer_name}</strong>,</p>
        <p>Your recent payment of <strong>₹{amount:,.2f}</strong> via {bank_name} could not be completed due to a temporary <strong>{failure_reason}</strong>.</p>
        
        <div class="amount">₹{amount:,.2f}</div>

        <div class="details">
          <strong>Transaction Details:</strong><br>
          • Transaction ID: <code>{transaction_id}</code><br>
          • Issuing Gateway: {bank_name}<br>
          • Failure Cause: {failure_reason}<br>
          • Status: Ready for 1-Click Retry
        </div>

        <p>No extra charges have been deducted from your account. You can complete your transaction securely below:</p>

        <a href="{pay_link}" class="btn">Complete Payment Now (1-Click) &rarr;</a>

        <div class="footer">
          This is an automated payment recovery notification sent by RecoverAI Engine.<br>
          Protected by Merchant Auth & Gateway Security.
        </div>
      </div>
    </body>
    </html>
    """

    return _dispatch_email(to_email, subject, html_content, from_sender, resend_api_key, smtp_host, smtp_port, smtp_user, smtp_pass)


def send_receipt_confirmation_email(
    to_email: str,
    customer_name: str,
    transaction_id: str,
    amount: float,
    receipt_number: str
) -> dict:
    """
    Dispatches a Payment Confirmation Receipt email after a successful payment recovery.
    """
    resend_api_key = os.getenv("RESEND_API_KEY")
    smtp_host = os.getenv("SMTP_HOST", "smtp.resend.com")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER", "resend")
    smtp_pass = os.getenv("SMTP_PASSWORD") or resend_api_key

    from_sender = "RecoverAI Engine <onboarding@resend.dev>"
    subject = f"Payment Confirmed: Receipt {receipt_number} for ₹{amount:,.0f}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; margin: 0; }}
        .card {{ background-color: #ffffff; max-width: 550px; margin: 0 auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
        .header {{ border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }}
        .brand {{ color: #10b981; font-size: 20px; font-weight: 800; tracking: -0.5px; }}
        .badge {{ background-color: #ecfdf5; color: #047857; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 8px; }}
        .amount {{ font-size: 28px; font-weight: 800; font-family: monospace; color: #065f46; margin: 12px 0; }}
        .details {{ background-color: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; margin-bottom: 24px; }}
        .footer {{ font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">RecoverAI Payment Confirmed</div>
          <div class="badge">Status: RECOVERED & VERIFIED</div>
        </div>

        <p>Hi <strong>{customer_name}</strong>,</p>
        <p>Your payment of <strong>₹{amount:,.2f}</strong> has been successfully recovered and processed.</p>
        
        <div class="amount">₹{amount:,.2f}</div>

        <div class="details">
          <strong>Official Payment Receipt:</strong><br>
          • Receipt Number: <code>{receipt_number}</code><br>
          • Transaction ID: <code>{transaction_id}</code><br>
          • Amount Paid: ₹{amount:,.2f}<br>
          • Status: SUCCESS (RECOVERED)
        </div>

        <div class="footer">
          Thank you for choosing TechCorp Solutions Pvt Ltd.<br>
          Protected by RecoverAI Gateway Mesh.
        </div>
      </div>
    </body>
    </html>
    """

    return _dispatch_email(to_email, subject, html_content, from_sender, resend_api_key, smtp_host, smtp_port, smtp_user, smtp_pass)


def _dispatch_email(to_email, subject, html_content, from_sender, resend_api_key, smtp_host, smtp_port, smtp_user, smtp_pass):
    # 1. Try Resend HTTP API if key provided
    if resend_api_key:
        try:
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {resend_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": from_sender,
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req) as resp:
                if resp.status in [200, 201]:
                    print(f"Physical email sent via Resend API to {to_email}")
                    return {"sent": True, "provider": "Resend API", "recipient": to_email}
        except Exception as e:
            print(f"Resend API error: {e}")

    # 2. Try SMTP if user/password provided
    if smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = from_sender
            msg["To"] = to_email
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail("onboarding@resend.dev", to_email, msg.as_string())

            print(f"Physical email sent via Resend SMTP to {to_email}")
            return {"sent": True, "provider": "Resend SMTP", "recipient": to_email}
        except Exception as e:
            print(f"SMTP dispatch error: {e}")

    return {"sent": False, "demo": True, "recipient": to_email}


def send_otp_email(to_email: str, customer_name: str, otp_code: str) -> dict:
    """
    Dispatches a 6-digit OTP verification email for new merchant account signups.
    """
    resend_api_key = os.getenv("RESEND_API_KEY")
    smtp_host = os.getenv("SMTP_HOST", "smtp.resend.com")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER", "resend")
    smtp_pass = os.getenv("SMTP_PASSWORD") or resend_api_key

    from_sender = "RecoverAI Engine <onboarding@resend.dev>"
    subject = f"{otp_code} is your RecoverAI Account Verification Code"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; margin: 0; }}
        .card {{ background-color: #ffffff; max-width: 500px; margin: 0 auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
        .header {{ border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; text-align: center; }}
        .brand {{ color: #2563eb; font-size: 22px; font-weight: 800; tracking: -0.5px; }}
        .otp-box {{ background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }}
        .otp-code {{ font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; font-family: monospace; }}
        .footer {{ font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">RecoverAI Identity Verification</div>
        </div>

        <p>Hi <strong>{customer_name}</strong>,</p>
        <p>Your 6-digit One-Time Password (OTP) for verifying your new RecoverAI Merchant Account is:</p>
        
        <div class="otp-box">
          <div class="otp-code">{otp_code}</div>
        </div>

        <p>This verification code is valid for <strong>10 minutes</strong>. Please do not share this OTP with anyone.</p>

        <div class="footer">
          If you did not request this account creation, please ignore this email.<br>
          Protected by RecoverAI Enterprise Authentication.
        </div>
      </div>
    </body>
    </html>
    """

    return _dispatch_email(to_email, subject, html_content, from_sender, resend_api_key, smtp_host, smtp_port, smtp_user, smtp_pass)


def send_welcome_email(to_email: str, customer_name: str) -> dict:
    """
    Dispatches an Account Creation Welcome Confirmation email to newly registered merchants.
    """
    resend_api_key = os.getenv("RESEND_API_KEY")
    smtp_host = os.getenv("SMTP_HOST", "smtp.resend.com")
    smtp_port = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER", "resend")
    smtp_pass = os.getenv("SMTP_PASSWORD") or resend_api_key

    from_sender = "RecoverAI Engine <onboarding@resend.dev>"
    subject = f"Welcome to RecoverAI, {customer_name}! Account Created Successfully 🎉"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; margin: 0; }}
        .card {{ background-color: #ffffff; max-width: 550px; margin: 0 auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
        .header {{ border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; }}
        .brand {{ color: #2563eb; font-size: 22px; font-weight: 800; tracking: -0.5px; }}
        .badge {{ background-color: #ecfdf5; color: #047857; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 8px; }}
        .details {{ background-color: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; margin: 20px 0; }}
        .btn {{ display: block; width: 100%; text-align: center; background-color: #2563eb; color: #ffffff !important; padding: 14px 0; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; margin-top: 24px; }}
        .footer {{ font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">RecoverAI Revenue Intelligence</div>
          <div class="badge">✓ Account Registration Confirmed</div>
        </div>

        <p>Hi <strong>{customer_name}</strong>,</p>
        <p>Welcome to <strong>RecoverAI Intelligence Portal</strong>! Your merchant operations account has been successfully created and configured.</p>

        <div class="details">
          <strong>Registered Account Details:</strong><br>
          • Account Name: {customer_name}<br>
          • Merchant Work Email: <code>{to_email}</code><br>
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
    """

    return _dispatch_email(to_email, subject, html_content, from_sender, resend_api_key, smtp_host, smtp_port, smtp_user, smtp_pass)
