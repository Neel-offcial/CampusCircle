import { db } from '../db/db.js';

export async function getGroupAnnouncements(req, res) {
  try {
    const { groupId } = req.params;
    const announcements = db.find('announcements', { groupId }, { sort: { isPinned: -1, createdAt: -1 } });

    const enriched = announcements.map(a => {
      const creator = db.findById('users', a.createdBy);
      return {
        ...a,
        creatorName: creator ? creator.fullName : 'Group Administrator',
        creatorAvatar: creator ? creator.avatarUrl : null,
        canDelete: a.createdBy === req.user._id || req.membership?.role === 'admin'
      };
    });

    res.json({ announcements: enriched });
  } catch (err) {
    console.error('[Announcements] Get announcements error:', err);
    res.status(500).json({ message: 'Failed to fetch announcements.' });
  }
}

export async function createAnnouncement(req, res) {
  try {
    const { groupId } = req.params;
    const { title, content, priority, isPinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const announcement = db.insertOne('announcements', {
      groupId,
      createdBy: req.user._id,
      title: title.trim(),
      content: content.trim(),
      priority: priority || 'Normal', // 'Normal', 'Important', 'Urgent'
      isPinned: Boolean(isPinned)
    });

    res.status(201).json({
      message: 'Announcement published successfully!',
      announcement: {
        ...announcement,
        creatorName: req.user.fullName,
        canDelete: true
      }
    });
  } catch (err) {
    console.error('[Announcements] Create announcement error:', err);
    res.status(500).json({ message: 'Failed to publish announcement.' });
  }
}

export async function deleteAnnouncement(req, res) {
  try {
    const { announcementId } = req.params;
    const announcement = db.findById('announcements', announcementId);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });

    const membership = db.findOne('memberships', {
      groupId: announcement.groupId,
      userId: req.user._id
    });

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only group administrators can remove announcements.' });
    }

    db.deleteById('announcements', announcementId);
    res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    console.error('[Announcements] Delete announcement error:', err);
    res.status(500).json({ message: 'Failed to delete announcement.' });
  }
}
