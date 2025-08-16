import { Request } from 'express';
export interface User {
    id: string;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    company?: string;
    role: 'user' | 'admin';
    isActive: boolean;
    emailVerified: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateUserRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    company?: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface AuthResponse {
    user: Omit<User, 'passwordHash'>;
    accessToken: string;
    refreshToken: string;
}
export interface Chat {
    id: string;
    userId: string;
    title: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateChatRequest {
    title?: string;
    description?: string;
}
export interface Message {
    id: string;
    chatId: string;
    userId: string;
    content: string;
    messageType: 'user' | 'assistant';
    createdAt: Date;
    files?: UploadedFile[];
    chatTitle?: string;
}
export interface CreateMessageRequest {
    chatId: string;
    userId: string;
    content: string;
    messageType: 'user' | 'assistant';
    files?: string[];
}
export interface UploadedFile {
    id: string;
    userId: string;
    chatId?: string;
    originalName: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadStatus: 'uploading' | 'uploaded' | 'processed' | 'failed';
    createdAt: Date;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface JWTPayload {
    id: string;
    userId: string;
    email: string;
    role: 'user' | 'admin';
    iat?: number;
    exp?: number;
}
export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}
export interface RefreshToken {
    id: string;
    userId: string;
    token: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    lastUsed?: Date;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: string;
    isRevoked: boolean;
}
export interface AuditLog {
    id: string;
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
export interface QueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    filters?: Record<string, any>;
}
export interface AppError extends Error {
    statusCode: number;
    isOperational: boolean;
}
export interface EnvConfig {
    PORT: number;
    NODE_ENV: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_SECRET: string;
    JWT_REFRESH_EXPIRES_IN: string;
    CORS_ORIGIN: string;
    MAX_FILE_SIZE: number;
    UPLOAD_PATH: string;
    BCRYPT_SALT_ROUNDS: number;
}
//# sourceMappingURL=index.d.ts.map