import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import { CONFIG } from '../config/index.js';
import { hashEmail, hashPassword, comparePassword, generateOtp } from '../utils/crypto.js';
import { sendRegistrationOtp } from '../services/emailService.js';

// Temporary store for registrations awaiting OTP
// Key: email -> { username, password, fullName, email, department, semester, section, batch, otp, expiresAt }
const pendingRegistrations = new Map();

// Temporary store for existing users doing one-time OTP
const pendingOtps = new Map();

/**
 * Step 1 of Registration: Validate details & send OTP to @atria.edu
 */
export async function initiateRegistration(req, res) {
  try {
    const { username, password, fullName, email, department, semester, section, batch } = req.body;

    if (!username || !password || !fullName || !email) {
      return res.status(400).json({ message: 'Full name, username, password, and @atria.edu email are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Institutional / Email Validation
    const isAtriaEmail = cleanEmail.endsWith('@atria.edu') || cleanEmail.endsWith('@atriadigitalcampus.com');
    const allowAny = process.env.ALLOW_ANY_EMAIL === 'true' || process.env.NODE_ENV !== 'production';

    if (!isAtriaEmail && !allowAny) {
      return res.status(400).json({
        message: 'Registration is restricted strictly to official Atria Institute of Technology student emails ending with @atria.edu'
      });
    }

    // Check if username taken
    const existingUser = db.findOne('users', { username: cleanUsername });
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken. Please choose another.' });
    }

    // Check if email already registered
    const existingEmail = db.findOne('users', { email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account is already registered with this email. Please log in.' });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    pendingRegistrations.set(cleanEmail, {
      username: cleanUsername,
      password,
      fullName: fullName.trim(),
      email: cleanEmail,
      department: department || 'Computer Science and Engineering',
      semester: semester || 'V',
      section: section || 'C',
      batch: batch || 'B1',
      otp,
      expiresAt
    });

    // Send email via Nodemailer
    const emailRes = await sendRegistrationOtp(cleanEmail, otp, fullName);

    res.json({
      message: emailRes.mode === 'smtp'
        ? `Verification code delivered to ${cleanEmail}. Please check your inbox.`
        : `Verification code generated for ${cleanEmail}.`,
      demoOtp: otp,
      previewUrl: emailRes.previewUrl || null,
      deliveryMode: emailRes.mode || 'console',
      email: cleanEmail
    });
  } catch (err) {
    console.error('[Auth] Initiate Registration error:', err);
    res.status(500).json({ message: 'Failed to initiate registration.' });
  }
}

/**
 * Step 2 of Registration: Verify OTP & create verified account
 */
export async function completeRegistration(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit OTP code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const pending = pendingRegistrations.get(cleanEmail);

    if (!pending) {
      return res.status(400).json({ message: 'No pending registration found for this email. Please sign up again.' });
    }

    if (Date.now() > pending.expiresAt) {
      pendingRegistrations.delete(cleanEmail);
      return res.status(400).json({ message: 'Verification code expired. Please request a new code.' });
    }

    if (pending.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect verification code. Please check your email or use the demo code.' });
    }

    // Hash password and create verified user
    const passwordHash = await hashPassword(pending.password);
    const emailHash = hashEmail(cleanEmail);

    const user = db.insertOne('users', {
      username: pending.username,
      passwordHash,
      fullName: pending.fullName,
      email: cleanEmail, // Kept strictly for assignment deadline alerts
      emailHash,
      department: pending.department,
      semester: pending.semester,
      section: pending.section,
      batch: pending.batch,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(pending.fullName)}&backgroundColor=4f46e5`,
      isVerified: true,
      emailAlerts: true,
      bio: `5th Sem ${pending.department.split(' ')[0]} Student @ Atria`
    });

    // Remove from pending registrations
    pendingRegistrations.delete(cleanEmail);

    const token = jwt.sign({ userId: user._id }, CONFIG.JWT_SECRET, { expiresIn: CONFIG.JWT_EXPIRES_IN });
    const { passwordHash: _, ...safeUser } = user;

    res.status(201).json({
      message: 'Registration verified and account created successfully!',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth] Complete Registration error:', err);
    res.status(500).json({ message: 'Failed to complete registration.' });
  }
}

/**
 * Standard login
 */
export async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = db.findOne('users', { username: cleanUsername });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign({ userId: user._id }, CONFIG.JWT_SECRET, { expiresIn: CONFIG.JWT_EXPIRES_IN });
    const { passwordHash: _, ...safeUser } = user;

    res.json({
      message: 'Login successful!',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
}

/**
 * Existing user email verification OTP
 */
export async function sendEduOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Please provide a valid college email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isAtriaEmail = cleanEmail.endsWith('@atria.edu') || cleanEmail.endsWith('@atriadigitalcampus.com');
    const allowAny = process.env.ALLOW_ANY_EMAIL === 'true' || process.env.NODE_ENV !== 'production';

    if (!isAtriaEmail && !allowAny) {
      return res.status(400).json({
        message: 'Only official student emails ending with @atria.edu are permitted.'
      });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    pendingOtps.set(req.user._id, {
      otp,
      email: cleanEmail,
      emailHash: hashEmail(cleanEmail),
      expiresAt
    });

    const emailRes = await sendRegistrationOtp(cleanEmail, otp, req.user.fullName);

    res.json({
      message: `Verification code generated for ${cleanEmail}`,
      demoOtp: otp,
      previewUrl: emailRes.previewUrl || null,
      deliveryMode: emailRes.mode || 'console',
      expiresInMinutes: 10
    });
  } catch (err) {
    console.error('[Auth] Send OTP error:', err);
    res.status(500).json({ message: 'Failed to generate verification code.' });
  }
}

export async function verifyEduOtp(req, res) {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP is required.' });

    const pending = pendingOtps.get(req.user._id);
    if (!pending) return res.status(400).json({ message: 'No pending verification found.' });

    if (Date.now() > pending.expiresAt) {
      pendingOtps.delete(req.user._id);
      return res.status(400).json({ message: 'Code expired. Request a new one.' });
    }

    if (pending.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Incorrect verification code.' });
    }

    const updated = db.updateById('users', req.user._id, {
      isVerified: true,
      email: pending.email,
      emailHash: pending.emailHash
    });

    pendingOtps.delete(req.user._id);
    const { passwordHash: _, ...safeUser } = updated;

    res.json({
      message: 'College student status verified successfully!',
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth] Verify OTP error:', err);
    res.status(500).json({ message: 'Verification failed.' });
  }
}

export async function getMe(req, res) {
  const user = db.findById('users', req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
}

export async function updateProfile(req, res) {
  try {
    const { fullName, bio, department, semester, section, batch, emailAlerts, avatarUrl } = req.body;
    const update = {};
    if (fullName) update.fullName = fullName.trim();
    if (bio !== undefined) update.bio = bio.trim();
    if (department) update.department = department.trim();
    if (semester) update.semester = semester.trim();
    if (section) update.section = section.trim();
    if (batch) update.batch = batch.trim();
    if (emailAlerts !== undefined) update.emailAlerts = Boolean(emailAlerts);
    if (avatarUrl) update.avatarUrl = avatarUrl.trim();

    const updated = db.updateById('users', req.user._id, update);
    const { passwordHash: _, ...safeUser } = updated;

    res.json({
      message: 'Profile updated successfully!',
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth] Update profile error:', err);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
}
