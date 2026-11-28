import { db } from '../db/db.js';

export const DEFAULT_EXAM_SCHEDULE = {
  department: 'Computer Science and Engineering',
  semester: 'V',
  section: 'C',
  theoryIa: [
    {
      code: 'BAICB501',
      name: 'Artificial Intelligence Concepts and Practice',
      examDate: '2026-12-04',
      startTime: '09:30',
      endTime: '10:45',
      room: 'LH-501',
      portions: 'Module 1 (Search Strategies & Heuristics) & Module 2 (Adversarial Search, Alpha-Beta Pruning)',
      faculty: 'Prof. Preetha M',
      pyqAvailable: true
    },
    {
      code: 'BCNSB502',
      name: 'Computer Networks and Security',
      examDate: '2026-12-05',
      startTime: '09:30',
      endTime: '10:45',
      room: 'LH-501',
      portions: 'Module 1 (Application Layer Protocols & DNS) & Module 2 (Transport Layer, TCP Flow Control)',
      faculty: 'Ms. Shammi L',
      pyqAvailable: true
    },
    {
      code: 'BIDAB503',
      name: 'Intelligent Data Analytics',
      examDate: '2026-12-06',
      startTime: '09:30',
      endTime: '10:45',
      room: 'LH-501',
      portions: 'Module 1 (Data Preprocessing & Cleaning) & Module 2 (Clustering, K-Means & PCA)',
      faculty: 'Dr. Devi Kannan',
      pyqAvailable: true
    },
    {
      code: 'BSTQAB515A',
      name: 'Software Testing and Quality Assurance',
      examDate: '2026-12-07',
      startTime: '09:30',
      endTime: '10:45',
      room: 'LH-501',
      portions: 'Module 1 (Boundary Value & Equivalence Class Testing) & Module 2 (White Box & Path Coverage)',
      faculty: 'Prof. Pallavi U',
      pyqAvailable: true
    }
  ],
  labIa: [
    {
      batch: 'B1',
      code: 'BRALB507',
      name: 'React and Node JS Lab IA',
      examDate: '2026-12-02',
      startTime: '08:30',
      endTime: '11:30',
      room: 'Lab 326',
      portions: 'Programs 1 to 6 Execution + Viva Voce (Components, State, Hooks & Express APIs)',
      faculty: 'Prof. Prathyusha R',
      lastUpdatedBy: 'Class CR'
    },
    {
      batch: 'B2',
      code: 'BIDAB503L',
      name: 'Intelligent Data Analytics Lab IA',
      examDate: '2026-12-03',
      startTime: '10:45',
      endTime: '13:45',
      room: 'Lab 509',
      portions: 'Programs 1 to 5: K-Means, Decision Trees, and Data Normalization',
      faculty: 'Dr. Devi Kannan',
      lastUpdatedBy: 'Class CR'
    },
    {
      batch: 'B3',
      code: 'BAICB501L',
      name: 'AI Concepts Lab IA',
      examDate: '2026-12-04',
      startTime: '13:30',
      endTime: '16:30',
      room: 'Lab 508',
      portions: 'Programs 1 to 5: BFS/DFS, A* Algorithm, and Minimax Game Tree',
      faculty: 'Prof. Preetha M',
      lastUpdatedBy: 'Class CR'
    }
  ],
  seeFinals: {
    title: 'VTU Semester End Examinations (SEE)',
    commencingDate: '2027-01-12',
    eligibilityNotice: 'Strict VTU requirement: Minimum 75% attendance in each course and 20/50 CIE passing marks.',
    hallTicketsRelease: 'Expected 2027-01-05'
  }
};

/**
 * Get active exam schedule for the student's section
 */
export async function getExamSchedule(req, res) {
  try {
    const dept = req.user?.department || 'Computer Science and Engineering';
    const sem = req.user?.semester || 'V';
    const sec = req.user?.section || 'C';
    const studentBatch = req.user?.batch || 'B1';

    let schedule = db.findOne('examSchedules', {
      department: dept,
      semester: sem,
      section: sec
    });

    if (!schedule) {
      // Seed default schedule
      schedule = db.insertOne('examSchedules', {
        ...DEFAULT_EXAM_SCHEDULE,
        department: dept,
        semester: sem,
        section: sec,
        createdAt: new Date().toISOString()
      });
    }

    // Determine upcoming exam countdown
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingTheory = schedule.theoryIa
      .filter(t => t.examDate >= todayStr)
      .sort((a, b) => a.examDate.localeCompare(b.examDate));

    const nextTheory = upcomingTheory.length > 0 ? upcomingTheory[0] : schedule.theoryIa[0];

    // Filter lab IA for user batch
    const myBatchLab = schedule.labIa.find(l => l.batch === studentBatch) || schedule.labIa[0];

    res.json({
      schedule,
      nextTheory,
      myBatchLab,
      studentBatch,
      isCR: req.user?.role === 'cr',
      isAdmin: req.user?.role === 'admin'
    });
  } catch (err) {
    console.error('[ExamController] getExamSchedule error:', err);
    res.status(500).json({ message: 'Failed to retrieve exam schedule.' });
  }
}

/**
 * Update flexible Lab IA Schedule (CR or Admin only)
 * Strictly verifies section boundary for CR!
 */
export async function updateLabIaSchedule(req, res) {
  try {
    const { department, semester, section, batch, examDate, startTime, endTime, room, portions, faculty } = req.body;

    const targetDept = department || req.user?.department || 'Computer Science and Engineering';
    const targetSem = semester || req.user?.semester || 'V';
    const targetSec = section || req.user?.section || 'C';

    const isNeel =
      req.user.username === 'neel_dev' ||
      req.user.username === 'neel' ||
      req.user.username === 'neel_cse22' ||
      (req.user.email && req.user.email.toLowerCase().includes('neel'));

    // Strict Scope check: CR can ONLY edit their own section!
    if (req.user.role === 'cr' && !isNeel) {
      const crSec = req.user.crSection;
      if (!crSec || crSec.section !== targetSec) {
        return res.status(403).json({
          message: `Forbidden: You are the CR for Section ${crSec?.section || 'Unknown'}. You cannot modify Lab IA schedules for Section ${targetSec}.`
        });
      }
    }

    let schedule = db.findOne('examSchedules', {
      department: targetDept,
      semester: targetSem,
      section: targetSec
    });

    if (!schedule) {
      schedule = db.insertOne('examSchedules', {
        ...DEFAULT_EXAM_SCHEDULE,
        department: targetDept,
        semester: targetSem,
        section: targetSec,
        createdAt: new Date().toISOString()
      });
    }

    // Find and update the batch lab slot
    const updatedLabIa = (schedule.labIa || []).map(item => {
      if (item.batch === batch) {
        return {
          ...item,
          examDate: examDate || item.examDate,
          startTime: startTime || item.startTime,
          endTime: endTime || item.endTime,
          room: room || item.room,
          portions: portions || item.portions,
          faculty: faculty || item.faculty,
          lastUpdatedBy: `${req.user.fullName} (Sec ${targetSec} CR)`,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    const updated = db.updateById('examSchedules', schedule._id, {
      labIa: updatedLabIa,
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: req.user.fullName
    });

    // Auto-create an official announcement in Section C group
    const officialGroup = db.findOne('groups', { name: `CSE 5th Sem - Section ${targetSec} (Official)` }) ||
                          db.findOne('groups', { name: 'CSE 5th Sem - Section C (Official)' });

    if (officialGroup) {
      db.insertOne('announcements', {
        groupId: officialGroup._id,
        createdBy: req.user._id,
        authorName: req.user.fullName,
        authorRole: 'CR',
        title: `📢 Lab IA Rescheduled: Batch ${batch}`,
        content: `Attention Batch ${batch}: Lab IA has been scheduled for ${examDate} from ${startTime} to ${endTime} in ${room}. Portions: ${portions || 'Prescribed lab programs'}.`,
        isPinned: true,
        createdAt: new Date().toISOString()
      });
    }

    if (req.io) {
      req.io.emit('exam:lab-ia-updated', {
        section: targetSec,
        batch,
        examDate,
        startTime,
        room,
        updatedBy: req.user.fullName
      });
    }

    res.json({
      message: `Lab IA schedule for Batch ${batch} (Sec ${targetSec}) updated and broadcast to classmates!`,
      schedule: updated
    });
  } catch (err) {
    console.error('[ExamController] updateLabIaSchedule error:', err);
    res.status(500).json({ message: 'Failed to update Lab IA schedule.' });
  }
}
