import express from 'express';
import {
  getListings,
  getListingById,
  createListing,
  startInquiry,
  getConversations,
  getConversationMessages,
  sendInquiryMessage
} from '../controllers/marketplaceController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// Public Student Listings
router.get('/listings', getListings);
router.get('/listings/:id', getListingById);
router.post('/listings', requireVerified, upload.single('image'), createListing);

// Blind Anonymous Inquiries & Relay Chat
router.post('/listings/:listingId/inquire', startInquiry);
router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getConversationMessages);
router.post('/conversations/:conversationId/messages', upload.single('file'), sendInquiryMessage);

export default router;
