import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  message: string;
}

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data.data;
  }

  async register(data: SignupData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await api.post('/auth/refresh');
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
    }
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/request-password-reset', { email });
    return response.data;
  }

  async confirmPasswordReset(data: { token: string; newPassword: string }): Promise<{ message: string }> {
    const response = await api.post('/auth/confirm-password-reset', data);
    return response.data;
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('isAuthenticated') === 'true' && !!localStorage.getItem('accessToken');
  }
}

export default new AuthService();