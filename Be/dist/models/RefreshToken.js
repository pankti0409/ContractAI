"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenModel = void 0;
const database_1 = __importDefault(require("../config/database"));
const errors_1 = require("../utils/errors");
class RefreshTokenModel {
    constructor() {
        this.pool = database_1.default;
    }
    async create(tokenData) {
        const client = await this.pool.connect();
        try {
            const query = `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, ip_address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, token_hash, expires_at, device_info, ip_address, created_at, last_used
      `;
            const values = [
                tokenData.userId,
                tokenData.token,
                tokenData.expiresAt,
                tokenData.deviceInfo || null,
                tokenData.ipAddress || null
            ];
            const result = await client.query(query, values);
            return this.mapRowToRefreshToken(result.rows[0]);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to create refresh token: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findByToken(token) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT id, user_id, token_hash, expires_at, device_info, ip_address, created_at, last_used
        FROM refresh_tokens 
        WHERE token_hash = $1 AND expires_at > NOW()
      `;
            const result = await client.query(query, [token]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToRefreshToken(result.rows[0]);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to find refresh token: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findByUserId(userId) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT id, user_id, token, expires_at, device_info, ip_address, created_at, last_used
        FROM refresh_tokens 
        WHERE user_id = $1 AND expires_at > NOW()
        ORDER BY created_at DESC
      `;
            const result = await client.query(query, [userId]);
            return result.rows.map(row => this.mapRowToRefreshToken(row));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to find refresh tokens by user ID: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async updateLastUsed(token) {
        const client = await this.pool.connect();
        try {
            const query = `
        UPDATE refresh_tokens 
        SET last_used = NOW()
        WHERE token_hash = $1 AND expires_at > NOW()
        RETURNING id, user_id, token_hash, expires_at, device_info, ip_address, created_at, last_used
      `;
            const result = await client.query(query, [token]);
            if (result.rows.length === 0) {
                throw new errors_1.NotFoundError('Refresh token not found or expired');
            }
            return this.mapRowToRefreshToken(result.rows[0]);
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to update refresh token last used: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async deleteByToken(token) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [token]);
            if (result.rowCount === 0) {
                throw new errors_1.NotFoundError('Refresh token not found');
            }
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to delete refresh token: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async deleteByUserId(userId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
            return result.rowCount || 0;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to delete refresh tokens by user ID: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async deleteExpired() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('DELETE FROM refresh_tokens WHERE expires_at <= NOW()');
            return result.rowCount || 0;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to delete expired refresh tokens: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async deleteOldTokensForUser(userId, keepCount = 5) {
        const client = await this.pool.connect();
        try {
            const query = `
        DELETE FROM refresh_tokens 
        WHERE user_id = $1 
        AND id NOT IN (
          SELECT id FROM refresh_tokens 
          WHERE user_id = $1 AND expires_at > NOW()
          ORDER BY created_at DESC 
          LIMIT $2
        )
      `;
            const result = await client.query(query, [userId, keepCount]);
            return result.rowCount || 0;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to delete old refresh tokens: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async getTokenStats(userId) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT 
          COUNT(*) FILTER (WHERE expires_at > NOW()) as active_tokens,
          COUNT(*) as total_tokens,
          MAX(last_used) as last_used
        FROM refresh_tokens 
        WHERE user_id = $1
      `;
            const result = await client.query(query, [userId]);
            const row = result.rows[0];
            return {
                activeTokens: parseInt(row.active_tokens) || 0,
                totalTokens: parseInt(row.total_tokens) || 0,
                lastUsed: row.last_used ? new Date(row.last_used) : undefined
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to fetch token stats: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async revokeAllUserTokens(userId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query('UPDATE refresh_tokens SET expires_at = NOW() - INTERVAL \'1 day\' WHERE user_id = $1 AND expires_at > NOW()', [userId]);
            return result.rowCount || 0;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to revoke all user tokens: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async cleanupExpiredTokens() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL \'7 days\'');
            return result.rowCount || 0;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to cleanup expired tokens: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    mapRowToRefreshToken(row) {
        return {
            id: row.id,
            userId: row.user_id,
            token: row.token_hash,
            tokenHash: row.token_hash || '',
            expiresAt: new Date(row.expires_at),
            deviceInfo: row.device_info,
            ipAddress: row.ip_address,
            createdAt: new Date(row.created_at),
            lastUsed: row.last_used ? new Date(row.last_used) : undefined,
            isRevoked: row.is_revoked || false
        };
    }
}
exports.RefreshTokenModel = RefreshTokenModel;
exports.default = new RefreshTokenModel();
//# sourceMappingURL=RefreshToken.js.map