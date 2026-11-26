import express from 'express';
import { getAttendance, syncAttendance, getTimetable } from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAttendance);
router.post('/sync', syncAttendance);
router.get('/timetable', getTimetable);

export default router;
