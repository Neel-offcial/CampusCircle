import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { CONFIG } from './config/index.js';
import { setupSocket } from './socket/index.js';
import { seedDatabase } from './seed.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import confessionRoutes from './routes/confessionRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import gpaRoutes from './routes/gpaRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Setup sockets
setupSocket(io);

// Make io accessible in request context if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload and data directories exist
if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
  fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(CONFIG.DATA_DIR)) {
  fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
}

// Static upload previews
app.use('/uploads', express.static(CONFIG.UPLOAD_DIR));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/confessions', confessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/gpa', gpaRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'CampusCircle API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error Handler]:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Seed sample data if database is fresh
seedDatabase();

// Start Server
server.listen(CONFIG.PORT, () => {
  console.log(`======================================================`);
  console.log(`🚀 CampusCircle Server running on http://localhost:${CONFIG.PORT}`);
  console.log(`📡 Socket.IO real-time engine activated`);
  console.log(`📁 Upload storage initialized at ${CONFIG.UPLOAD_DIR}`);
  console.log(`======================================================`);
});
