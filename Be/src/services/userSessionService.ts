import UserSessionModel, { CreateUserSessionData, UserSession } from '../models/UserSession';
import { Request } from 'express';
import { AuthenticationError, ValidationError } from '../utils/errors';

interface SessionInfo {
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

class UserSessionService {
  /**
   * Create a new user session
   */
  async createSession(userId: string, sessionInfo: SessionInfo): Promise<UserSession> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const sessionData: CreateUserSessionData = {
      userId,
      deviceInfo: sessionInfo.deviceInfo,
      ipAddress: sessionInfo.ipAddress,
      userAgent: sessionInfo.userAgent,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    return await UserSessionModel.create(sessionData);
  }

  /**
   * Validate and get session by token
   */
  async validateSession(sessionToken: string): Promise<UserSession | null> {
    if (!sessionToken) {
      return null;
    }

    const session = await UserSessionModel.findByToken(sessionToken);
    if (session) {
      // Update last accessed time
      await UserSessionModel.updateLastAccessed(sessionToken);
    }

    return session;
  }

  /**
   * Get session with user information
   */
  async getSessionWithUser(sessionToken: string): Promise<(UserSession & { user: any }) | null> {
    if (!sessionToken) {
      return null;
    }

    const sessionWithUser = await UserSessionModel.findByTokenWithUser(sessionToken);
    if (sessionWithUser) {
      // Update last accessed time
      await UserSessionModel.updateLastAccessed(sessionToken);
    }

    return sessionWithUser;
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<UserSession[]> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    return await UserSessionModel.findByUserId(userId);
  }

  /**
   * Logout from a specific session
   */
  async logoutSession(sessionToken: string): Promise<void> {
    if (!sessionToken) {
      throw new ValidationError('Session token is required');
    }

    await UserSessionModel.deactivate(sessionToken);
  }

  /**
   * Logout from all sessions for a user
   */
  async logoutAllSessions(userId: string): Promise<void> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    await UserSessionModel.deactivateAllForUser(userId);
  }

  /**
   * Extract session info from request
   */
  extractSessionInfo(req: Request): SessionInfo {
    const deviceInfo = this.getDeviceInfo(req.get('User-Agent') || '');
    const ipAddress = this.getClientIP(req);
    const userAgent = req.get('User-Agent');

    return {
      deviceInfo,
      ipAddress,
      userAgent
    };
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string {
    return (
      req.get('X-Forwarded-For') ||
      req.get('X-Real-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      ''
    ).split(',')[0].trim();
  }

  /**
   * Extract device info from user agent
   */
  private getDeviceInfo(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';

    // Simple device detection
    if (userAgent.includes('Mobile')) {
      if (userAgent.includes('iPhone')) return 'iPhone';
      if (userAgent.includes('Android')) return 'Android Phone';
      return 'Mobile Device';
    }

    if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
      return 'Tablet';
    }

    // Desktop browsers
    if (userAgent.includes('Chrome')) return 'Desktop - Chrome';
    if (userAgent.includes('Firefox')) return 'Desktop - Firefox';
    if (userAgent.includes('Safari')) return 'Desktop - Safari';
    if (userAgent.includes('Edge')) return 'Desktop - Edge';

    return 'Desktop';
  }

  /**
   * Clean up expired sessions (should be called periodically)
   */
  async cleanupExpiredSessions(): Promise<number> {
    return await UserSessionModel.cleanupExpired();
  }

  /**
   * Extend session expiration
   */
  async extendSession(sessionToken: string, additionalDays: number = 30): Promise<void> {
    const session = await UserSessionModel.findByToken(sessionToken);
    if (!session) {
      throw new AuthenticationError('Session not found');
    }

    // For now, we'll just update the last accessed time
    // In a more complex implementation, we might update the expires_at field
    await UserSessionModel.updateLastAccessed(sessionToken);
  }

  /**
   * Get session statistics for a user
   */
  async getSessionStats(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    lastAccessed: Date | null;
  }> {
    const sessions = await UserSessionModel.findByUserId(userId);
    const activeSessions = sessions.filter(s => s.isActive && s.expiresAt > new Date());
    const lastAccessed = sessions.length > 0 
      ? sessions.reduce((latest, session) => 
          session.lastAccessed > latest ? session.lastAccessed : latest, 
          sessions[0].lastAccessed
        )
      : null;

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      lastAccessed
    };
  }
}

export default new UserSessionService();