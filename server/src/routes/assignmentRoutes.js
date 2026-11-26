import express from 'express';
import {
  getGroupAssignments,
  getAllUserAssignments,
  uploadAssignment,
  downloadAssignment,
  previewAssignment,
  deleteAssignment,
  togglePersonalCompletion
} from '../controllers/assignmentController.js';
import { authenticate, requireGroupMember } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

router.get('/my', getAllUserAssignments);
router.get('/group/:groupId', requireGroupMember, getGroupAssignments);
router.post('/group/:groupId', requireGroupMember, upload.single('file'), uploadAssignment);
router.get('/:assignmentId/download', downloadAssignment);
router.get('/:assignmentId/preview', previewAssignment);
router.delete('/:assignmentId', deleteAssignment);
router.post('/:assignmentId/toggle-complete', togglePersonalCompletion);

export default router;
