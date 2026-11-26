import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Creates a one-way irreversible SHA-256 hash of an email address.
 * Normalizes email (lowercase, trimmed) before hashing.
 * Allows detecting duplicate accounts without ever storing the raw email.
 */
export function hashEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Hash a user password with bcrypt
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password against bcrypt hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a 6-digit verification code
 */
export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a clean random tag for anonymous confessions e.g. "Anon #4827"
 */
export function generateAnonymousTag() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `Anon #${num}`;
}
