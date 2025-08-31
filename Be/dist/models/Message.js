"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = void 0;
const database_1 = __importDefault(require("../config/database"));
const errors_1 = require("../utils/errors");
class MessageModel {
    constructor() {
        this.pool = database_1.default;
    }
    async create(messageData) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const messageQuery = `
        INSERT INTO messages (chat_id, user_id, content, message_type)
        VALUES ($1, $2, $3, $4)
        RETURNING id, chat_id, user_id, content, message_type, created_at
      `;
            const messageValues = [
                messageData.chatId,
                messageData.userId,
                messageData.content,
                messageData.messageType
            ];
            const messageResult = await client.query(messageQuery, messageValues);
            const message = this.mapRowToMessage(messageResult.rows[0]);
            if (messageData.files && messageData.files.length > 0) {
                const fileLinks = messageData.files.map(fileId => `($1, '${fileId}')`);
                const fileLinkQuery = `
          INSERT INTO message_files (message_id, file_id)
          VALUES ${fileLinks.join(', ')}
        `;
                await client.query(fileLinkQuery, [message.id]);
                const filesQuery = `
          SELECT f.id, f.user_id, f.chat_id, f.original_name, f.file_name, 
                 f.file_path, f.file_size, f.mime_type, f.upload_status, f.extracted_text, f.created_at
          FROM files f
          JOIN message_files mf ON f.id = mf.file_id
          WHERE mf.message_id = $1
        `;
                const filesResult = await client.query(filesQuery, [message.id]);
                message.files = filesResult.rows.map(row => this.mapRowToFile(row));
            }
            await client.query('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [messageData.chatId]);
            await client.query('COMMIT');
            return message;
        }
        catch (error) {
            await client.query('ROLLBACK');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to create message: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findById(id) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT id, chat_id, user_id, content, message_type, created_at
        FROM messages 
        WHERE id = $1
      `;
            const result = await client.query(query, [id]);
            if (result.rows.length === 0) {
                return null;
            }
            const message = this.mapRowToMessage(result.rows[0]);
            const filesQuery = `
        SELECT f.id, f.user_id, f.chat_id, f.original_name, f.file_name, 
               f.file_path, f.file_size, f.mime_type, f.upload_status, f.extracted_text, f.created_at
        FROM files f
        JOIN message_files mf ON f.id = mf.file_id
        WHERE mf.message_id = $1
      `;
            const filesResult = await client.query(filesQuery, [id]);
            message.files = filesResult.rows.map(row => this.mapRowToFile(row));
            return message;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to find message by ID: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findByChatId(chatId, options = {}) {
        const client = await this.pool.connect();
        try {
            const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'ASC' } = options;
            const offset = (page - 1) * limit;
            const countQuery = 'SELECT COUNT(*) FROM messages WHERE chat_id = $1';
            const countResult = await client.query(countQuery, [chatId]);
            const total = parseInt(countResult.rows[0].count);
            const query = `
        SELECT id, chat_id, user_id, content, message_type, created_at
        FROM messages 
        WHERE chat_id = $1
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;
            const result = await client.query(query, [chatId, limit, offset]);
            const messages = await Promise.all(result.rows.map(async (row) => {
                const message = this.mapRowToMessage(row);
                const filesQuery = `
            SELECT f.id, f.user_id, f.chat_id, f.original_name, f.file_name, 
                   f.file_path, f.file_size, f.mime_type, f.upload_status, f.extracted_text, f.created_at
            FROM files f
            JOIN message_files mf ON f.id = mf.file_id
            WHERE mf.message_id = $1
          `;
                const filesResult = await client.query(filesQuery, [message.id]);
                message.files = filesResult.rows.map(fileRow => this.mapRowToFile(fileRow));
                return message;
            }));
            return {
                data: messages,
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
            throw new errors_1.DatabaseError(`Failed to fetch messages by chat ID: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findByUserId(userId, options = {}) {
        const client = await this.pool.connect();
        try {
            const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC' } = options;
            const offset = (page - 1) * limit;
            const countQuery = 'SELECT COUNT(*) FROM messages WHERE user_id = $1';
            const countResult = await client.query(countQuery, [userId]);
            const total = parseInt(countResult.rows[0].count);
            const query = `
        SELECT m.id, m.chat_id, m.user_id, m.content, m.message_type, m.created_at,
               c.title as chat_title
        FROM messages m
        JOIN chats c ON m.chat_id = c.id
        WHERE m.user_id = $1
        ORDER BY m.${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;
            const result = await client.query(query, [userId, limit, offset]);
            const messages = await Promise.all(result.rows.map(async (row) => {
                const message = this.mapRowToMessage(row);
                message.chatTitle = row.chat_title;
                const filesQuery = `
            SELECT f.id, f.user_id, f.chat_id, f.original_name, f.file_name, 
                   f.file_path, f.file_size, f.mime_type, f.upload_status, f.extracted_text, f.created_at
            FROM files f
            JOIN message_files mf ON f.id = mf.file_id
            WHERE mf.message_id = $1
          `;
                const filesResult = await client.query(filesQuery, [message.id]);
                message.files = filesResult.rows.map(fileRow => this.mapRowToFile(fileRow));
                return message;
            }));
            return {
                data: messages,
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
            throw new errors_1.DatabaseError(`Failed to fetch messages by user ID: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async update(id, updates) {
        const client = await this.pool.connect();
        try {
            const existingMessage = await this.findById(id);
            if (!existingMessage) {
                throw new errors_1.NotFoundError('Message not found');
            }
            const updateFields = [];
            const values = [];
            let paramCount = 1;
            if (updates.content !== undefined) {
                updateFields.push(`content = $${paramCount++}`);
                values.push(updates.content);
            }
            if (updateFields.length === 0) {
                return existingMessage;
            }
            values.push(id);
            const query = `
        UPDATE messages 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, chat_id, user_id, content, message_type, created_at
      `;
            const result = await client.query(query, values);
            const message = this.mapRowToMessage(result.rows[0]);
            const filesQuery = `
        SELECT f.id, f.user_id, f.chat_id, f.original_name, f.file_name, 
               f.file_path, f.file_size, f.mime_type, f.upload_status, f.extracted_text, f.created_at
        FROM files f
        JOIN message_files mf ON f.id = mf.file_id
        WHERE mf.message_id = $1
      `;
            const filesResult = await client.query(filesQuery, [id]);
            message.files = filesResult.rows.map(row => this.mapRowToFile(row));
            return message;
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to update message: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async delete(id) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const existingMessage = await this.findById(id);
            if (!existingMessage) {
                throw new errors_1.NotFoundError('Message not found');
            }
            await client.query('DELETE FROM message_files WHERE message_id = $1', [id]);
            await client.query('DELETE FROM messages WHERE id = $1', [id]);
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to delete message: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async getMessageStats(userId) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN message_type = 'user' THEN 1 END) as user_messages,
          COUNT(CASE WHEN message_type = 'assistant' THEN 1 END) as assistant_messages
        FROM messages 
        WHERE user_id = $1
      `;
            const result = await client.query(query, [userId]);
            return {
                totalMessages: parseInt(result.rows[0].total_messages) || 0,
                userMessages: parseInt(result.rows[0].user_messages) || 0,
                assistantMessages: parseInt(result.rows[0].assistant_messages) || 0
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to fetch message stats: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    mapRowToMessage(row) {
        return {
            id: row.id,
            chatId: row.chat_id,
            userId: row.user_id,
            content: row.content,
            messageType: row.message_type,
            createdAt: new Date(row.created_at),
            files: []
        };
    }
    mapRowToFile(row) {
        return {
            id: row.id,
            userId: row.user_id,
            chatId: row.chat_id,
            originalName: row.original_name,
            fileName: row.file_name,
            filePath: row.file_path,
            fileSize: row.file_size,
            mimeType: row.mime_type,
            uploadStatus: row.upload_status,
            extractedText: row.extracted_text,
            createdAt: new Date(row.created_at)
        };
    }
}
exports.MessageModel = MessageModel;
exports.default = new MessageModel();
//# sourceMappingURL=Message.js.map