import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import authService, { RegisterRequest, LoginRequest, RefreshTokenRequest } from '../services/authService';
import userSessionService from '../services/userSessionService';
import { ValidationError, AuthenticationError } from '../utils/errors';
import { asyncHandler } from '../middleware/errorHandler';
import { validationResult } from 'express-validator';

class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName }: RegisterRequest = req.body;

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName
    });

    // Create user session
    const sessionInfo = userSessionService.extractSessionInfo(req);
    const userSession = await userSessionService.createSession(result.user.id, sessionInfo);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Set session token as httpOnly cookie
    res.cookie('sessionToken', userSession.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        sessionToken: userSession.sessionToken
      }
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password }: LoginRequest = req.body;
    const deviceInfo = req.get('User-Agent') || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';

    const result = await authService.login({
      email,
      password,
      deviceInfo,
      ipAddress
    });

    // Create user session
    const sessionInfo = userSessionService.extractSessionInfo(req);
    const userSession = await userSessionService.createSession(result.user.id, sessionInfo);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Set session token as httpOnly cookie
    res.cookie('sessionToken', userSession.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        sessionToken: userSession.sessionToken
      }
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const deviceInfo = req.get('User-Agent') || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';

    try {
      const result = await authService.refreshAccessToken({
        refreshToken,
        deviceInfo,
        ipAddress
      });

      // Validate result before using it
      if (!result || !result.accessToken || !result.refreshToken) {
        console.error('Invalid result from refreshAccessToken:', result);
        return res.status(500).json({
          success: false,
          message: 'Failed to refresh token'
        });
      }

      // Set new refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      return res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      console.error('Error in refreshToken controller:', error);
      return res.status(401).json({
        success: false,
        message: 'Failed to refresh token'
      });
    }
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const sessionToken = req.cookies.sessionToken || req.body.sessionToken;
    
    // Logout from refresh token system
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch (error) {
        // Don't fail logout if token doesn't exist
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('Logout error (non-critical):', errorMessage);
      }
    }

    // Logout from user session system
    if (sessionToken) {
      try {
        await userSessionService.logoutSession(sessionToken);
      } catch (error) {
        // Don't fail logout if session doesn't exist
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log('Session logout error (non-critical):', errorMessage);
      }
    }

    // Clear cookies
    res.clearCookie('refreshToken');
    res.clearCookie('sessionToken');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  });

  logoutAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    
    // Logout from all refresh tokens
    await authService.logoutAll(userId);
    
    // Logout from all user sessions
    await userSessionService.logoutAllSessions(userId);

    // Clear cookies
    res.clearCookie('refreshToken');
    res.clearCookie('sessionToken');

    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  });

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(userId, currentPassword, newPassword);

    // Clear refresh token cookie to force re-login
    res.clearCookie('refreshToken');

    return res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });
  });

  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    try {
      const result = await authService.resetPassword(email);
      
      // In a real application, you would send this token via email
      // For development, we'll return it in the response
      return res.json({
        success: true,
        message: 'Password reset instructions sent to your email',
        ...(process.env.NODE_ENV === 'development' && { resetToken: result.resetToken })
      });
    } catch (error) {
      // Always return success to prevent email enumeration
      return res.json({
        success: true,
        message: 'If this email exists, a reset link has been sent'
      });
    }
  });

  confirmPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { resetToken, newPassword } = req.body;

    await authService.confirmPasswordReset(resetToken, newPassword);

    return res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    });
  });

  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    
    // Get user profile (this would typically come from a user service)
    // For now, we'll return the user data from the token
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  });

  getSessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    
    const sessions = await authService.getUserSessions(userId);

    res.json({
      success: true,
      data: {
        sessions
      }
    });
  });

  revokeSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { sessionId } = req.params;

    await authService.revokeSession(userId, sessionId);

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  });

  verifyToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // If we reach here, the token is valid (middleware already verified it)
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });
  });

  validateSession = asyncHandler(async (req: Request, res: Response) => {
    const sessionToken = req.cookies.sessionToken || req.body.sessionToken || req.headers['x-session-token'];
    
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided'
      });
    }

    const sessionWithUser = await userSessionService.getSessionWithUser(sessionToken);
    
    if (!sessionWithUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    res.json({
      success: true,
      message: 'Session is valid',
      data: {
        user: sessionWithUser.user,
        session: {
          id: sessionWithUser.id,
          deviceInfo: sessionWithUser.deviceInfo,
          lastAccessed: sessionWithUser.lastAccessed,
          expiresAt: sessionWithUser.expiresAt
        }
      }
    });
  });

  getSessionInfo = asyncHandler(async (req: Request, res: Response) => {
    const sessionToken = req.cookies.sessionToken || req.body.sessionToken || req.headers['x-session-token'];
    
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided'
      });
    }

    const session = await userSessionService.validateSession(sessionToken);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    const sessionStats = await userSessionService.getSessionStats(session.userId);

    res.json({
      success: true,
      message: 'Session information retrieved',
      data: {
        session: {
          id: session.id,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress,
          lastAccessed: session.lastAccessed,
          expiresAt: session.expiresAt,
          createdAt: session.createdAt
        },
        stats: sessionStats
      }
    });
  });
}

export default new AuthController();