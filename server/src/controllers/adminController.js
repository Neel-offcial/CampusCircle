import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/db.js';

/**
 * Student applies for Class Representative (CR)
 */
export async function applyCR(req, res) {
  try {
    const { usn, reason, department, semester, section } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const cleanUsn = (usn || req.user.username || '1AT24CS137').trim().toUpperCase();
    const targetDept = (department || req.user.department || 'Computer Science and Engineering').trim();
    const targetSem = (semester || req.user.semester || 'V').trim();
    const targetSec = (section || req.user.section || 'C').trim();
    const appReason = (reason || 'Class Representative for batch coordination and lab IA scheduling').trim();

    // Check if there is already a pending application for this user
    const existing = db.findOne('crApplications', {
      userId: req.user._id,
      status: 'pending'
    });

    if (existing) {
      return res.json({
        message: 'You already have a pending CR application under review by Admin Neel.',
        application: existing
      });
    }

    const application = db.insertOne('crApplications', {
      userId: req.user._id,
      fullName: req.user.fullName,
      username: req.user.username,
      email: req.user.email || `${req.user.username}@atria.edu`,
      usn: cleanUsn,
      department: targetDept,
      semester: targetSem,
      section: targetSec,
      reason: appReason,
      status: 'pending',
      appliedAt: new Date().toISOString()
    });

    // Update user profile record
    db.updateById('users', req.user._id, {
      crApplicationStatus: 'pending'
    });

    // Notify sockets
    if (req.io) {
      req.io.emit('admin:cr-application-received', {
        applicant: req.user.fullName,
        section: `${targetDept} Sem ${targetSem} Sec ${targetSec}`
      });
    }

    res.status(201).json({
      message: 'CR application submitted successfully to Super Admin Neel.',
      application
    });
  } catch (err) {
    console.error('[AdminController] applyCR error:', err);
    res.status(500).json({ message: 'Failed to submit CR application.' });
  }
}

/**
 * Get current user's CR status and their latest application
 */
export async function getMyCRStatus(req, res) {
  try {
    const user = db.findById('users', req.user._id);
    const applications = db.find('crApplications', { userId: req.user._id });
    const latestApp = applications.length > 0 ? applications[applications.length - 1] : null;

    const isNeel =
      req.user.username === 'neel_dev' ||
      req.user.username === 'neel' ||
      req.user.username === 'neel_cse22' ||
      (req.user.email && req.user.email.toLowerCase().includes('neel'));

    res.json({
      role: isNeel ? 'admin' : (user?.role || 'student'),
      crSection: user?.crSection || (isNeel ? { department: 'All', semester: 'All', section: 'All' } : null),
      applicationStatus: latestApp ? latestApp.status : 'none',
      application: latestApp
    });
  } catch (err) {
    console.error('[AdminController] getMyCRStatus error:', err);
    res.status(500).json({ message: 'Failed to fetch CR status.' });
  }
}

/**
 * Super Admin: Get all CR applications
 */
export async function getCRApplications(req, res) {
  try {
    const apps = db.find('crApplications');
    // Sort newest first
    apps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    res.json({ applications: apps });
  } catch (err) {
    console.error('[AdminController] getCRApplications error:', err);
    res.status(500).json({ message: 'Failed to retrieve CR applications.' });
  }
}

/**
 * Super Admin: Approve a student as CR
 */
export async function approveCRApplication(req, res) {
  try {
    const { id } = req.params;
    const app = db.findById('crApplications', id);
    if (!app) {
      return res.status(404).json({ message: 'CR Application not found.' });
    }

    const updatedApp = db.updateById('crApplications', id, {
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user.username
    });

    // Update student's user record
    const targetUser = db.findById('users', app.userId);
    if (targetUser) {
      db.updateById('users', app.userId, {
        role: 'cr',
        crSection: {
          department: app.department,
          semester: app.semester,
          section: app.section
        },
        crApplicationStatus: 'approved'
      });
    }

    if (req.io) {
      req.io.emit('cr:status-updated', {
        userId: app.userId,
        status: 'approved',
        section: `${app.department} Sem ${app.semester} Sec ${app.section}`
      });
    }

    res.json({
      message: `Approved ${app.fullName} as Class Representative for ${app.section}.`,
      application: updatedApp
    });
  } catch (err) {
    console.error('[AdminController] approveCRApplication error:', err);
    res.status(500).json({ message: 'Failed to approve application.' });
  }
}

/**
 * Super Admin: Reject CR application
 */
export async function rejectCRApplication(req, res) {
  try {
    const { id } = req.params;
    const app = db.findById('crApplications', id);
    if (!app) {
      return res.status(404).json({ message: 'CR Application not found.' });
    }

    const updatedApp = db.updateById('crApplications', id, {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user.username
    });

    const targetUser = db.findById('users', app.userId);
    if (targetUser) {
      db.updateById('users', app.userId, {
        crApplicationStatus: 'rejected'
      });
    }

    res.json({
      message: `CR Application for ${app.fullName} rejected.`,
      application: updatedApp
    });
  } catch (err) {
    console.error('[AdminController] rejectCRApplication error:', err);
    res.status(500).json({ message: 'Failed to reject application.' });
  }
}

/**
 * Super Admin: Upload Academic Circular (PDF Timetable or Academic Calendar)
 */
export async function uploadAcademicDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please attach an official circular PDF document.' });
    }

    const { title, type, department, semester, academicYear } = req.body;

    const doc = db.insertOne('academicDocuments', {
      title: title?.trim() || req.file.originalname,
      type: type || 'calendar', // 'calendar' | 'timetable'
      department: department || 'All Departments',
      semester: semester || 'All Semesters',
      academicYear: academicYear || '2026-27',
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.fullName || req.user.username,
      uploadedAt: new Date().toISOString()
    });

    if (req.io) {
      req.io.emit('academic:document-published', {
        title: doc.title,
        type: doc.type,
        department: doc.department,
        semester: doc.semester,
        fileUrl: doc.fileUrl
      });
    }

    res.status(201).json({
      message: 'Official academic document uploaded and published successfully!',
      document: doc
    });
  } catch (err) {
    console.error('[AdminController] uploadAcademicDocument error:', err);
    res.status(500).json({ message: 'Failed to upload academic document.' });
  }
}

/**
 * Retrieve Academic Circulars & Master Timetables
 */
export async function getAcademicDocuments(req, res) {
  try {
    const { type, department, semester } = req.query;
    let docs = db.find('academicDocuments');

    if (type) {
      docs = docs.filter(d => d.type === type);
    }
    if (department && department !== 'All') {
      docs = docs.filter(d => d.department === 'All Departments' || d.department === department);
    }
    if (semester && semester !== 'All') {
      docs = docs.filter(d => d.semester === 'All Semesters' || d.semester === semester);
    }

    // Sort newest first
    docs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    res.json({ documents: docs });
  } catch (err) {
    console.error('[AdminController] getAcademicDocuments error:', err);
    res.status(500).json({ message: 'Failed to retrieve academic documents.' });
  }
}
