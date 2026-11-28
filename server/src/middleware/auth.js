import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/index.js';
import { db } from '../db/db.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    const user = db.findById('users', decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User no longer exists.' });
    }

    // Attach user (without password hash)
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired.' });
  }
}

export function requireVerified(req, res, next) {
  if (!req.user || !req.user.isVerified) {
    return res.status(403).json({
      message: 'Access restricted. Please verify your college email to unlock this feature.',
      requiresVerification: true
    });
  }
  next();
}

export function requireGroupMember(req, res, next) {
  const groupId = req.params.groupId || req.body.groupId || req.query.groupId;
  if (!groupId) {
    return res.status(400).json({ message: 'Group ID is required.' });
  }

  const membership = db.findOne('memberships', {
    groupId,
    userId: req.user._id
  });

  if (!membership) {
    return res.status(403).json({ message: 'You are not a member of this group.' });
  }

  req.membership = membership;
  next();
}

export function requireGroupAdmin(req, res, next) {
  const groupId = req.params.groupId || req.body.groupId || req.query.groupId;
  if (!groupId) {
    return res.status(400).json({ message: 'Group ID is required.' });
  }

  const membership = db.findOne('memberships', {
    groupId,
    userId: req.user._id
  });

  if (!membership || membership.role !== 'admin') {
    return res.status(403).json({ message: 'Group Administrator privileges required.' });
  }

  req.membership = membership;
  next();
}

/**
 * Super Administrator Check (Neel / Platform Admin)
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  const isNeel =
    req.user.username === 'neel_dev' ||
    req.user.username === 'neel' ||
    req.user.username === 'neel_cse22' ||
    (req.user.email && req.user.email.toLowerCase().includes('neel'));

  if (req.user.role === 'admin' || isNeel) {
    req.user.role = 'admin';
    return next();
  }
  return res.status(403).json({ message: 'Super Administrator privileges required.' });
}

/**
 * Class Representative (CR) or Administrator Check
 */
export function requireCR(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  const isNeel =
    req.user.username === 'neel_dev' ||
    req.user.username === 'neel' ||
    req.user.username === 'neel_cse22' ||
    (req.user.email && req.user.email.toLowerCase().includes('neel'));

  if (req.user.role === 'cr' || req.user.role === 'admin' || isNeel) {
    return next();
  }
  return res.status(403).json({ message: 'Class Representative (CR) or Administrator access required.' });
}
