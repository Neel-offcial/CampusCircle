import express from 'express';
import {
  applyCR,
  getMyCRStatus,
  getCRApplications,
  approveCRApplication,
  rejectCRApplication,
  uploadAcademicDocument,
  getAcademicDocuments
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

// Student CR routes
router.post('/cr-apply', applyCR);
router.get('/cr-status', getMyCRStatus);

// Academic documents (Available to all authenticated students to read)
router.get('/academic-documents', getAcademicDocuments);

// Super Admin exclusive routes (Neel)
router.get('/cr-applications', requireAdmin, getCRApplications);
router.post('/cr-applications/:id/approve', requireAdmin, approveCRApplication);
router.post('/cr-applications/:id/reject', requireAdmin, rejectCRApplication);
router.post('/academic-documents', requireAdmin, upload.single('file'), uploadAcademicDocument);

export default router;
