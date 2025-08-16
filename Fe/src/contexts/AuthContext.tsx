import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/authService';
import sessionService from '../services/sessionService';
import type { User, SignupData } from '../services/authService';
import { clearAuthData as clearAuthDataUtil } from '../utils/authUtils';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => void;
  clearAuthData: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First validate server session
        const isSessionValid = await sessionService.validateSession();
        
        if (isSessionValid) {
          // Session is valid, check stored auth data
          const storedUser = authService.getCurrentUser();
          const isAuth = authService.isAuthenticated();
          
          if (storedUser && isAuth) {
            setUser(storedUser);
            setIsAuthenticated(true);
          }
        }
        // If session is invalid, auth data has already been cleared by sessionService
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('accessToken');
        sessionService.clearSession();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ email, password });
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('accessToken', response.accessToken);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      const response = await authService.register(userData);
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('accessToken', response.accessToken);
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const clearAuthData = () => {
    // Use the utility function to clear localStorage
    clearAuthDataUtil();
    
    // Clear session data
    sessionService.clearSession();
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
  };

  // Listen for localStorage changes and custom auth events
  React.useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user');
      const storedAuth = localStorage.getItem('isAuthenticated');
      
      // Only clear auth state if both user and auth status are missing
      // This prevents clearing during the authentication process
      if (!storedUser && storedAuth !== 'true') {
        setUser(null);
        setIsAuthenticated(false);
      } else if (storedUser && storedAuth === 'true') {
        // Sync state with localStorage if they differ
        const parsedUser = JSON.parse(storedUser);
        if (!user || user.id !== parsedUser.id) {
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      }
    };

    const handleAuthStateChange = () => {
      // Handle custom auth state change events (e.g., from API interceptor)
      handleStorageChange();
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom auth state change events
    window.addEventListener('authStateChanged', handleAuthStateChange);
    
    // Check less frequently to avoid interference with auth process
    const interval = setInterval(handleStorageChange, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthStateChange);
      clearInterval(interval);
    };
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    signup,
    logout,
    clearAuthData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};