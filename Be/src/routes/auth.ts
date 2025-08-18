import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticateToken, requireAuth, optionalAuth } from '../middleware/auth';
import { requireSession, optionalSession, checkSession } from '../middleware/sessionAuth';
import { handleValidationErrors } from '../middleware/errorHandler';
import { 
  validateUserRegistration, 
  validateUserLogin, 
  validatePasswordChange,
  validatePasswordReset,
  validatePasswordResetConfirm
} from '../utils/validation';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (increased for development)
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  authLimiter,
  validateUserRegistration,
  handleValidationErrors,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', 
  authLimiter,
  validateUserLogin,
  handleValidationErrors,
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', 
  authLimiter,
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', 
  strictAuthLimiter,
  validatePasswordReset,
  handleValidationErrors,
  authController.requestPasswordReset
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Confirm password reset
 * @access  Public
 */
router.post('/reset-password', 
  strictAuthLimiter,
  validatePasswordResetConfirm,
  handleValidationErrors,
  authController.confirmPasswordReset
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity
 * @access  Public (but requires token)
 */
router.get('/verify', 
  optionalAuth,
  authController.verifyToken
);

// Protected routes
/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', 
  authenticateToken,
  requireAuth,
  authController.getProfile
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', 
  authenticateToken,
  requireAuth,
  strictAuthLimiter,
  validatePasswordChange,
  handleValidationErrors,
  authController.changePassword
);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', 
  authenticateToken,
  requireAuth,
  authController.logoutAll
);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get user sessions
 * @access  Private
 */
router.get('/sessions', 
  authenticateToken,
  requireAuth,
  authController.getSessions
);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', 
  authenticateToken,
  requireAuth,
  authController.revokeSession
);

// Session-based authentication routes
/**
 * @route   POST /api/auth/validate-session
 * @desc    Validate user session token
 * @access  Public
 */
router.post('/validate-session', 
  authLimiter,
  authController.validateSession
);

/**
 * @route   GET /api/auth/session-info
 * @desc    Get current session information
 * @access  Private (Session)
 */
router.get('/session-info', 
  requireSession,
  authController.getSessionInfo
);

/**
 * @route   GET /api/auth/check-session
 * @desc    Check if user has a valid session (non-blocking)
 * @access  Public
 */
router.get('/check-session', 
  checkSession,
  (req: any, res) => {
    res.json({
      success: true,
      data: {
        hasSession: !!req.session,
        user: req.sessionUser || null,
        session: req.session || null
      }
    });
  }
);

export default router;