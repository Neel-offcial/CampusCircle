import fs from 'fs';
import path from 'path';
import { db } from '../db/db.js';
import { CONFIG } from '../config/index.js';
import { sendNewAssignmentAlert } from '../services/emailService.js';

export async function getGroupAssignments(req, res) {
  try {
    const { groupId } = req.params;
    const assignments = db.find('assignments', { groupId }, { sort: { createdAt: -1 } });

    // Attach uploader info and personal completion status
    const completions = db.find('personalCompletions', { userId: req.user._id });
    const completedSet = new Set(completions.map(c => c.assignmentId));

    const enriched = assignments.map(a => {
      const uploader = db.findById('users', a.uploadedBy);
      return {
        ...a,
        uploaderName: uploader ? uploader.fullName : 'Academic Member',
        uploaderAvatar: uploader ? uploader.avatarUrl : null,
        isCompleted: completedSet.has(a._id),
        canDelete: a.uploadedBy === req.user._id || req.membership?.role === 'admin'
      };
    });

    res.json({ assignments: enriched });
  } catch (err) {
    console.error('[Assignments] Get assignments error:', err);
    res.status(500).json({ message: 'Failed to fetch assignments.' });
  }
}

export async function getAllUserAssignments(req, res) {
  try {
    const scope = req.query.scope; // 'my' or 'all'
    const memberships = db.find('memberships', { userId: req.user._id });
    const userGroupIds = new Set(memberships.map(m => m.groupId));

    // If scope is 'my', only enrolled. Otherwise (default), show all assignments across campus groups!
    let assignments = db.find('assignments', {}, { sort: { deadline: 1, createdAt: -1 } });
    if (scope === 'my') {
      assignments = assignments.filter(a => userGroupIds.has(a.groupId));
    }

    const completions = db.find('personalCompletions', { userId: req.user._id });
    const completedSet = new Set(completions.map(c => c.assignmentId));

    const enriched = assignments.map(a => {
      const group = db.findById('groups', a.groupId);
      const uploader = db.findById('users', a.uploadedBy);
      return {
        ...a,
        groupName: group ? group.name : 'Academic Group',
        groupCategory: group ? group.category : 'Academic',
        isEnrolled: userGroupIds.has(a.groupId),
        uploaderName: uploader ? uploader.fullName : 'Academic Member',
        isCompleted: completedSet.has(a._id)
      };
    });

    res.json({ assignments: enriched });
  } catch (err) {
    console.error('[Assignments] Get all user assignments error:', err);
    res.status(500).json({ message: 'Failed to fetch assignments.' });
  }
}

export async function uploadAssignment(req, res) {
  try {
    const { groupId } = req.params;
    const { title, subject, description, facultyName, deadline } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ message: 'Title and subject are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please attach a document or resource file.' });
    }

    const assignment = db.insertOne('assignments', {
      groupId,
      uploadedBy: req.user._id,
      title: title.trim(),
      subject: subject.trim(),
      description: description ? description.trim() : '',
      facultyName: facultyName ? facultyName.trim() : '',
      deadline: deadline ? new Date(deadline).toISOString() : null,
      fileName: req.file.originalname,
      storedFileName: req.file.filename,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      downloadCount: 0
    });

    // Send Assignment Deadline Email Alert to Group Members
    try {
      const group = db.findById('groups', groupId);
      const memberships = db.find('memberships', { groupId });
      for (const m of memberships) {
        if (m.userId !== req.user._id) {
          const memberUser = db.findById('users', m.userId);
          if (memberUser && memberUser.email && memberUser.emailAlerts !== false) {
            sendNewAssignmentAlert(memberUser.email, memberUser.fullName, assignment, group?.name || 'Academic Group');
          }
        }
      }
    } catch (emailErr) {
      console.error('[Assignments] Email alerts dispatch notice:', emailErr.message);
    }

    res.status(201).json({
      message: 'Assignment uploaded successfully and shared with your group!',
      assignment: {
        ...assignment,
        uploaderName: req.user.fullName,
        isCompleted: false,
        canDelete: true
      }
    });
  } catch (err) {
    console.error('[Assignments] Upload error:', err);
    res.status(500).json({ message: 'Failed to upload assignment.' });
  }
}

export async function downloadAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const assignment = db.findById('assignments', assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment document not found.' });
    }

    // Server-side security check: must be a member of the group
    const membership = db.findOne('memberships', {
      groupId: assignment.groupId,
      userId: req.user._id
    });

    if (!membership) {
      return res.status(403).json({ message: 'Unauthorized. You must belong to this group to download resources.' });
    }

    const filePath = path.join(CONFIG.UPLOAD_DIR, assignment.storedFileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File was removed or not found on storage.' });
    }

    // Increment download count
    db.updateById('assignments', assignment._id, {
      downloadCount: (assignment.downloadCount || 0) + 1
    });

    res.download(filePath, assignment.fileName);
  } catch (err) {
    console.error('[Assignments] Download error:', err);
    res.status(500).json({ message: 'Download failed.' });
  }
}

export async function previewAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const assignment = db.findById('assignments', assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    // Server-side membership check
    const membership = db.findOne('memberships', {
      groupId: assignment.groupId,
      userId: req.user._id
    });

    if (!membership) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    const filePath = path.join(CONFIG.UPLOAD_DIR, assignment.storedFileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found.' });
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error('[Assignments] Preview error:', err);
    res.status(500).json({ message: 'Preview failed.' });
  }
}

export async function deleteAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const assignment = db.findById('assignments', assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    const membership = db.findOne('memberships', {
      groupId: assignment.groupId,
      userId: req.user._id
    });

    if (!membership) return res.status(403).json({ message: 'Unauthorized.' });

    const isUploader = assignment.uploadedBy === req.user._id;
    const isAdmin = membership.role === 'admin';

    if (!isUploader && !isAdmin) {
      return res.status(403).json({ message: 'Only the uploader or group admins can remove this resource.' });
    }

    // Remove file from disk
    const filePath = path.join(CONFIG.UPLOAD_DIR, assignment.storedFileName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    }

    db.deleteById('assignments', assignmentId);
    res.json({ message: 'Assignment removed successfully.' });
  } catch (err) {
    console.error('[Assignments] Delete error:', err);
    res.status(500).json({ message: 'Failed to delete assignment.' });
  }
}

export async function togglePersonalCompletion(req, res) {
  try {
    const { assignmentId } = req.params;
    const existing = db.findOne('personalCompletions', {
      assignmentId,
      userId: req.user._id
    });

    if (existing) {
      db.deleteById('personalCompletions', existing._id);
      return res.json({ isCompleted: false, message: 'Marked as pending.' });
    } else {
      db.insertOne('personalCompletions', {
        assignmentId,
        userId: req.user._id,
        completedAt: new Date().toISOString()
      });
      return res.json({ isCompleted: true, message: 'Marked as completed for your personal tracking.' });
    }
  } catch (err) {
    console.error('[Assignments] Toggle completion error:', err);
    res.status(500).json({ message: 'Failed to update completion status.' });
  }
}
