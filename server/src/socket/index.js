import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/index.js';
import { db } from '../db/db.js';

export function setupSocket(io) {
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
      const user = db.findById('users', decoded.userId);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        avatarUrl: user.avatarUrl
      };
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Student connected: ${socket.user.fullName} (${socket.id})`);

    // Join a specific group chat room
    socket.on('join_group', (groupId) => {
      // Verify membership
      const membership = db.findOne('memberships', {
        groupId,
        userId: socket.user._id
      });

      if (!membership) {
        socket.emit('error', { message: 'You are not an authorized member of this group room.' });
        return;
      }

      const roomName = `group_${groupId}`;
      socket.join(roomName);
      console.log(`[Socket] ${socket.user.fullName} joined room: ${roomName}`);

      socket.to(roomName).emit('user_joined_chat', {
        userId: socket.user._id,
        fullName: socket.user.fullName
      });
    });

    // Leave a specific group chat room
    socket.on('leave_group', (groupId) => {
      const roomName = `group_${groupId}`;
      socket.leave(roomName);
      console.log(`[Socket] ${socket.user.fullName} left room: ${roomName}`);
    });

    // Send a message via websocket
    socket.on('send_message', ({ groupId, content }) => {
      if (!content || !content.trim()) return;

      // Verify membership
      const membership = db.findOne('memberships', {
        groupId,
        userId: socket.user._id
      });

      if (!membership) {
        socket.emit('error', { message: 'Cannot post: Not a member of this group.' });
        return;
      }

      const message = db.insertOne('messages', {
        groupId,
        senderId: socket.user._id,
        content: content.trim(),
        timestamp: new Date().toISOString()
      });

      const enriched = {
        ...message,
        senderName: socket.user.fullName,
        senderUsername: socket.user.username,
        senderAvatar: socket.user.avatarUrl
      };

      const roomName = `group_${groupId}`;
      io.to(roomName).emit('new_message', enriched);
    });

    // Typing indicators
    socket.on('typing', ({ groupId }) => {
      const roomName = `group_${groupId}`;
      socket.to(roomName).emit('user_typing', {
        userId: socket.user._id,
        fullName: socket.user.fullName
      });
    });

    socket.on('stop_typing', ({ groupId }) => {
      const roomName = `group_${groupId}`;
      socket.to(roomName).emit('user_stop_typing', {
        userId: socket.user._id
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Student disconnected: ${socket.user.fullName}`);
    });
  });
}
