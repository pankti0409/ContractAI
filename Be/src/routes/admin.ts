import { Router } from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for admin endpoints
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many admin requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many admin login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin authentication middleware
const authenticateAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: any) => {
  const { username, password } = req.body;
  
  // Simple hardcoded admin credentials
  if (username === 'admin' && password === 'admin') {
    req.user = { 
      id: 'admin',
      userId: 'admin', 
      email: 'admin@contractai.com',
      role: 'admin'
    };
    return next();
  } else {
    return res.status(401).json({
      success: false,
      message: 'Invalid admin credentials'
    });
  }
});

// Check if user is admin (for protected routes)
const requireAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || authHeader !== 'Bearer admin-token') {
    return res.status(401).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  req.user = { 
    id: 'admin',
    userId: 'admin', 
    email: 'admin@contractai.com',
    role: 'admin'
  };
  return next();
});

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', 
  adminLoginLimiter,
  authenticateAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token: 'admin-token',
        user: {
          id: 'admin',
          email: 'admin@contractai.com',
          role: 'admin'
        }
      }
    });
  })
);

/**
 * @route   GET /api/admin/stats/users
 * @desc    Get user statistics
 * @access  Admin
 */
router.get('/stats/users',
  adminLimiter,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Static data for now as requested
    const userStats = {
      totalUsers: 1250,
      activeUsers: 890,
      newUsersThisMonth: 156,
      userGrowth: [
        { month: 'Jan', users: 800 },
        { month: 'Feb', users: 850 },
        { month: 'Mar', users: 920 },
        { month: 'Apr', users: 980 },
        { month: 'May', users: 1050 },
        { month: 'Jun', users: 1120 },
        { month: 'Jul', users: 1180 },
        { month: 'Aug', users: 1250 }
      ],
      usersByRegion: [
        { region: 'North America', users: 450, percentage: 36 },
        { region: 'Europe', users: 380, percentage: 30.4 },
        { region: 'Asia', users: 280, percentage: 22.4 },
        { region: 'Others', users: 140, percentage: 11.2 }
      ],
      dailyActiveUsers: [
        { date: '2024-01-01', users: 120 },
        { date: '2024-01-02', users: 135 },
        { date: '2024-01-03', users: 142 },
        { date: '2024-01-04', users: 128 },
        { date: '2024-01-05', users: 156 },
        { date: '2024-01-06', users: 168 },
        { date: '2024-01-07', users: 175 }
      ]
    };

    res.json({
      success: true,
      data: userStats
    });
  })
);

/**
 * @route   GET /api/admin/stats/overview
 * @desc    Get general system statistics
 * @access  Admin
 */
router.get('/stats/overview',
  adminLimiter,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Static data for now as requested
    const overviewStats = {
      totalUsers: 1250,
      totalChats: 3420,
      totalFiles: 8950,
      totalMessages: 25680,
      systemHealth: {
        status: 'healthy',
        uptime: '99.9%',
        responseTime: '120ms',
        errorRate: '0.1%'
      },
      recentActivity: [
        { type: 'user_registration', count: 12, timestamp: new Date().toISOString() },
        { type: 'file_upload', count: 45, timestamp: new Date().toISOString() },
        { type: 'chat_created', count: 28, timestamp: new Date().toISOString() },
        { type: 'message_sent', count: 156, timestamp: new Date().toISOString() }
      ]
    };

    res.json({
      success: true,
      data: overviewStats
    });
  })
);

/**
 * @route   GET /api/admin/stats/files
 * @desc    Get file statistics
 * @access  Admin
 */
router.get('/stats/files',
  adminLimiter,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Static data for now as requested
    const fileStats = {
      totalFiles: 8950,
      totalSize: '2.4 GB',
      fileTypes: [
        { type: 'PDF', count: 4200, percentage: 46.9 },
        { type: 'Word', count: 2800, percentage: 31.3 },
        { type: 'Text', count: 1500, percentage: 16.8 },
        { type: 'Others', count: 450, percentage: 5.0 }
      ],
      uploadTrend: [
        { month: 'Jan', uploads: 800 },
        { month: 'Feb', uploads: 920 },
        { month: 'Mar', uploads: 1100 },
        { month: 'Apr', uploads: 1250 },
        { month: 'May', uploads: 1380 },
        { month: 'Jun', uploads: 1420 },
        { month: 'Jul', uploads: 1500 },
        { month: 'Aug', uploads: 1580 }
      ]
    };

    res.json({
      success: true,
      data: fileStats
    });
  })
);

export default router;