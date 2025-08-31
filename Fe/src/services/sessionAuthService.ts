import axios from 'axios';
import type { User } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface SessionInfo {
  id: string;
  deviceInfo?: string;
  ipAddress?: string;
  lastAccessed: string;
  expiresAt: string;
  createdAt: string;
}

export interface SessionValidationResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    session: SessionInfo;
  };
}

export interface SessionCheckResponse {
  success: boolean;
  data: {
    hasSession: boolean;
    user: User | null;
    session: SessionInfo | null;
  };
}

class SessionAuthService {
  private sessionToken: string | null = null;
  private user: User | null = null;
  private _isAuthenticated: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize from localStorage if available
    this.sessionToken = this.getStoredSessionToken();
    
    // Initialize user from localStorage if available
    const storedUser = localStorage.getItem('sessionUser');
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
        this._isAuthenticated = true;
      } catch (error) {
        console.error('Failed to parse stored session user:', error);
        localStorage.removeItem('sessionUser');
      }
    }
  }

  /**
   * Get session token from storage
   */
  private getStoredSessionToken(): string | null {
    // Try localStorage first (for development/testing)
    const stored = localStorage.getItem('sessionToken');
    if (stored) {
      return stored;
    }

    // Try to get from cookie (httpOnly cookies are handled by browser)
    // For client-side access, we'll rely on the server setting the cookie
    return null;
  }

  /**
   * Store session token
   */
  private storeSessionToken(token: string): void {
    this.sessionToken = token;
    // Store in localStorage for development (in production, rely on httpOnly cookies)
    localStorage.setItem('sessionToken', token);
  }

  /**
   * Clear session token
   */
  private clearSessionToken(): void {
    this.sessionToken = null;
    localStorage.removeItem('sessionToken');
  }

  /**
   * Get current session token
   */
  getSessionToken(): string | null {
    return this.sessionToken;
  }

  /**
   * Validate current session
   */
  async validateSession(token?: string): Promise<SessionValidationResponse> {
    try {
      const sessionToken = token || this.sessionToken;
      
      if (!sessionToken) {
        return {
          success: false,
          message: 'No session token available'
        };
      }

      const response = await axios.post(
        `${API_BASE_URL}/auth/validate-session`,
        { sessionToken },
        {
          withCredentials: true,
          headers: {
            'X-Session-Token': sessionToken
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        success: false,
        message: 'Session validation failed'
      };
    }
  }

  /**
   * Check if user has a valid session (non-blocking)
   */
  async checkSession(): Promise<SessionCheckResponse> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/auth/check-session`,
        {
          withCredentials: true,
          headers: this.sessionToken ? {
            'X-Session-Token': this.sessionToken
          } : {}
        }
      );

      return response.data;
    } catch (error) {
      console.error('Session check error:', error);
      return {
        success: false,
        data: {
          hasSession: false,
          user: null,
          session: null
        }
      };
    }
  }

  /**
   * Get detailed session information
   */
  async getSessionInfo(): Promise<{
    success: boolean;
    data?: {
      session: SessionInfo;
      stats: {
        totalSessions: number;
        activeSessions: number;
        lastAccessed: string | null;
      };
    };
    message?: string;
  }> {
    try {
      if (!this.sessionToken) {
        return {
          success: false,
          message: 'No session token available'
        };
      }

      const response = await axios.get(
        `${API_BASE_URL}/auth/session-info`,
        {
          withCredentials: true,
          headers: {
            'X-Session-Token': this.sessionToken
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Get session info error:', error);
      return {
        success: false,
        message: 'Failed to get session information'
      };
    }
  }

  /**
   * Set session token (called after successful login)
   */
  setSessionToken(token: string): void {
    this.storeSessionToken(token);
  }

  /**
   * Initialize session from server response
   */
  initializeFromLoginResponse(response: any): void {
    if (response.sessionToken) {
      this.setSessionToken(response.sessionToken);
    }
    
    if (response.user) {
      this.user = response.user;
      this._isAuthenticated = true;
      localStorage.setItem('sessionUser', JSON.stringify(response.user));
    }
    
    // Start session monitoring
    this.startSessionMonitoring();
  }

  /**
   * Clear session data (called on logout)
   */
  clearSession(): void {
    this.clearSessionToken();
    this.user = null;
    this._isAuthenticated = false;
    localStorage.removeItem('sessionUser');
    this.stopSessionMonitoring();
  }

  /**
   * Check if user is authenticated via session
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.sessionToken) {
      return false;
    }

    const validation = await this.validateSession();
    return validation.success;
  }

  /**
   * Get current user from session
   */
  async getCurrentUser(): Promise<User | null> {
    if (!this.sessionToken) {
      return null;
    }

    const validation = await this.validateSession();
    return validation.success && validation.data ? validation.data.user : null;
  }

  /**
   * Periodically validate session (for background checks)
   */
  startSessionMonitoring(intervalMs: number = 300000): () => void { // 5 minutes default
    // Clear existing interval if any
    this.stopSessionMonitoring();
    
    this.monitoringInterval = setInterval(async () => {
      if (this.sessionToken) {
        const validation = await this.validateSession();
        if (!validation.success) {
          // Session expired or invalid, clear it
          this.clearSession();
          // Dispatch custom event to notify auth context
          window.dispatchEvent(new CustomEvent('sessionExpired'));
        }
      }
    }, intervalMs);

    // Return cleanup function
    return () => this.stopSessionMonitoring();
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

export default new SessionAuthService();