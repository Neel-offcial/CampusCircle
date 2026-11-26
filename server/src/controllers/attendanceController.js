import { db } from '../db/db.js';

// Subject alias dictionary to normalize codes between portal and curriculum
export const SUBJECT_ALIASES = {
  'BAINB501': 'BAICB501',
  'BAICB501': 'BAICB501',
  'BSTQAB515': 'BSTQAB515A',
  'BSTQAB515A': 'BSTQAB515A'
};

// Default academic data matching Atria Institute of Technology CSE Sem V Sec C
export const DEFAULT_ATTENDANCE = {
  theory: [
    { name: "Artificial Intelligence Concepts and Practice", code: "BAICB501", conducted: 14, present: 10, absent: 4, section: "theory" },
    { name: "Computer Networks and Security", code: "BCNSB502", conducted: 16, present: 12, absent: 4, section: "theory" },
    { name: "Intelligent Data Analytics", code: "BIDAB503", conducted: 10, present: 9, absent: 1, section: "theory" },
    { name: "Software Testing and Quality Assurance", code: "BSTQAB515A", conducted: 8, present: 7, absent: 1, section: "theory" },
    { name: "Economics and Financial Management", code: "BEFMK506", conducted: 8, present: 6, absent: 2, section: "theory" },
    { name: "Research Methodology and IPR", code: "BRMIK504", conducted: 0, present: 0, absent: 0, section: "theory" } // 0-conducted edge case
  ],
  laboratory: [
    { name: "React and Node JS Lab", code: "BRALB507", conducted: 4, present: 4, absent: 0, section: "laboratory" },
    { name: "Intelligent Data Analytics Lab", code: "BIDAB503L", conducted: 4, present: 3, absent: 1, section: "laboratory" },
    { name: "Artificial Intelligence Concepts Lab", code: "BAICB501L", conducted: 4, present: 1, absent: 3, section: "laboratory" },
    { name: "Computer Networks and Security Lab", code: "BCNSB502L", conducted: 2, present: 2, absent: 0, section: "laboratory" }
  ],
  electives: [],
  extractedAt: new Date().toISOString()
};

export const DEFAULT_TIMETABLE = {
  academicYear: "2026-27",
  semester: "V",
  section: "C",
  breaks: [
    { name: "Morning Tea Break", start: "10:30", end: "10:45", icon: "tea" },
    { name: "Lunch Break", start: "12:45", end: "13:30", icon: "lunch" }
  ],
  days: [
    {
      day: "Monday",
      classes: [
        { start: "08:30", end: "09:30", code: "BSTQAB515A", subject: "Software Testing & QA", faculty: "Prof. Pallavi U", batch: "ALL", room: "LH-501" },
        { start: "09:30", end: "10:30", code: "BIDAB503", subject: "Intelligent Data Analytics", faculty: "Dr. Devi Kannan", batch: "ALL", room: "LH-501" },
        { start: "10:30", end: "10:45", isBreak: true, subject: "Tea Break" },
        { start: "10:45", end: "11:45", code: "BCNSB502", subject: "Computer Networks & Security", faculty: "Ms. Shammi L", batch: "ALL", room: "LH-501" },
        { start: "11:45", end: "12:45", code: "BAICB501", subject: "AI & Applications", faculty: "Prof. Preetha M", batch: "ALL", room: "LH-501" },
        { start: "12:45", end: "13:30", isBreak: true, subject: "Lunch Break" },
        { start: "13:30", end: "14:30", code: "BEFMK506", subject: "Economics & Financial Mgmt", faculty: "Ms. P R Madhushree", batch: "ALL", room: "LH-501" }
      ]
    },
    {
      day: "Tuesday",
      classes: [
        { start: "08:30", end: "10:30", code: "BRALB507", subject: "React & Node JS Lab", faculty: "Prof. Pratyusha R", batch: "B3", room: "Lab 326", isLab: true },
        { start: "08:30", end: "10:30", code: "BCNSB502L", subject: "CNS Lab", faculty: "Ms. Shammi L", batch: "B1", room: "Lab 508", isLab: true },
        { start: "08:30", end: "10:30", code: "BIDAB503L", subject: "IDA Lab", faculty: "Dr. Devi Kannan", batch: "B2", room: "Lab 509", isLab: true },
        { start: "10:30", end: "10:45", isBreak: true, subject: "Tea Break" },
        { start: "10:45", end: "11:45", code: "BIDAB503", subject: "Intelligent Data Analytics", faculty: "Dr. Devi Kannan", batch: "ALL", room: "LH-501" },
        { start: "11:45", end: "12:45", code: "BAICB501", subject: "AI & Applications", faculty: "Prof. Preetha M", batch: "ALL", room: "LH-501" },
        { start: "12:45", end: "13:30", isBreak: true, subject: "Lunch Break" },
        { start: "13:30", end: "14:30", code: "BCNSB502", subject: "Computer Networks & Security", faculty: "Ms. Shammi L", batch: "ALL", room: "LH-501" }
      ]
    },
    {
      day: "Wednesday",
      classes: [
        { start: "08:30", end: "09:30", code: "BSTQAB515A", subject: "Software Testing & QA", faculty: "Prof. Pallavi U", batch: "ALL", room: "LH-501" },
        { start: "09:30", end: "10:30", code: "BIDAB503", subject: "Intelligent Data Analytics", faculty: "Dr. Devi Kannan", batch: "ALL", room: "LH-501" },
        { start: "10:30", end: "10:45", isBreak: true, subject: "Tea Break" },
        { start: "10:45", end: "12:45", code: "BRALB507", subject: "React & Node JS Lab", faculty: "Prof. Pratyusha R", batch: "B2", room: "Lab 326", isLab: true },
        { start: "10:45", end: "12:45", code: "BAICB501L", subject: "AI Lab", faculty: "Prof. Preetha M", batch: "B3", room: "Lab 508", isLab: true },
        { start: "10:45", end: "12:45", code: "BIDAB503L", subject: "IDA Lab", faculty: "Dr. Devi Kannan", batch: "B1", room: "Lab 509", isLab: true },
        { start: "12:45", end: "13:30", isBreak: true, subject: "Lunch Break" },
        { start: "13:30", end: "14:30", code: "BAICB501", subject: "AI & Applications", faculty: "Prof. Preetha M", batch: "ALL", room: "LH-501" }
      ]
    },
    {
      day: "Thursday",
      classes: [
        { start: "08:30", end: "10:30", code: "BRALB507", subject: "React & Node JS Lab", faculty: "Prof. Pratyusha R", batch: "B1", room: "Lab 326", isLab: true },
        { start: "08:30", end: "10:30", code: "BCNSB502L", subject: "CNS Lab", faculty: "Ms. Shammi L", batch: "B2", room: "Lab 508", isLab: true },
        { start: "08:30", end: "10:30", code: "BIDAB503L", subject: "IDA Lab", faculty: "Dr. Devi Kannan", batch: "B3", room: "Lab 509", isLab: true },
        { start: "10:30", end: "10:45", isBreak: true, subject: "Tea Break" },
        { start: "10:45", end: "11:45", code: "BAICB501", subject: "AI & Applications", faculty: "Prof. Preetha M", batch: "ALL", room: "LH-501" },
        { start: "11:45", end: "12:45", code: "BCNSB502", subject: "Computer Networks & Security", faculty: "Ms. Shammi L", batch: "ALL", room: "LH-501" },
        { start: "12:45", end: "13:30", isBreak: true, subject: "Lunch Break" },
        { start: "13:30", end: "17:30", code: "BASDPK588", subject: "Sustainability Project - 3", faculty: "Department Mentors", batch: "ALL", room: "Lab Center", type: "project" }
      ]
    },
    {
      day: "Friday",
      classes: [
        { start: "08:30", end: "09:30", code: "BCNSB502", subject: "Computer Networks & Security", faculty: "Ms. Shammi L", batch: "ALL", room: "LH-501" },
        { start: "09:30", end: "10:30", code: "BEFMK506", subject: "Economics & Financial Mgmt", faculty: "Ms. P R Madhushree", batch: "ALL", room: "LH-501" },
        { start: "10:30", end: "10:45", isBreak: true, subject: "Tea Break" },
        { start: "10:45", end: "11:45", code: "BRMIK504", subject: "Research Methodology & IPR", faculty: "Ms. Tanzem M", batch: "ALL", room: "LH-501" },
        { start: "11:45", end: "12:45", code: "BSTQAB515A", subject: "Software Testing & QA", faculty: "Prof. Pallavi U", batch: "ALL", room: "LH-501" }
      ]
    }
  ]
};

function processSubjects(subjectList, defaultSection) {
  return (subjectList || []).map(sub => {
    const conducted = Number(sub.conducted) || 0;
    const present = Number(sub.present) || 0;
    const absent = Number(sub.absent) || Math.max(0, conducted - present);
    const section = sub.section || defaultSection;

    // 0-Conducted Edge Case handling:
    // If conducted = 0, do not treat as 0% or danger; mark as neutral unconducted
    if (conducted === 0) {
      return {
        ...sub,
        conducted: 0,
        present: 0,
        absent: 0,
        percentage: null,
        isZeroConducted: true,
        neededFor75: 0,
        canMiss75: 0,
        status: 'neutral',
        statusText: 'No classes conducted yet',
        section
      };
    }

    const percentage = Number(((present / conducted) * 100).toFixed(1));

    let neededFor75 = 0;
    let canMiss75 = 0;

    if (percentage < 75) {
      // Classes needed consecutively to achieve 75%
      let curPres = present;
      let curCond = conducted;
      while ((curPres / curCond) * 100 < 75 && neededFor75 < 200) {
        curPres++;
        curCond++;
        neededFor75++;
      }
    } else {
      // Classes can skip before dropping below 75%
      let curCond = conducted;
      while ((present / (curCond + 1)) * 100 >= 75 && canMiss75 < 200) {
        curCond++;
        canMiss75++;
      }
    }

    return {
      ...sub,
      conducted,
      present,
      absent,
      percentage,
      isZeroConducted: false,
      neededFor75,
      canMiss75,
      status: percentage >= 75 ? 'good' : percentage >= 65 ? 'warning' : 'danger',
      statusText: percentage >= 75 ? `Safe (+${canMiss75} classes)` : `Shortage (Need ${neededFor75})`,
      section
    };
  });
}

export async function getAttendance(req, res) {
  try {
    const record = db.findOne('attendanceRecords', { userId: req.user._id });
    const attendance = record ? record.data : DEFAULT_ATTENDANCE;

    // Strictly separate Theory and Laboratory ledgers (never merged mathematically)
    const theorySubjects = processSubjects(attendance.theory, 'theory');
    const labSubjects = processSubjects(attendance.laboratory, 'laboratory');
    const electiveSubjects = processSubjects(attendance.electives, 'electives');

    const allActive = [...theorySubjects, ...labSubjects, ...electiveSubjects];

    let totalConducted = 0;
    let totalPresent = 0;
    let belowTargetCount = 0;

    allActive.forEach(sub => {
      if (!sub.isZeroConducted) {
        totalConducted += sub.conducted;
        totalPresent += sub.present;
        if (sub.percentage < 75) {
          belowTargetCount++;
        }
      }
    });

    const overallPercentage = totalConducted > 0
      ? Number(((totalPresent / totalConducted) * 100).toFixed(1))
      : 100;

    res.json({
      overall: {
        percentage: overallPercentage,
        totalConducted,
        totalPresent,
        belowTargetCount,
        extractedAt: attendance.extractedAt || new Date().toISOString()
      },
      theory: theorySubjects,
      laboratory: labSubjects,
      electives: electiveSubjects,
      subjects: allActive,
      isLiveSynced: Boolean(record)
    });
  } catch (err) {
    console.error('[Attendance] Get error:', err);
    res.status(500).json({ message: 'Failed to fetch attendance.' });
  }
}

export async function syncAttendance(req, res) {
  try {
    let payload = req.body.attendance;

    // Support both direct object or wrapper under { studentHubAttendance: ... }
    if (req.body.studentHubAttendance) {
      payload = req.body.studentHubAttendance;
    }

    if (!payload || (!payload.theory && !payload.laboratory && !Array.isArray(payload))) {
      return res.status(400).json({ message: 'Invalid attendance payload. Expected studentHubAttendance schema.' });
    }

    // If sent as raw array of subjects, split into theory and laboratory
    if (Array.isArray(payload)) {
      const theory = [];
      const laboratory = [];
      payload.forEach(item => {
        if (item.section === 'laboratory' || item.name?.toLowerCase().includes('lab') || item.code?.endsWith('L')) {
          laboratory.push({ ...item, section: 'laboratory' });
        } else {
          theory.push({ ...item, section: 'theory' });
        }
      });
      payload = { theory, laboratory, electives: [] };
    }

    const enrichedPayload = {
      theory: payload.theory || [],
      laboratory: payload.laboratory || [],
      electives: payload.electives || [],
      extractedAt: payload.extractedAt || new Date().toISOString()
    };

    const existing = db.findOne('attendanceRecords', { userId: req.user._id });
    if (existing) {
      db.updateById('attendanceRecords', existing._id, { data: enrichedPayload });
    } else {
      db.insertOne('attendanceRecords', {
        userId: req.user._id,
        data: enrichedPayload
      });
    }

    res.json({
      message: 'Attendance data synced successfully!',
      extractedAt: enrichedPayload.extractedAt
    });
  } catch (err) {
    console.error('[Attendance] Sync error:', err);
    res.status(500).json({ message: 'Failed to sync attendance data.' });
  }
}

export async function getTimetable(req, res) {
  res.json({ timetable: DEFAULT_TIMETABLE });
}
