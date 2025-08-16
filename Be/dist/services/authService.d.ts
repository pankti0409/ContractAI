import { User } from '../types';
export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
export interface LoginRequest {
    email: string;
    password: string;
    deviceInfo?: string;
    ipAddress?: string;
}
export interface AuthResponse {
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
}
export interface RefreshTokenRequest {
    refreshToken: string;
    deviceInfo?: string;
    ipAddress?: string;
}
declare class AuthService {
    register(data: RegisterRequest): Promise<AuthResponse>;
    login(data: LoginRequest): Promise<AuthResponse>;
    refreshAccessToken(data: RefreshTokenRequest): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    resetPassword(email: string): Promise<{
        resetToken: string;
    }>;
    confirmPasswordReset(resetToken: string, newPassword: string): Promise<void>;
    getUserSessions(userId: string): Promise<Array<{
        id: string;
        deviceInfo?: string;
        ipAddress?: string;
        createdAt: Date;
        lastUsed?: Date;
    }>>;
    revokeSession(userId: string, sessionId: string): Promise<void>;
    cleanupExpiredTokens(): Promise<number>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=authService.d.ts.map