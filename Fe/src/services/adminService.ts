import axios from 'axios';

// Admin API service - separate from main API to use different port
const adminApi = axios.create({
  baseURL: 'http://localhost:3000/api/admin',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      role: string;
    };
  };
}

export interface AdminStats {
  totalUsers: number;
  totalChats: number;
  totalFiles: number;
  totalMessages: number;
  systemHealth: {
    status: string;
    uptime: string;
    responseTime: string;
    errorRate: string;
  };
  recentActivity?: Array<{ type: string; count: number; timestamp: string }>;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowth: Array<{ month: string; users: number }>;
  usersByRegion: Array<{ region: string; users: number; percentage: number }>;
  dailyActiveUsers?: Array<{ date: string; users: number }>;
}

export interface FileStats {
  totalFiles: number;
  totalSize: string;
  fileTypes: Array<{ type: string; count: number; percentage: number }>;
  uploadTrend?: Array<{ month: string; uploads: number }>;
}

class AdminService {
  private token: string | null = null;

  constructor() {
    // Remove persistent session - no automatic token loading
  }

  private setAuthHeader(token: string) {
    adminApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private removeAuthHeader() {
    delete adminApi.defaults.headers.common['Authorization'];
  }

  async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    try {
      const response = await adminApi.post<AdminLoginResponse>('/login', credentials);
      
      if (response.data.success) {
        const token = response.data.token || response.data.data?.token;
        if (token) {
          this.token = token;
          this.setAuthHeader(token);
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific connection errors
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        return {
          success: false,
          message: 'Backend server is not available. Please ensure the server is running on port 3001.'
        };
      }
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        message: 'Network error occurred. Please check your connection and try again.'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      // Try to call logout endpoint if server is available
      await adminApi.post('/logout');
    } catch (error) {
      // Ignore logout errors - just clear local state
      console.log('Logout endpoint not available, clearing local state only');
    } finally {
      this.token = null;
      this.removeAuthHeader();
    }
  }

  async getOverviewStats(): Promise<{ success: boolean; data?: AdminStats; message?: string }> {
    try {
      const response = await adminApi.get('/stats/overview');
      return response.data;
    } catch (error: any) {
      console.error('Overview stats error:', error);
      
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        return {
          success: false,
          message: 'Backend server is not available. Please ensure the server is running on port 3001.'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch overview stats'
      };
    }
  }

  async getUserStats(): Promise<{ success: boolean; data?: UserStats; message?: string }> {
    try {
      const response = await adminApi.get('/stats/users');
      return response.data;
    } catch (error: any) {
      console.error('User stats error:', error);
      
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        return {
          success: false,
          message: 'Backend server is not available. Please ensure the server is running on port 3001.'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user stats'
      };
    }
  }

  async getFileStats(): Promise<{ success: boolean; data?: FileStats; message?: string }> {
    try {
      const response = await adminApi.get('/stats/files');
      return response.data;
    } catch (error: any) {
      console.error('File stats error:', error);
      
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        return {
          success: false,
          message: 'Backend server is not available. Please ensure the server is running on port 3001.'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch file stats'
      };
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  // Method to check if backend is available
  async checkBackendStatus(): Promise<boolean> {
    try {
      // Use axios directly to check the main health endpoint
      const response = await fetch('http://localhost:3000/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

const adminService = new AdminService();
export default adminService;