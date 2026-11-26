import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

export async function getGroups(req, res) {
  try {
    const myOnly = req.query.my === 'true';
    const search = req.query.search;
    const category = req.query.category;

    // Get user's memberships
    const userMemberships = db.find('memberships', { userId: req.user._id });
    const joinedGroupIds = new Set(userMemberships.map(m => m.groupId));

    let groups = db.find('groups');

    if (myOnly) {
      groups = groups.filter(g => joinedGroupIds.has(g._id));
    }

    if (category && category !== 'All') {
      groups = groups.filter(g => g.category?.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      groups = groups.filter(g =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
      );
    }

    // Attach membership status and member counts
    const enriched = groups.map(g => {
      const membership = userMemberships.find(m => m.groupId === g._id);
      const memberCount = db.countDocuments('memberships', { groupId: g._id });
      const assignmentCount = db.countDocuments('assignments', { groupId: g._id });
      return {
        ...g,
        isMember: Boolean(membership),
        myRole: membership ? membership.role : null,
        memberCount,
        assignmentCount
      };
    });

    res.json({ groups: enriched });
  } catch (err) {
    console.error('[Groups] Get groups error:', err);
    res.status(500).json({ message: 'Failed to fetch groups.' });
  }
}

export async function createGroup(req, res) {
  try {
    const { name, description, category, isPrivate, accessCode, iconBg } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ message: 'Group name must be at least 3 characters long.' });
    }

    const generatedCode = isPrivate
      ? (accessCode ? accessCode.trim().toUpperCase() : uuidv4().substring(0, 6).toUpperCase())
      : null;

    const group = db.insertOne('groups', {
      name: name.trim(),
      description: description ? description.trim() : '',
      category: category || 'Academic',
      isPrivate: Boolean(isPrivate),
      accessCode: generatedCode,
      creatorId: req.user._id,
      iconBg: iconBg || 'from-indigo-500 to-purple-600'
    });

    // Creator automatically becomes Admin
    db.insertOne('memberships', {
      groupId: group._id,
      userId: req.user._id,
      role: 'admin',
      joinedAt: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Group created successfully!',
      group: {
        ...group,
        isMember: true,
        myRole: 'admin',
        memberCount: 1,
        assignmentCount: 0
      }
    });
  } catch (err) {
    console.error('[Groups] Create group error:', err);
    res.status(500).json({ message: 'Failed to create group.' });
  }
}

export async function getGroupById(req, res) {
  try {
    const { groupId } = req.params;
    const group = db.findById('groups', groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const membership = db.findOne('memberships', {
      groupId,
      userId: req.user._id
    });

    // Check private group access
    if (group.isPrivate && !membership) {
      return res.status(403).json({
        message: 'This group is private. You must enter the access code to join and view content.',
        isPrivate: true
      });
    }

    // Get members
    const memberships = db.find('memberships', { groupId });
    const members = memberships.map(m => {
      const u = db.findById('users', m.userId);
      return {
        _id: m._id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        fullName: u ? u.fullName : 'Unknown User',
        username: u ? u.username : 'unknown',
        avatarUrl: u ? u.avatarUrl : null,
        department: u ? u.department : '',
        semester: u ? u.semester : ''
      };
    });

    const memberCount = memberships.length;
    const assignmentCount = db.countDocuments('assignments', { groupId });
    const announcementCount = db.countDocuments('announcements', { groupId });

    res.json({
      group: {
        ...group,
        isMember: Boolean(membership),
        myRole: membership ? membership.role : null,
        memberCount,
        assignmentCount,
        announcementCount,
        members
      }
    });
  } catch (err) {
    console.error('[Groups] Get group error:', err);
    res.status(500).json({ message: 'Failed to fetch group details.' });
  }
}

export async function joinGroup(req, res) {
  try {
    const { groupId } = req.params;
    const { accessCode } = req.body;

    const group = db.findById('groups', groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const existing = db.findOne('memberships', {
      groupId,
      userId: req.user._id
    });

    if (existing) {
      return res.status(400).json({ message: 'You are already a member of this group.' });
    }

    if (group.isPrivate) {
      if (!accessCode || accessCode.trim().toUpperCase() !== (group.accessCode || '').toUpperCase()) {
        return res.status(403).json({ message: 'Invalid group access code.' });
      }
    }

    const membership = db.insertOne('memberships', {
      groupId,
      userId: req.user._id,
      role: 'member',
      joinedAt: new Date().toISOString()
    });

    res.json({
      message: `Welcome to ${group.name}!`,
      membership
    });
  } catch (err) {
    console.error('[Groups] Join group error:', err);
    res.status(500).json({ message: 'Failed to join group.' });
  }
}

export async function leaveGroup(req, res) {
  try {
    const { groupId } = req.params;
    const membership = db.findOne('memberships', {
      groupId,
      userId: req.user._id
    });

    if (!membership) {
      return res.status(400).json({ message: 'You are not a member of this group.' });
    }

    db.deleteById('memberships', membership._id);

    // If no admins left, promote another member if available
    const remainingAdmins = db.find('memberships', { groupId, role: 'admin' });
    if (remainingAdmins.length === 0) {
      const nextMember = db.findOne('memberships', { groupId });
      if (nextMember) {
        db.updateById('memberships', nextMember._id, { role: 'admin' });
      }
    }

    res.json({ message: 'You have left the group.' });
  } catch (err) {
    console.error('[Groups] Leave group error:', err);
    res.status(500).json({ message: 'Failed to leave group.' });
  }
}

export async function manageMember(req, res) {
  try {
    const { groupId, memberId } = req.params;
    const { action } = req.body; // 'promote', 'demote', 'remove'

    const target = db.findById('memberships', memberId);
    if (!target || target.groupId !== groupId) {
      return res.status(404).json({ message: 'Member not found in this group.' });
    }

    if (target.userId === req.user._id) {
      return res.status(400).json({ message: 'Cannot modify your own administrative privileges here.' });
    }

    if (action === 'remove') {
      db.deleteById('memberships', target._id);
      return res.json({ message: 'Member removed from group.' });
    } else if (action === 'promote') {
      db.updateById('memberships', target._id, { role: 'admin' });
      return res.json({ message: 'Member promoted to Group Administrator.' });
    } else if (action === 'demote') {
      db.updateById('memberships', target._id, { role: 'member' });
      return res.json({ message: 'Administrator status revoked.' });
    }

    res.status(400).json({ message: 'Invalid action.' });
  } catch (err) {
    console.error('[Groups] Manage member error:', err);
    res.status(500).json({ message: 'Failed to update member role.' });
  }
}
