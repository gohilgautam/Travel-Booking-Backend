const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Send an email using the configured SMTP transporter.
 * @param {object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.message - HTML or plain text body
 * @param {array} options.attachments - Optional attachments
 * @returns {Promise<void>}
 */
const sendEmail = async ({ email, subject, message, attachments = [] }) => {
  // Create transporter only once (could be cached, but fine for demo)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL || process.env.EMAIL_FROM || `"Travelora" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: message,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send email to ${email}: ${error.message}`);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;
