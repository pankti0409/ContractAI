import api from './api';

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
  private token: string | null = localStorage.getItem('accessToken');

  async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    try {
      const response = await api.post('/auth/admin/login', {
        email: credentials.username,
        password: credentials.password,
      });
      const { accessToken, admin } = response.data;
      if (accessToken) {
        this.token = accessToken;
        localStorage.setItem('accessToken', accessToken);
      }
      return {
        success: true,
        message: 'Logged in',
        token: accessToken,
        data: {
          token: accessToken,
          user: { id: admin.id, email: admin.email, role: 'admin' }
        }
      };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific connection errors
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        return {
          success: false,
          message: 'Backend server is not available. Please ensure the server is running on port 3000.'
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
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors - just clear local state
      console.log('Logout endpoint not available, clearing local state only');
    } finally {
      this.token = null;
      localStorage.removeItem('accessToken');
    }
  }

  async getOverviewStats(): Promise<{ success: boolean; data?: AdminStats; message?: string }> {
    try {
      const response = await api.get('/admin/overview');
      return { success: true, data: {
        totalUsers: response.data.users ?? 0,
        totalChats: response.data.chats ?? 0,
        totalFiles: response.data.files ?? 0,
        totalMessages: response.data.messages ?? 0,
        systemHealth: { status: 'ok', uptime: 'n/a', responseTime: 'n/a', errorRate: 'n/a' },
      }};
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
      const response = await api.get('/admin/user');
      return { success: true, data: {
        totalUsers: response.data.totalUsers ?? 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        userGrowth: response.data.userGrowth ?? [],
        usersByRegion: [],
      }};
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
      const response = await api.get('/admin/file');
      return { success: true, data: {
        totalFiles: response.data.totalFiles ?? 0,
        totalSize: response.data.totalSize ?? '0',
        fileTypes: response.data.fileTypes ?? [],
        uploadTrend: response.data.uploadTrend ?? [],
      }};
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
      const response = await fetch('http://localhost:3000/api/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

const adminService = new AdminService();
export default adminService;