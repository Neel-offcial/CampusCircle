import nodemailer from 'nodemailer';
import { CONFIG } from '../config/index.js';

let transporter = null;
let etherealAccount = null;
let deliveryMode = 'uninitialized';

// Initialize transporter on startup
async function initTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transportConfig = process.env.SMTP_HOST
        ? {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          }
        : {
            service: process.env.SMTP_SERVICE || 'gmail',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          };

      transporter = nodemailer.createTransport(transportConfig);
      deliveryMode = 'smtp';
      console.log(`[Email Service] Live SMTP Transporter initialized (${process.env.SMTP_USER})`);
      return;
    } catch (err) {
      console.warn('[Email Service] Failed to initialize live SMTP, falling back to Ethereal:', err.message);
    }
  }

  // Fallback to automatic Ethereal test inbox
  try {
    etherealAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: etherealAccount.smtp.host,
      port: etherealAccount.smtp.port,
      secure: etherealAccount.smtp.secure,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass
      }
    });
    deliveryMode = 'ethereal';
    console.log(`[Email Service] Ethereal Virtual SMTP Transporter initialized (${etherealAccount.user})`);
  } catch (err) {
    deliveryMode = 'console';
    console.warn('[Email Service] Offline/Console mode active:', err.message);
  }
}

// Kick off initialization
initTransporter();

/**
 * Send 6-digit Registration OTP
 */
export async function sendRegistrationOtp(email, otp, fullName = 'Student') {
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL SERVICE] REGISTRATION OTP FOR: ${email}`);
  console.log(`🔑 6-DIGIT VERIFICATION CODE: ${otp}`);
  console.log(`📡 DELIVERY MODE: ${deliveryMode}`);
  console.log(`======================================================\n`);

  if (!transporter) {
    await initTransporter();
  }

  if (!transporter) {
    return { success: true, mode: 'console', otp, demoOtp: otp };
  }

  try {
    const fromAddress = process.env.SMTP_USER || '"CampusCircle Atria" <no-reply@campuscircle.atria.edu>';
    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: `CampusCircle Verification Code: ${otp}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 18px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: #4f46e5; color: white; border-radius: 12px; font-weight: 800; font-size: 22px;">C</div>
            <h2 style="color: #1e293b; margin: 12px 0 4px; font-size: 20px;">CampusCircle Student Verification</h2>
            <p style="color: #64748b; font-size: 13px; margin: 0;">Atria Institute of Technology • CSE Sem V</p>
          </div>

          <p style="color: #334155; font-size: 14px; line-height: 1.5;">Hello <strong>${fullName}</strong>,</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.5;">
            Use the following 6-digit one-time code to complete your student registration or verify your institutional identity:
          </p>

          <div style="background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%); border: 2px dashed #818cf8; padding: 20px; border-radius: 14px; text-align: center; margin: 24px 0;">
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #3730a3; font-family: monospace;">${otp}</span>
          </div>

          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
            ⏰ This code expires in <strong>10 minutes</strong>. Never share this code with anyone.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px; margin: 0; text-align: center;">
            CampusCircle • Atria Institute of Technology, ASKB Campus, Anandnagar, Bengaluru 560024
          </p>
        </div>
      `
    });

    let previewUrl = null;
    if (deliveryMode === 'ethereal') {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`🔗 [EMAIL PREVIEW URL]: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      mode: deliveryMode,
      otp,
      demoOtp: otp
    };
  } catch (err) {
    console.error('[Email Service] Failed to deliver email via SMTP:', err.message);
    return {
      success: true, // Still return success so user can use fallback OTP and isn't blocked
      error: err.message,
      mode: 'fallback',
      otp,
      demoOtp: otp
    };
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
      from: process.env.SMTP_USER || '"CampusCircle Academic Alerts" <no-reply@campuscircle.atria.edu>',
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
