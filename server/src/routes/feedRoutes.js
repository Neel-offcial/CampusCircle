import express from 'express';
import {
  getPulses,
  createPulse,
  reactPulse,
  getEvents,
  rsvpEvent,
  getFeedPosts,
  createFeedPost,
  voteFeedPost,
  voteFeedPoll,
  commentFeedPost
} from '../controllers/feedController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// Campus Pulses (Stories / Blinks)
router.get('/pulses', getPulses);
router.post('/pulses', requireVerified, createPulse);
router.post('/pulses/:pulseId/react', reactPulse);

// Campus Events & Fests
router.get('/events', getEvents);
router.post('/events/:eventId/rsvp', rsvpEvent);

// Newsfeed Posts & Polls
router.get('/posts', getFeedPosts);
router.post('/posts', requireVerified, upload.single('image'), createFeedPost);
router.post('/posts/:postId/vote', voteFeedPost);
router.post('/posts/:postId/poll/vote', voteFeedPoll);
router.post('/posts/:postId/comment', commentFeedPost);

export default router;
