import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token']
}));

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);

// Admin routes - inline implementation
const adminRouter = express.Router();

// Admin login endpoint
adminRouter.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple hardcoded authentication
  if (username === 'admin' && password === 'admin') {
    res.json({
      success: true,
      message: 'Admin login successful',
      token: 'admin-token-' + Date.now()
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid admin credentials'
    });
  }
});

// Admin statistics endpoints
adminRouter.get('/stats/overview', (req, res) => {
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  res.json({
    success: true,
    data: {
      totalUsers: 1247,
      totalChats: 3892,
      totalFiles: 567,
      totalMessages: 15634,
      systemHealth: {
        status: 'healthy',
        uptime: `${days}d ${hours}h ${minutes}m`,
        responseTime: '45ms',
        errorRate: '0.02%',
        cpuUsage: '12%',
        memoryUsage: '68%',
        diskUsage: '34%',
        activeConnections: 156
      },
      serverUptime: '7 days, 14 hours',
      activeUsers: 89,
      storageUsed: '2.3 GB'
    }
  });
});

adminRouter.get('/stats/users', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 1247,
      activeUsers: 89,
      newUsersToday: 12,
      newUsersThisWeek: 78,
      newUsersThisMonth: 234,
      userGrowth: [
        { month: 'Jan', users: 850 },
        { month: 'Feb', users: 920 },
        { month: 'Mar', users: 1050 },
        { month: 'Apr', users: 1180 },
        { month: 'May', users: 1247 }
      ],
      usersByRegion: [
        { region: 'North America', users: 456, percentage: 36.6 },
        { region: 'Europe', users: 389, percentage: 31.2 },
        { region: 'Asia', users: 278, percentage: 22.3 },
        { region: 'Others', users: 124, percentage: 9.9 }
      ]
    }
  });
});

adminRouter.get('/stats/files', (req, res) => {
  res.json({
    success: true,
    data: {
      totalFiles: 567,
      totalSize: '2.3 GB',
      filesUploadedToday: 23,
      filesUploadedThisWeek: 156,
      filesUploadedThisMonth: 234,
      fileTypes: [
        { type: 'PDF', count: 234, percentage: 41.3 },
        { type: 'DOCX', count: 156, percentage: 27.5 },
        { type: 'TXT', count: 89, percentage: 15.7 },
        { type: 'Others', count: 88, percentage: 15.5 }
      ],
      uploadTrends: [
        { date: '2024-01-01', uploads: 45 },
        { date: '2024-01-02', uploads: 52 },
        { date: '2024-01-03', uploads: 38 },
        { date: '2024-01-04', uploads: 67 },
        { date: '2024-01-05', uploads: 43 }
      ]
    }
  });
});

app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Admin Server running on port ${PORT}`);
  console.log(`📊 Admin panel available at: http://localhost:${PORT}/api/admin`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app;