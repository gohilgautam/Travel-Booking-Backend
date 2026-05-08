const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let lastEmailError = null;

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL/TLS
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
  tls: {
    // This helps with some cloud network restrictions
    rejectUnauthorized: false
  }
});

const sendMail = async (to, subject, html, options = {}) => {
  try {
    lastEmailError = null;
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.EMAIL_FROM || `"Travelora" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments: options.attachments || [],
    });
    logger.info(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    lastEmailError = {
      code: error.code,
      responseCode: error.responseCode,
      message: error.message,
    };
    logger.error(`Email sending failed: ${error.message}`);
    return false;
  }
};

exports.getLastEmailError = () => lastEmailError;

exports.sendBookingConfirmation = async (userEmail, bookingDetails, invoiceBuffer) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Booking Confirmed!</h1>
        <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">Get ready for your next adventure</p>
      </div>
      
      <div style="padding: 40px 30px; background-color: #ffffff;">
        <p style="font-size: 18px; color: #111827; margin-bottom: 24px;">Hi <strong>${bookingDetails.userName}</strong>,</p>
        <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 30px;">
          Great news! Your booking for <span style="color: #6366f1; font-weight: 700;">${bookingDetails.packageTitle}</span> has been successfully confirmed. We've excited to have you on board!
        </p>
        
        <div style="background-color: #f3f4f6; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
          <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-top: 0; margin-bottom: 16px;">Itinerary Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Travel Date</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${bookingDetails.travelDate}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Travellers</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${bookingDetails.numberOfTravelers} Persons</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Total Amount</td>
              <td style="padding: 12px 0; color: #6366f1; font-size: 18px; font-weight: 800; text-align: right;">₹${bookingDetails.totalAmount.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
          We have attached the booking invoice to this email for your records.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || '#'}/dashboard/bookings" style="background-color: #6366f1; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: background-color 0.3s ease;">Download Invoice PDF</a>
        </div>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 14px; color: #9ca3af; margin-bottom: 8px;">Questions? We're here to help.</p>
        <p style="font-size: 14px; color: #6366f1; font-weight: 600; margin: 0;">support@travelora.com</p>
        <div style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
          © 2026 Travelora Inc. All rights reserved.
        </div>
      </div>
    </div>`;
  return sendMail(userEmail, 'Booking Confirmed — Travelora', html, {
    attachments: invoiceBuffer ? [
      {
        filename: `Invoice_${bookingDetails.bookingId}.pdf`,
        content: invoiceBuffer,
      }
    ] : []
  });
};

exports.sendBookingInvoice = async (userEmail, bookingDetails, invoiceBuffer) => {
  const html = `
              <div style="font-family: 'Segoe UI', Tahoma, sans-serif;max-width:600px;margin:auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);border:1px solid #e5e7eb;">

            <!-- HEADER -->
            <div style="background: linear-gradient(135deg,#0ea5e9,#0284c7);padding:50px 25px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:30px;font-weight:800;letter-spacing:-0.5px;">Invoice Ready</h1>

              <p style="color:rgba(255,255,255,0.9);margin-top:10px;font-size:16px;">Your booking invoice is prepared</p>
            </div>

            <!-- CONTENT -->
            <div style="padding:40px 30px;">

              <p style="font-size:18px;color:#111827;margin-bottom:20px;">
                Hi <strong>${bookingDetails.userName}</strong>,
              </p>

              <p style="font-size:15px;color:#4b5563;line-height:1.6;margin-bottom:30px;">
                Thank you for choosing <b style="color:#0284c7;">Travelora</b> ✨  
                Your invoice for <strong>${bookingDetails.packageTitle}</strong> is now available.
              </p>

              <!-- INVOICE CARD -->
              <div style="background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:14px;padding:25px;border:1px solid #bae6fd;margin-bottom:30px;">
                <p style="margin:0;font-size:15px;color:#0369a1;font-weight:600;">📄 Invoice Attached</p>

                <p style="margin-top:8px;font-size:13px;color:#075985;">Download your invoice from this email attachment.</p>
              </div>

              <!-- INFO -->
              <p style="font-size:14px;color:#6b7280;">
                You can also access all your invoices anytime from your dashboard.
              </p>

            </div>

            <!-- FOOTER -->
            <div style="background:#f9fafb;padding:30px;text-align:center;border-top:1px solid #e5e7eb;">

              <p style="font-size:14px;color:#9ca3af;margin-bottom:6px;">Need help?</p>

              <p style="font-size:14px;color:#0284c7;font-weight:600;margin:0;">billing@travelora.com
              </p>
              <div style="margin-top:20px;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Travelora Inc.</div>
            </div>
          </div>`;

  return sendMail(userEmail, 'Invoice — Travelora', html, {
    attachments: [
      {
        filename: `Invoice_${bookingDetails.bookingId}.pdf`,
        content: invoiceBuffer,
      }
    ]
  });
};

exports.sendOtp = async (userEmail, otp, themeName = 'indigo') => {
  // Define premium gradient combinations
  const themes = {
    indigo: {
      primary: '#6366f1',
      secondary: '#4f46e5',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      bg: '#f8fafc',
      light: '#e0e7ff'
    },
    emerald: {
      primary: '#10b981',
      secondary: '#059669',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      bg: '#f0fdf4',
      light: '#d1fae5'
    },
    rose: {
      primary: '#f43f5e',
      secondary: '#e11d48',
      gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
      bg: '#fff1f2',
      light: '#ffe4e6'
    },
    amber: {
      primary: '#f59e0b',
      secondary: '#d97706',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      bg: '#fffbeb',
      light: '#fef3c7'
    },
    violet: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      bg: '#f5f3ff',
      light: '#ede9fe'
    }
  };

  const theme = themes[themeName] || themes.indigo;

  // Format OTP for display (split into two groups of 3 for better readability)
  const otpPart1 = otp.slice(0, 3);
  const otpPart2 = otp.slice(3, 6);

  const html = `
        <!DOCTYPE html>
          <html>
          <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width">
          </head>

          <body style="margin:0;padding:0;background:#050505;font-family:Arial,sans-serif;">

          <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
          <td align="center" style="padding:40px 10px;">

          <table width="600" style="background:#111;border:1px solid #222;">

          <!-- HEADER -->
          <tr>
          <td style="padding:45px 40px 30px;text-align:center;border-bottom:1px solid #222;">

          <!-- PERFECT DIAMOND LOGO -->
          <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
            <tr>
              <td align="center">
                <!-- Diamond Box -->
                <div style="width: 44px; height: 44px; border: 1.5px solid #D4AF37; transform: rotate(45deg); margin: 0 auto; position: relative;">
                  <!-- Centered T -->
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); color: #D4AF37; font-family: 'Cinzel', serif; font-size: 18px; letter-spacing: 1px;"> T </div>
                </div>
              </td>
            </tr>
          </table>

          <h1 style="color:#fff;font-size:22px;letter-spacing:8px;margin:0;">
          TRAVELORA
          </h1>

          <p style="color:#D4AF37;font-size:10px;letter-spacing:4px;margin-top:8px;">
          PRIVATE RESERVE
          </p>

          </td>
          </tr>

          <!-- CONTENT -->
          <tr>
          <td style="padding:50px 40px;text-align:center;">

          <h2 style="color:#fff;font-size:26px;margin-bottom:16px;">
          Your Secure Passkey
          </h2>

          <p style="color:#888;font-size:15px;line-height:1.6;">
          To maintain the exclusivity and security of your dossier,<br>
          please authenticate your session using the code below.
          </p>

          <!-- OTP -->
          <table align="center" style="margin-top:40px;">
          <tr>

          <td style="padding:0 4px;">
          <div style="width:48px;height:58px;line-height:58px;color:#D4AF37;border:1px solid #333;border-bottom:2px solid #D4AF37;text-align:center;font-size:26px;">
          ${otp[0]}
          </div>
          </td>

          <td style="padding:0 4px;">
          <div style="width:48px;height:58px;line-height:58px;color:#D4AF37;border:1px solid #333;border-bottom:2px solid #D4AF37;text-align:center;font-size:26px;">
          ${otp[1]}
          </div>
          </td>

          <td style="padding:0 4px;">
          <div style="width:48px;height:58px;line-height:58px;color:#D4AF37;border:1px solid #333;border-bottom:2px solid #D4AF37;text-align:center;font-size:26px;">
          ${otp[2]}
          </div>
          </td>

          <td style="padding:0 10px;color:#555;">—</td>

          <td style="padding:0 4px;">
          <div style="width:48px;height:58px;line-height:58px;color:#D4AF37;border:1px solid #333;border-bottom:2px solid #D4AF37;text-align:center;font-size:26px;">
          ${otp[3]}
          </div>
          </td>

          <td style="padding:0 4px;">
          <div style="width:48px;height:58px;line-height:58px;color:#D4AF37;border:1px solid #333;border-bottom:2px solid #D4AF37;text-align:center;font-size:26px;">
          ${otp[4]}
          </div>
          </td>

          <td style="padding:0 4px;">
          <div style="width:48px;height:58px;line-height:58px;color:#D4AF37;border:1px solid #333;border-bottom:2px solid #D4AF37;text-align:center;font-size:26px;">
          ${otp[5]}
          </div>
          </td>

          </tr>
          </table>

          <p style="color:#777;font-size:12px;margin-top:30px;">
          • Expiring in 10 minutes •
          </p>

          </td>
          </tr>

          <!-- BUTTON -->
          <tr>
          <td style="padding:40px;text-align:center;border-top:1px solid #222;background:#0A0A0A;">

          <a href="#" style="
          display:inline-block;
          padding:15px 40px;
          background:#D4AF37;
          color:#000;
          text-decoration:none;
          font-weight:bold;
          letter-spacing:2px;
          ">
          AUTHENTICATE
          </a>

          <p style="color:#666;font-size:13px;margin-top:20px;">
          Unrecognized request? Secure your account immediately.
          </p>

          </td>
          </tr>

          </table>

          </td>
          </tr>
          </table>

          </body>
          </html>`;

  return sendMail(userEmail, 'Verify your account — Travelora', html);
};

exports.sendCustomEmail = async (to, subject, body) => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">${body}</div>`;
  return sendMail(to, subject, html);
};
