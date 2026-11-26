import express from 'express';
import {
  initiateRegistration,
  completeRegistration,
  login,
  sendEduOtp,
  verifyEduOtp,
  getMe,
  updateProfile
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 2-Step Strict @atria.edu Registration
router.post('/register/initiate', initiateRegistration);
router.post('/register/complete', completeRegistration);
router.post('/login', login);

// Authenticated Routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/edu/send-otp', authenticate, sendEduOtp);
router.post('/edu/verify-otp', authenticate, verifyEduOtp);

export default router;
