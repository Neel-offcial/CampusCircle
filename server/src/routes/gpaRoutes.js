import express from 'express';
import { getGpaProfile, saveGpaProfile, syncPortalMarks } from '../controllers/gpaController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getGpaProfile);
router.post('/', saveGpaProfile);
router.post('/sync-portal', syncPortalMarks);

export default router;
