import nodemailer from 'nodemailer';
import config from '../config/env.js';
import logger from './logger.js';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!config.smtp.host) {
    logger.warn('SMTP not configured - email not sent');
    return { messageId: 'mock-' + Date.now() };
  }

  try {
    const info = await transporter.sendMail({
      from: config.emailFrom,
      to,
      subject,
      html,
    });
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email send error: ${error.message}`);
    throw error;
  }
};

const emailTemplates = {
  verifyEmail: (token) => ({
    subject: 'Verify Your Email - NRI Legal Portal',
    html: `
      <h2>Welcome to NRI Legal Portal</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${process.env.CORS_ORIGIN || 'http://localhost:5173'}/auth/verify-email?token=${token}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  }),

  forgotPassword: (token) => ({
    subject: 'Reset Your Password - NRI Legal Portal',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${process.env.CORS_ORIGIN || 'http://localhost:5173'}/auth/reset-password?token=${token}">Reset Password</a>
      <p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>
    `,
  }),

  advocateApproved: () => ({
    subject: 'Your Account Has Been Verified - NRI Legal Portal',
    html: `
      <h2>Account Verified</h2>
      <p>Your advocate account has been verified. You can now accept client requests.</p>
    `,
  }),

  advocateRejected: (reason) => ({
    subject: 'Verification Update - NRI Legal Portal',
    html: `
      <h2>Verification Update</h2>
      <p>Your verification was not approved. Reason: ${reason}</p>
      <p>Please update your credentials and resubmit.</p>
    `,
  }),
};

export { sendEmail, emailTemplates };
export default { sendEmail, emailTemplates };
