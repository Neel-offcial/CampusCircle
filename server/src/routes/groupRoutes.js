import express from 'express';
import { getGroups, createGroup, getGroupById, joinGroup, leaveGroup, manageMember } from '../controllers/groupController.js';
import { authenticate, requireGroupAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getGroups);
router.post('/', createGroup);
router.get('/:groupId', getGroupById);
router.post('/:groupId/join', joinGroup);
router.post('/:groupId/leave', leaveGroup);
router.put('/:groupId/members/:memberId', requireGroupAdmin, manageMember);

export default router;
