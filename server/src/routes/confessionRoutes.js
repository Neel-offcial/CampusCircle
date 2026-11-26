import express from 'express';
import {
  getConfessions,
  createConfession,
  reactConfession,
  voteConfession,
  votePoll
} from '../controllers/confessionController.js';
import { authenticate, requireVerified } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getConfessions);
router.post('/', requireVerified, upload.single('image'), createConfession);
router.post('/:confessionId/react', reactConfession);
router.post('/:confessionId/vote', voteConfession);
router.post('/:confessionId/poll/vote', votePoll);

export default router;
