import axios from 'axios';

// Admin API service - separate from main API to use different port
const adminApi = axios.create({
  baseURL: 'http://localhost:3001/api/admin',
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
  systemHealth: number | {
    status: string;
    uptime: string;
    responseTime: string;
    errorRate: string;
  };
  serverUptime?: string;
  activeUsers: number;
  storageUsed?: string;
  recentActivity?: Array<{ type: string; count: number; timestamp: string }>;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday?: number;
  newUsersThisWeek?: number;
  newUsersThisMonth: number;
  userGrowth: Array<{ month: string; users: number }>;
  usersByRegion: Array<{ region: string; users: number; percentage: number }>;
  dailyActiveUsers?: Array<{ date: string; users: number }>;
}

export interface FileStats {
  totalFiles: number;
  totalSize: string;
  filesUploadedToday?: number;
  filesUploadedThisWeek?: number;
  filesUploadedThisMonth?: number;
  fileTypes: Array<{ type: string; count: number; percentage: number }>;
  uploadTrends?: Array<{ date: string; uploads: number }>;
  uploadTrend?: Array<{ month: string; uploads: number }>;
}

class AdminService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('adminToken');
    if (this.token) {
      this.setAuthHeader(this.token);
    }
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
        // Handle both token formats from different endpoints
        const token = response.data.token || response.data.data?.token;
        if (token) {
          this.token = token;
          localStorage.setItem('adminToken', token);
          this.setAuthHeader(token);
        }
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('adminToken');
    this.removeAuthHeader();
  }

  async getOverviewStats(): Promise<{ success: boolean; data?: AdminStats; message?: string }> {
    try {
      const response = await adminApi.get('/stats/overview');
      return response.data;
    } catch (error: any) {
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
}

const adminService = new AdminService();
export default adminService;