import { RefreshToken } from '../types';
export interface CreateRefreshTokenRequest {
    userId: string;
    token: string;
    expiresAt: Date;
    deviceInfo?: string;
    ipAddress?: string;
}
export declare class RefreshTokenModel {
    private pool;
    constructor();
    create(tokenData: CreateRefreshTokenRequest): Promise<RefreshToken>;
    findByToken(token: string): Promise<RefreshToken | null>;
    findByUserId(userId: string): Promise<RefreshToken[]>;
    updateLastUsed(token: string): Promise<RefreshToken>;
    deleteByToken(token: string): Promise<void>;
    deleteByUserId(userId: string): Promise<number>;
    deleteExpired(): Promise<number>;
    deleteOldTokensForUser(userId: string, keepCount?: number): Promise<number>;
    getTokenStats(userId: string): Promise<{
        activeTokens: number;
        totalTokens: number;
        lastUsed?: Date;
    }>;
    revokeAllUserTokens(userId: string): Promise<number>;
    cleanupExpiredTokens(): Promise<number>;
    private mapRowToRefreshToken;
}
declare const _default: RefreshTokenModel;
export default _default;
//# sourceMappingURL=RefreshToken.d.ts.map