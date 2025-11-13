import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/authService';
import sessionService from '../services/sessionService';
import sessionAuthService from '../services/sessionAuthService';
import type { User, SignupData } from '../services/authService';
import { clearAuthData as clearAuthDataUtil } from '../utils/authUtils';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => void;
  clearAuthData: () => void;
  updateProfile: (data: { firstName?: string; lastName?: string; company?: string }) => Promise<boolean>;
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
        // Check stored auth data without server validation or cross-browser syncing
        const storedUser = authService.getCurrentUser();
        const isAuth = authService.isAuthenticated();
        
        if (storedUser && isAuth) {
          console.log('✅ Token-based authentication successful');
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          console.log('❌ No valid authentication found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('accessToken');
        sessionService.clearSession();
        sessionAuthService.clearSession();
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
      
      // Session-based authentication disabled to prevent cross-browser syncing
      // if (response.sessionToken) {
      //   sessionAuthService.initializeFromLoginResponse(response);
      //   console.log('✅ Session-based authentication initialized');
      // }
      
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
      
      // Session-based authentication disabled to prevent cross-browser syncing
      // if (response.sessionToken) {
      //   sessionAuthService.initializeFromLoginResponse(response);
      //   console.log('✅ Session-based authentication initialized');
      // }
      
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
      // Session-based authentication disabled to prevent cross-browser syncing
      // sessionAuthService.clearSession();
      
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const clearAuthData = () => {
    // Use the utility function to clear localStorage (preserve chat data)
    clearAuthDataUtil(true);
    
    // Session data clearing disabled to prevent cross-browser syncing
    // sessionService.clearSession();
    // sessionAuthService.clearSession();
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string; company?: string }): Promise<boolean> => {
    try {
      const updated = await authService.updateProfile(data);
      setUser(updated);
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };

  // Listen for localStorage changes and custom auth events - DISABLED to prevent cross-browser syncing
  // React.useEffect(() => {
  //   const handleStorageChange = () => {
  //     const storedUser = localStorage.getItem('user');
  //     const storedAuth = localStorage.getItem('isAuthenticated');
  //     
  //     // Only clear auth state if both user and auth status are missing
  //     // This prevents clearing during the authentication process
  //     if (!storedUser && storedAuth !== 'true') {
  //       setUser(null);
  //       setIsAuthenticated(false);
  //     } else if (storedUser && storedAuth === 'true') {
  //       // Sync state with localStorage if they differ
  //       const parsedUser = JSON.parse(storedUser);
  //       if (!user || user.id !== parsedUser.id) {
  //         setUser(parsedUser);
  //         setIsAuthenticated(true);
  //       }
  //     }
  //   };

  //   const handleAuthStateChange = () => {
  //     // Handle custom auth state change events (e.g., from API interceptor)
  //     handleStorageChange();
  //   };

  //   // Listen for storage events from other tabs/windows
  //   window.addEventListener('storage', handleStorageChange);
  //   
  //   // Listen for custom auth state change events
  //   window.addEventListener('authStateChanged', handleAuthStateChange);
  //   
  //   return () => {
  //     window.removeEventListener('storage', handleStorageChange);
  //     window.removeEventListener('authStateChanged', handleAuthStateChange);
  //   };
  // }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    signup,
    logout,
    clearAuthData,
    updateProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};