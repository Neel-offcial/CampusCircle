import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: process.env.PORT || 5050,
  JWT_SECRET: process.env.JWT_SECRET || 'campuscircle-super-secret-jwt-key-2026',
  JWT_EXPIRES_IN: '7d',
  UPLOAD_DIR: path.resolve(__dirname, '../../uploads'),
  DATA_DIR: path.resolve(__dirname, '../../data'),
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25 MB
  ALLOWED_EMAIL_DOMAINS: [
    'atria.edu'
  ]
};
