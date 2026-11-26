import nodemailer from 'nodemailer';
import { CONFIG } from '../config/index.js';

let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Send 6-digit Registration OTP to @atria.edu email
 */
export async function sendRegistrationOtp(email, otp, fullName = 'Student') {
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL SERVICE] REGISTRATION OTP FOR: ${email}`);
  console.log(`🔑 6-DIGIT VERIFICATION CODE: ${otp}`);
  console.log(`======================================================\n`);

  if (!transporter) {
    return { success: true, mode: 'console', otp };
  }

  try {
    const info = await transporter.sendMail({
      from: `"CampusCircle Atria" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `CampusCircle Verification Code: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">CampusCircle Verification</h2>
          <p style="color: #475569; font-size: 14px;">Hello ${fullName},</p>
          <p style="color: #475569; font-size: 14px;">Use the following 6-digit code to complete your student registration at Atria Institute of Technology:</p>
          <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 16px; border-radius: 12px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4338ca; font-family: monospace;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This code expires in 10 minutes. If you did not register for CampusCircle, please disregard this email.</p>
        </div>
      `
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email Service] Failed to deliver email via SMTP:', err.message);
    return { success: false, error: err.message, fallbackOtp: otp };
  }
}

/**
 * Send New Assignment Alert
 */
export async function sendNewAssignmentAlert(recipientEmail, studentName, assignment, groupName) {
  console.log(`\n📧 [DEADLINE ALERT] Sending new assignment alert to: ${recipientEmail} for "${assignment.title}"`);

  if (!transporter) return { success: true, mode: 'console' };

  try {
    const deadlineText = assignment.deadline
      ? new Date(assignment.deadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : 'No official deadline specified';

    await transporter.sendMail({
      from: `"CampusCircle Academic Alerts" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `[Assignment Alert] New Task: ${assignment.title} (${assignment.subject})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <span style="background: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">
            ${groupName}
          </span>
          <h2 style="color: #1e293b; margin-top: 12px; margin-bottom: 6px;">${assignment.title}</h2>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 16px;">Course: <strong>${assignment.subject}</strong></p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; margin-bottom: 16px;">
            <p style="margin: 0; color: #b45309; font-weight: bold; font-size: 13px;">⏰ Due Date: ${deadlineText}</p>
            ${assignment.facultyName ? `<p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px;">Faculty In-Charge: ${assignment.facultyName}</p>` : ''}
          </div>

          ${assignment.description ? `<p style="color: #475569; font-size: 13px; line-height: 1.5;">${assignment.description}</p>` : ''}

          <div style="margin-top: 24px; text-align: center;">
            <a href="http://localhost:5188/assignments" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 13px; display: inline-block;">
              View & Download Document
            </a>
          </div>
        </div>
      `
    });
    return { success: true };
  } catch (err) {
    console.error('[Email Service] Failed to send assignment alert:', err.message);
    return { success: false, error: err.message };
  }
}
