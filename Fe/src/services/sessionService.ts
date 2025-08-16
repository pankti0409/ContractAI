import { clearAuthDataAndNotify } from '../utils/authUtils';

class SessionService {
  private static readonly SESSION_KEY = 'serverSessionId';

  /**
   * Validates the current session with the server
   * Clears auth data if server has restarted
   */
  async validateSession(): Promise<boolean> {
    try {
      const storedSessionId = localStorage.getItem(SessionService.SESSION_KEY);
      
      // Make request to validate session using fetch to avoid axios interceptors
      const url = storedSessionId 
        ? `http://localhost:3000/api/session/validate?sessionId=${storedSessionId}`
        : 'http://localhost:3000/api/session/validate';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const { sessionId, isValid } = data;

      if (!storedSessionId) {
        // First time or no stored session - store the current session ID
        localStorage.setItem(SessionService.SESSION_KEY, sessionId);
        return true;
      }

      if (!isValid) {
        // Server has restarted - clear auth data and update session ID
        console.log('Server restart detected - clearing authentication data');
        clearAuthDataAndNotify();
        localStorage.setItem(SessionService.SESSION_KEY, sessionId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      // On error, assume session is invalid and clear auth data
      clearAuthDataAndNotify();
      return false;
    }
  }

  /**
   * Clears the stored session ID
   */
  clearSession(): void {
    localStorage.removeItem(SessionService.SESSION_KEY);
  }

  /**
   * Gets the stored session ID
   */
  getStoredSessionId(): string | null {
    return localStorage.getItem(SessionService.SESSION_KEY);
  }
}

export default new SessionService();