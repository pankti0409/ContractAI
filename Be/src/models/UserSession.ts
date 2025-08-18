import { Pool, PoolClient } from 'pg';
import { DatabaseError } from '../utils/errors';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  lastAccessed: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateUserSessionData {
  userId: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: Date;
}

class UserSessionModel {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  private mapRowToUserSession(row: any): UserSession {
    return {
      id: row.id,
      userId: row.user_id,
      sessionToken: row.session_token,
      deviceInfo: row.device_info,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      expiresAt: new Date(row.expires_at),
      lastAccessed: new Date(row.last_accessed),
      isActive: row.is_active,
      createdAt: new Date(row.created_at)
    };
  }

  /**
   * Generate a secure session token
   */
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new user session
   */
  async create(data: CreateUserSessionData): Promise<UserSession> {
    const client: PoolClient = await this.pool.connect();
    try {
      const sessionToken = this.generateSessionToken();
      const expiresAt = data.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
      
      const query = `
        INSERT INTO user_sessions (user_id, session_token, device_info, ip_address, user_agent, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        data.userId,
        sessionToken,
        data.deviceInfo,
        data.ipAddress,
        data.userAgent,
        expiresAt
      ];
      
      const result = await client.query(query, values);
      return this.mapRowToUserSession(result.rows[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to create user session: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  /**
   * Find session by token
   */
  async findByToken(sessionToken: string): Promise<UserSession | null> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM user_sessions 
        WHERE session_token = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
      `;
      
      const result = await client.query(query, [sessionToken]);
      return result.rows.length > 0 ? this.mapRowToUserSession(result.rows[0]) : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to find session by token: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  /**
   * Find all active sessions for a user
   */
  async findByUserId(userId: string): Promise<UserSession[]> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM user_sessions 
        WHERE user_id = $1 AND is_active = true AND expires_at > CURRENT_TIMESTAMP
        ORDER BY last_accessed DESC
      `;
      
      const result = await client.query(query, [userId]);
      return result.rows.map(row => this.mapRowToUserSession(row));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to find sessions by user ID: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  /**
   * Update session last accessed time
   */
  async updateLastAccessed(sessionToken: string): Promise<void> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        UPDATE user_sessions 
        SET last_accessed = CURRENT_TIMESTAMP 
        WHERE session_token = $1 AND is_active = true
      `;
      
      await client.query(query, [sessionToken]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to update session last accessed: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  /**
   * Deactivate a session (logout)
   */
  async deactivate(sessionToken: string): Promise<void> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        UPDATE user_sessions 
        SET is_active = false 
        WHERE session_token = $1
      `;
      
      await client.query(query, [sessionToken]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to deactivate session: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  /**
   * Deactivate all sessions for a user
   */
  async deactivateAllForUser(userId: string): Promise<void> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        UPDATE user_sessions 
        SET is_active = false 
        WHERE user_id = $1
      `;
      
      await client.query(query, [userId]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to deactivate all sessions for user: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpired(): Promise<number> {
    const client: PoolClient = await this.pool.connect();
    try {
      const result = await client.query('SELECT cleanup_expired_user_sessions()');
      return result.rows[0].cleanup_expired_user_sessions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to cleanup expired sessions: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get session with user information
   */
  async findByTokenWithUser(sessionToken: string): Promise<(UserSession & { user: any }) | null> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        SELECT 
          us.*,
          u.id as user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.role,
          u.company
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        WHERE us.session_token = $1 
          AND us.is_active = true 
          AND us.expires_at > CURRENT_TIMESTAMP
          AND u.is_active = true
      `;
      
      const result = await client.query(query, [sessionToken]);
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      const session = this.mapRowToUserSession(row);
      const user = {
        id: row.user_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        company: row.company
      };
      
      return { ...session, user };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to find session with user: ${errorMessage}`);
    } finally {
      client.release();
    }
  }
}

export default new UserSessionModel();