import express from 'express';
import {
  getGroupMessages,
  sendMessage,
  toggleReaction,
  getGroupFiles,
  uploadGroupFile
} from '../controllers/chatController.js';
import { authenticate, requireGroupMember } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// Chat messages
router.get('/:groupId/messages', requireGroupMember, getGroupMessages);
router.post('/:groupId/messages', requireGroupMember, upload.single('file'), sendMessage);
router.post('/:groupId/messages/:messageId/react', requireGroupMember, toggleReaction);

// Files & media library
router.get('/:groupId/files', requireGroupMember, getGroupFiles);
router.post('/:groupId/files', requireGroupMember, upload.single('file'), uploadGroupFile);

export default router;
