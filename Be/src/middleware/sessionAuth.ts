import { Request, Response, NextFunction } from 'express';
import userSessionService from '../services/userSessionService';
import { AuthenticationError } from '../utils/errors';

export interface SessionAuthenticatedRequest extends Request {
  session?: any;
  sessionUser?: any;
}

/**
 * Middleware to authenticate requests using session token
 * This can be used alongside or as an alternative to JWT authentication
 */
export const requireSession = async (
  req: SessionAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get session token from cookie, body, or header
    const sessionToken = req.cookies?.sessionToken || req.body?.sessionToken || req.headers['x-session-token'];

    if (!sessionToken) {
      res.status(401).json({
        success: false,
        message: 'No session token provided'
      });
      return;
    }

    // Validate session and get user info
    const sessionWithUser = await userSessionService.getSessionWithUser(sessionToken);

    if (!sessionWithUser) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
      return;
    }

    // Attach session and user to request object
    req.session = {
      id: sessionWithUser.id,
      userId: sessionWithUser.userId,
      deviceInfo: sessionWithUser.deviceInfo,
      lastAccessed: sessionWithUser.lastAccessed,
      expiresAt: sessionWithUser.expiresAt
    };
    
    req.sessionUser = sessionWithUser.user;

    next();
    return;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Session authentication error:', errorMessage);
    res.status(401).json({
      success: false,
      message: 'Session authentication failed'
    });
    return;
  }
};

/**
 * Optional session authentication middleware
 * Attaches session data if available but doesn't require it
 */
export const optionalSession = async (
  req: SessionAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get session token from cookie, body, or header
    const sessionToken = req.cookies?.sessionToken || req.body?.sessionToken || req.headers['x-session-token'];

    if (!sessionToken) {
      next();
      return;
    }

    // Validate session and get user info
    const sessionWithUser = await userSessionService.getSessionWithUser(sessionToken);

    if (sessionWithUser) {
      // Attach session and user to request object
      req.session = {
        id: sessionWithUser.id,
        userId: sessionWithUser.userId,
        deviceInfo: sessionWithUser.deviceInfo,
        lastAccessed: sessionWithUser.lastAccessed,
        expiresAt: sessionWithUser.expiresAt
      };
      
      req.sessionUser = sessionWithUser.user;
    }

    next();
    return;
  } catch (error) {
    // Just continue if there's an error with the session
    console.warn('Optional session authentication error:', error);
    next();
    return;
  }
};

/**
 * Middleware to check if the user has a valid session
 * This is useful for routes that need to know if a user is logged in
 * but don't require authentication
 */
export const checkSession = async (
  req: SessionAuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get session token from cookie, body, or header
    const sessionToken = req.cookies?.sessionToken || req.body?.sessionToken || req.headers['x-session-token'];

    if (!sessionToken) {
      req.session = null;
      req.sessionUser = null;
      return next();
    }

    // Validate session and get user info
    const sessionWithUser = await userSessionService.getSessionWithUser(sessionToken);

    if (sessionWithUser) {
      // Attach session and user to request object
      req.session = {
        id: sessionWithUser.id,
        userId: sessionWithUser.userId,
        deviceInfo: sessionWithUser.deviceInfo,
        lastAccessed: sessionWithUser.lastAccessed,
        expiresAt: sessionWithUser.expiresAt
      };
      
      req.sessionUser = sessionWithUser.user;
    } else {
      req.session = null;
      req.sessionUser = null;
    }

    next();
  } catch (error) {
    // Just continue if there's an error with the session
    console.warn('Session check error:', error);
    req.session = null;
    req.sessionUser = null;
    next();
  }
};