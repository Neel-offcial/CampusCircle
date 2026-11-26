import { db } from '../db/db.js';

export async function getGroupMessages(req, res) {
  try {
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit) || 150;

    const messages = db.find(
      'messages',
      { groupId },
      { sort: { createdAt: 1 }, limit }
    );

    // Enrich messages with sender info
    const enriched = messages.map(msg => {
      const sender = db.findById('users', msg.senderId);
      return {
        ...msg,
        senderName: sender ? sender.fullName : 'Former Student',
        senderUsername: sender ? sender.username : 'user',
        senderAvatar: sender ? sender.avatarUrl : null,
        reactions: msg.reactions || {},
        isMine: msg.senderId === req.user._id
      };
    });

    res.json({ messages: enriched });
  } catch (err) {
    console.error('[Chat] Get messages error:', err);
    res.status(500).json({ message: 'Failed to load messages.' });
  }
}

export async function sendMessage(req, res) {
  try {
    const { groupId } = req.params;
    const content = req.body.content || '';
    const file = req.file;

    if (!content.trim() && !file) {
      return res.status(400).json({ message: 'Message must contain text or an attached file.' });
    }

    let fileUrl = null;
    let fileName = null;
    let fileType = null;
    let fileSize = null;

    if (file) {
      fileUrl = `/uploads/${file.filename}`;
      fileName = file.originalname;
      fileType = file.mimetype.startsWith('image/') ? 'image' : 'document';
      fileSize = file.size;
    }

    const message = db.insertOne('messages', {
      groupId,
      senderId: req.user._id,
      content: content.trim(),
      fileUrl,
      fileName,
      fileType,
      fileSize,
      reactions: {},
      timestamp: new Date().toISOString()
    });

    const enriched = {
      ...message,
      senderName: req.user.fullName,
      senderUsername: req.user.username,
      senderAvatar: req.user.avatarUrl,
      isMine: true
    };

    // Broadcast over Socket.IO if io is present
    if (req.io) {
      const roomName = `group_${groupId}`;
      req.io.to(roomName).emit('new_message', {
        ...enriched,
        isMine: false // recipient will evaluate their own
      });
    }

    res.status(201).json({ message: enriched });
  } catch (err) {
    console.error('[Chat] Send message error:', err);
    res.status(500).json({ message: 'Failed to post message.' });
  }
}

/**
 * Toggle emoji reaction on a message (Anti-clutter support)
 */
export async function toggleReaction(req, res) {
  try {
    const { groupId, messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required.' });
    }

    const message = db.findById('messages', messageId);
    if (!message || message.groupId !== groupId) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    const reactions = message.reactions || {};
    const userList = reactions[emoji] || [];
    const userId = req.user._id;

    let updatedUsers;
    if (userList.includes(userId)) {
      // Remove reaction
      updatedUsers = userList.filter(id => id !== userId);
    } else {
      // Add reaction
      updatedUsers = [...userList, userId];
    }

    if (updatedUsers.length > 0) {
      reactions[emoji] = updatedUsers;
    } else {
      delete reactions[emoji];
    }

    db.updateById('messages', messageId, { reactions });

    // Broadcast reaction change via Socket.IO
    if (req.io) {
      req.io.to(`group_${groupId}`).emit('message_reaction', {
        messageId,
        reactions
      });
    }

    res.json({ messageId, reactions });
  } catch (err) {
    console.error('[Chat] Reaction error:', err);
    res.status(500).json({ message: 'Failed to toggle reaction.' });
  }
}

/**
 * Get unified files and media shared across group (Assignments + Chat attachments + Direct uploads)
 */
export async function getGroupFiles(req, res) {
  try {
    const { groupId } = req.params;

    // 1. Files from assignments
    const assignments = db.find('assignments', { groupId });
    const assignmentFiles = assignments
      .filter(a => a.fileUrl || a.storedFileName || a.fileName)
      .map(a => {
        const uploader = db.findById('users', a.uploadedBy);
        const fileUrl = a.fileUrl || `/uploads/${a.storedFileName || a.fileName}`;
        return {
          id: `assign_${a._id}`,
          title: a.title,
          fileName: a.fileName || a.title,
          fileUrl,
          fileType: (a.fileName || a.storedFileName)?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? 'image' : 'document',
          fileSize: a.fileSize || 0,
          source: 'assignment',
          subject: a.subject,
          uploadedBy: uploader ? uploader.fullName : 'Faculty/Student',
          uploaderAvatar: uploader ? uploader.avatarUrl : null,
          createdAt: a.createdAt
        };
      });

    // 2. Files from chat messages
    const chatMessages = db.find('messages', { groupId });
    const chatFiles = chatMessages
      .filter(m => m.fileUrl)
      .map(m => {
        const sender = db.findById('users', m.senderId);
        return {
          id: `chat_${m._id}`,
          title: m.fileName || 'Shared Attachment',
          fileName: m.fileName,
          fileUrl: m.fileUrl,
          fileType: m.fileType || 'document',
          fileSize: m.fileSize || 0,
          source: 'chat',
          subject: 'Group Chat Media',
          uploadedBy: sender ? sender.fullName : 'Student',
          uploaderAvatar: sender ? sender.avatarUrl : null,
          createdAt: m.createdAt || m.timestamp
        };
      });

    // 3. Direct group repository files
    const directFiles = (db.find('group_files', { groupId }) || []).map(f => {
      const uploader = db.findById('users', f.uploadedBy);
      return {
        id: `repo_${f._id}`,
        title: f.title || f.fileName,
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileType: f.fileType,
        fileSize: f.fileSize,
        source: 'library',
        subject: f.subject || 'Resource Library',
        uploadedBy: uploader ? uploader.fullName : 'Student',
        uploaderAvatar: uploader ? uploader.avatarUrl : null,
        createdAt: f.createdAt
      };
    });

    const allFiles = [...assignmentFiles, ...chatFiles, ...directFiles].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ files: allFiles });
  } catch (err) {
    console.error('[Chat] Get group files error:', err);
    res.status(500).json({ message: 'Failed to fetch group files.' });
  }
}

/**
 * Direct file upload to group library
 */
export async function uploadGroupFile(req, res) {
  try {
    const { groupId } = req.params;
    const { title, subject } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Please select a file to upload.' });
    }

    const fileType = file.mimetype.startsWith('image/') ? 'image' : 'document';
    const newFile = db.insertOne('group_files', {
      groupId,
      uploadedBy: req.user._id,
      title: title || file.originalname,
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileType,
      fileSize: file.size,
      subject: subject || 'General Academic Resource'
    });

    // Also notify group chat about newly added resource
    const chatMsg = db.insertOne('messages', {
      groupId,
      senderId: req.user._id,
      content: `📎 Added new file to Group Library: ${title || file.originalname}`,
      fileUrl: `/uploads/${file.filename}`,
      fileName: file.originalname,
      fileType,
      fileSize: file.size,
      timestamp: new Date().toISOString()
    });

    if (req.io) {
      req.io.to(`group_${groupId}`).emit('new_message', {
        ...chatMsg,
        senderName: req.user.fullName,
        senderUsername: req.user.username,
        senderAvatar: req.user.avatarUrl
      });
    }

    res.status(201).json({
      message: 'File added to group library successfully.',
      file: newFile
    });
  } catch (err) {
    console.error('[Chat] Upload group file error:', err);
    res.status(500).json({ message: 'Failed to upload group file.' });
  }
}
