"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const database_1 = __importDefault(require("../config/database"));
const errors_1 = require("../utils/errors");
class UserModel {
    constructor() {
        this.pool = database_1.default;
    }
    async create(userData) {
        const client = await this.pool.connect();
        try {
            const existingUser = await this.findByEmail(userData.email);
            if (existingUser) {
                throw new errors_1.ConflictError('User with this email already exists');
            }
            const passwordHash = userData.password;
            const query = `
        INSERT INTO users (email, password_hash, first_name, last_name, company)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, first_name, last_name, company, role, is_active, email_verified, created_at, updated_at
      `;
            const values = [
                userData.email.toLowerCase(),
                passwordHash,
                userData.firstName,
                userData.lastName,
                userData.company || null
            ];
            const result = await client.query(query, values);
            return this.mapRowToUser(result.rows[0]);
        }
        catch (error) {
            if (error instanceof errors_1.ConflictError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to create user: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findById(id) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT id, email, password_hash, first_name, last_name, company, role, 
               is_active, email_verified, last_login, created_at, updated_at
        FROM users 
        WHERE id = $1 AND is_active = true
      `;
            const result = await client.query(query, [id]);
            return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to find user by ID: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findByEmail(email) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT id, email, password_hash, first_name, last_name, company, role, 
               is_active, email_verified, last_login, created_at, updated_at
        FROM users 
        WHERE email = $1 AND is_active = true
      `;
            const result = await client.query(query, [email.toLowerCase()]);
            return result.rows.length > 0 ? this.mapRowToUser(result.rows[0]) : null;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to find user by email: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findByEmailWithPassword(email) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT id, email, password_hash, first_name, last_name, company, role, 
               is_active, email_verified, last_login, created_at, updated_at
        FROM users 
        WHERE email = $1 AND is_active = true
      `;
            const result = await client.query(query, [email.toLowerCase()]);
            if (result.rows.length === 0) {
                return null;
            }
            const user = this.mapRowToUser(result.rows[0]);
            return {
                ...user,
                passwordHash: result.rows[0].password_hash
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to find user by email: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async update(id, updates) {
        const client = await this.pool.connect();
        try {
            const user = await this.findById(id);
            if (!user) {
                throw new errors_1.NotFoundError('User not found');
            }
            const updateFields = [];
            const values = [];
            let paramCount = 1;
            if (updates.firstName !== undefined) {
                updateFields.push(`first_name = $${paramCount++}`);
                values.push(updates.firstName);
            }
            if (updates.lastName !== undefined) {
                updateFields.push(`last_name = $${paramCount++}`);
                values.push(updates.lastName);
            }
            if (updates.company !== undefined) {
                updateFields.push(`company = $${paramCount++}`);
                values.push(updates.company);
            }
            if (updates.emailVerified !== undefined) {
                updateFields.push(`email_verified = $${paramCount++}`);
                values.push(updates.emailVerified);
            }
            if (updates.password !== undefined) {
                updateFields.push(`password_hash = $${paramCount++}`);
                values.push(updates.password);
            }
            if (updateFields.length === 0) {
                return user;
            }
            values.push(id);
            const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING id, email, first_name, last_name, company, role, is_active, email_verified, last_login, created_at, updated_at
      `;
            const result = await client.query(query, values);
            return this.mapRowToUser(result.rows[0]);
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to update user: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async updateLastLogin(id) {
        const client = await this.pool.connect();
        try {
            const query = `
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
            await client.query(query, [id]);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to update last login: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async delete(id) {
        const client = await this.pool.connect();
        try {
            const user = await this.findById(id);
            if (!user) {
                throw new errors_1.NotFoundError('User not found');
            }
            const query = `
        UPDATE users 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
            await client.query(query, [id]);
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to delete user: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findAll(options = {}) {
        const client = await this.pool.connect();
        try {
            const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = options;
            const offset = (page - 1) * limit;
            const countQuery = 'SELECT COUNT(*) FROM users WHERE is_active = true';
            const countResult = await client.query(countQuery);
            const total = parseInt(countResult.rows[0].count);
            const query = `
        SELECT id, email, first_name, last_name, company, role, is_active, 
               email_verified, last_login, created_at, updated_at
        FROM users 
        WHERE is_active = true
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $1 OFFSET $2
      `;
            const result = await client.query(query, [limit, offset]);
            const users = result.rows.map(row => this.mapRowToUser(row));
            return {
                data: users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to fetch users: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    mapRowToUser(row) {
        return {
            id: row.id,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            company: row.company,
            role: row.role,
            isActive: row.is_active,
            emailVerified: row.email_verified,
            lastLogin: row.last_login ? new Date(row.last_login) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
}
exports.UserModel = UserModel;
exports.default = new UserModel();
//# sourceMappingURL=User.js.map