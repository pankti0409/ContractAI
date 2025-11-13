import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { User } from '../models/User';
import { Chat, Message } from '../models/Chat';
import { File } from '../models/File';

const router = Router();

router.get('/overview', requireAuth, requireAdmin, async (req, res) => {
  const users = await User.countDocuments({ role: 'user' });
  const admins = await User.countDocuments({ role: 'admin' });
  const chats = await Chat.countDocuments();
  const files = await File.countDocuments();
  const messages = await Message.countDocuments();
  return res.json({ users, admins, chats, files, messages });
});

router.get('/user', requireAuth, requireAdmin, async (req, res) => {
  const total = await User.countDocuments({ role: 'user' });
  // Placeholder growth data for charts
  const userGrowth = Array.from({ length: 6 }, (_, i) => ({ month: `M${i+1}`, users: Math.max(0, total - (5-i)*2) }));
  return res.json({ totalUsers: total, userGrowth });
});

router.get('/file', requireAuth, requireAdmin, async (req, res) => {
  const totalFiles = await File.countDocuments();
  const files = await File.find({}, 'mimeType uploadedAt size').lean();
  const typeCount: Record<string, number> = {};
  let totalSize = 0;
  const trendMap: Record<string, number> = {};

  files.forEach(f => {
    const type = f.mimeType || 'unknown';
    typeCount[type] = (typeCount[type] || 0) + 1;
    totalSize += f.size || 0;
    const dt = new Date(f.uploadedAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
    trendMap[key] = (trendMap[key] || 0) + 1;
  });

  const fileTypes = Object.entries(typeCount).map(([type, count]) => ({ type, count, percentage: totalFiles ? Math.round((count/totalFiles)*100) : 0 }));
  const uploadTrend = Object.entries(trendMap).sort(([a],[b]) => a.localeCompare(b)).map(([month, uploads]) => ({ month, uploads }));

  const sizes = ['Bytes','KB','MB','GB'];
  const i = totalSize === 0 ? 0 : Math.floor(Math.log(totalSize)/Math.log(1024));
  const totalSizeStr = `${(totalSize/Math.pow(1024,i)).toFixed(2)} ${sizes[i]}`;

  return res.json({ totalFiles, totalSize: totalSizeStr, fileTypes, uploadTrend });
});

export default router;