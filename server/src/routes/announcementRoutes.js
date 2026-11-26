import express from 'express';
import { getGroupAnnouncements, createAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';
import { authenticate, requireGroupMember, requireGroupAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/group/:groupId', requireGroupMember, getGroupAnnouncements);
router.post('/group/:groupId', requireGroupAdmin, createAnnouncement);
router.delete('/:announcementId', deleteAnnouncement);

export default router;
