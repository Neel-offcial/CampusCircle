import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config/index.js';

if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
  fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CONFIG.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${Date.now()}-${uuidv4().substring(0, 8)}-${cleanName}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow PDFs, Word docs, PPTs, Images, ZIPs, TXT, Code files
  const allowedExts = [
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
    '.zip', '.rar', '.7z', '.tar', '.gz',
    '.txt', '.md', '.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.c', '.cpp', '.java'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} is not supported. Please upload academic documents, archives, or code files.`), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: CONFIG.MAX_FILE_SIZE },
  fileFilter
});
