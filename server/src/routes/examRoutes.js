import express from 'express';
import { getExamSchedule, updateLabIaSchedule } from '../controllers/examController.js';
import { authenticate, requireCR } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Read exam schedule (Theory IA, Lab IA, SEE)
router.get('/schedule', getExamSchedule);

// Update Lab IA schedule (CR or Admin only, strictly section scoped)
router.put('/lab-ia', requireCR, updateLabIaSchedule);

export default router;
