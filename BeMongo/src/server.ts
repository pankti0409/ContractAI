import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectMongo } from './config/mongo';
import { seedAdminIfConfigured } from './config/seedAdmin';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import chatRoutes from './routes/chat';
import fileRoutes from './routes/files';
import mlRoutes from './routes/ml';

dotenv.config();

const app = express();
// Allow dev frontend origins (5173 default, 5174 fallback) and optional FRONTEND_URL
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  (process.env.FRONTEND_URL || '').trim(),
].filter(Boolean));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow same-origin/non-browser requests
    if (allowedOrigins.has(origin)) return callback(null, true);
    if (/^http:\/\/localhost:517\d$/.test(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin not allowed: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ml', mlRoutes);

const port = Number(process.env.PORT || 3000);

connectMongo(process.env.MONGODB_URI || 'mongodb://localhost:27017/contractai')
  .then(() => {
    seedAdminIfConfigured().catch((e) => console.warn('Admin seed failed:', e));
    app.listen(port, () => console.log(`🚀 API server running on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('Mongo connection error', err);
    process.exit(1);
  });