"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModel = void 0;
const database_1 = __importDefault(require("../config/database"));
const errors_1 = require("../utils/errors");
class ChatModel {
    constructor() {
        this.pool = database_1.default;
    }
    async create(userId, chatData) {
        const client = await this.pool.connect();
        try {
            const query = `
        INSERT INTO chats (user_id, title, description)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, title, description, created_at, updated_at
      `;
            const values = [
                userId,
                chatData.title || 'New Chat',
                chatData.description
            ];
            const result = await client.query(query, values);
            return this.mapRowToChat(result.rows[0]);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to create chat: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findById(id, userId) {
        const client = await this.pool.connect();
        try {
            let query = `
        SELECT id, user_id, title, description, created_at, updated_at
        FROM chats 
        WHERE id = $1
      `;
            const values = [id];
            if (userId) {
                query += ' AND user_id = $2';
                values.push(userId);
            }
            const result = await client.query(query, values);
            return result.rows.length > 0 ? this.mapRowToChat(result.rows[0]) : null;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to find chat by ID: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findByUserId(userId, options = {}) {
        const client = await this.pool.connect();
        try {
            const { page = 1, limit = 20, sortBy = 'updated_at', sortOrder = 'DESC' } = options;
            const offset = (page - 1) * limit;
            const countQuery = 'SELECT COUNT(*) FROM chats WHERE user_id = $1';
            const countResult = await client.query(countQuery, [userId]);
            const total = parseInt(countResult.rows[0].count);
            const query = `
        SELECT id, user_id, title, description, created_at, updated_at
        FROM chats 
        WHERE user_id = $1
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;
            const result = await client.query(query, [userId, limit, offset]);
            const chats = result.rows.map(row => this.mapRowToChat(row));
            return {
                data: chats,
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
            throw new errors_1.DatabaseError(`Failed to fetch user chats: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async update(id, userId, updates) {
        const client = await this.pool.connect();
        try {
            const existingChat = await this.findById(id, userId);
            if (!existingChat) {
                throw new errors_1.NotFoundError('Chat not found or access denied');
            }
            const updateFields = [];
            const values = [];
            let paramCount = 1;
            if (updates.title !== undefined) {
                updateFields.push(`title = $${paramCount++}`);
                values.push(updates.title);
            }
            if (updates.description !== undefined) {
                updateFields.push(`description = $${paramCount++}`);
                values.push(updates.description);
            }
            if (updateFields.length === 0) {
                return existingChat;
            }
            values.push(id, userId);
            const query = `
        UPDATE chats 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount++} AND user_id = $${paramCount}
        RETURNING id, user_id, title, description, created_at, updated_at
      `;
            const result = await client.query(query, values);
            return this.mapRowToChat(result.rows[0]);
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to update chat: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async updateLastActivity(id) {
        const client = await this.pool.connect();
        try {
            const query = `
        UPDATE chats 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
            await client.query(query, [id]);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to update chat activity: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async delete(id, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const existingChat = await this.findById(id, userId);
            if (!existingChat) {
                throw new errors_1.NotFoundError('Chat not found or access denied');
            }
            await client.query(`
        DELETE FROM message_files 
        WHERE message_id IN (
          SELECT id FROM messages WHERE chat_id = $1
        )
      `, [id]);
            await client.query('DELETE FROM messages WHERE chat_id = $1', [id]);
            await client.query('DELETE FROM files WHERE chat_id = $1', [id]);
            await client.query('DELETE FROM chats WHERE id = $1 AND user_id = $2', [id, userId]);
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to delete chat: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findAll(options = {}) {
        const client = await this.pool.connect();
        try {
            const { page = 1, limit = 20, sortBy = 'updated_at', sortOrder = 'DESC' } = options;
            const offset = (page - 1) * limit;
            const countQuery = 'SELECT COUNT(*) FROM chats';
            const countResult = await client.query(countQuery);
            const total = parseInt(countResult.rows[0].count);
            const query = `
        SELECT c.id, c.user_id, c.title, c.description, c.created_at, c.updated_at,
               u.email as user_email, u.first_name, u.last_name
        FROM chats c
        JOIN users u ON c.user_id = u.id
        ORDER BY c.${sortBy} ${sortOrder}
        LIMIT $1 OFFSET $2
      `;
            const result = await client.query(query, [limit, offset]);
            const chats = result.rows.map(row => ({
                ...this.mapRowToChat(row),
                userEmail: row.user_email,
                userName: `${row.first_name} ${row.last_name}`
            }));
            return {
                data: chats,
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
            throw new errors_1.DatabaseError(`Failed to fetch all chats: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async getRecentChats(userId, limit = 5) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT id, user_id, title, description, created_at, updated_at
        FROM chats 
        WHERE user_id = $1
        ORDER BY updated_at DESC
        LIMIT $2
      `;
            const result = await client.query(query, [userId, limit]);
            return result.rows.map(row => this.mapRowToChat(row));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to fetch recent chats: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async getChatStats(userId) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT 
          COUNT(DISTINCT c.id) as total_chats,
          COUNT(m.id) as total_messages
        FROM chats c
        LEFT JOIN messages m ON c.id = m.chat_id
        WHERE c.user_id = $1
      `;
            const result = await client.query(query, [userId]);
            return {
                totalChats: parseInt(result.rows[0].total_chats) || 0,
                totalMessages: parseInt(result.rows[0].total_messages) || 0
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to fetch chat stats: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    mapRowToChat(row) {
        return {
            id: row.id,
            userId: row.user_id,
            title: row.title,
            description: row.description,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
}
exports.ChatModel = ChatModel;
exports.default = new ChatModel();
//# sourceMappingURL=Chat.js.map