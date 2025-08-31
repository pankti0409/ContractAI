"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileModel = void 0;
const database_1 = __importDefault(require("../config/database"));
const errors_1 = require("../utils/errors");
const promises_1 = __importDefault(require("fs/promises"));
class FileModel {
    constructor() {
        this.pool = database_1.default;
    }
    async create(fileData) {
        const client = await this.pool.connect();
        try {
            const query = `
        INSERT INTO files (user_id, chat_id, original_name, file_name, file_path, file_size, mime_type, upload_status, extracted_text)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, user_id, chat_id, original_name, file_name, file_path, file_size, mime_type, upload_status, extracted_text, created_at
      `;
            const values = [
                fileData.userId,
                fileData.chatId || null,
                fileData.originalName,
                fileData.fileName,
                fileData.filePath,
                fileData.fileSize,
                fileData.mimeType,
                fileData.uploadStatus || 'uploaded',
                fileData.extractedText || null
            ];
            const result = await client.query(query, values);
            return this.mapRowToFile(result.rows[0]);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to create file record: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findById(id) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT id, user_id, chat_id, original_name, file_name, file_path, 
               file_size, mime_type, upload_status, extracted_text, created_at
        FROM files 
        WHERE id = $1
      `;
            const result = await client.query(query, [id]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToFile(result.rows[0]);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to find file by ID: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findByUserId(userId, options = {}) {
        const client = await this.pool.connect();
        try {
            const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = options;
            const offset = (page - 1) * limit;
            const countQuery = 'SELECT COUNT(*) FROM files WHERE user_id = $1';
            const countResult = await client.query(countQuery, [userId]);
            const total = parseInt(countResult.rows[0].count);
            const query = `
        SELECT id, user_id, chat_id, original_name, file_name, file_path, 
               file_size, mime_type, upload_status, extracted_text, created_at
        FROM files 
        WHERE user_id = $1
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;
            const result = await client.query(query, [userId, limit, offset]);
            const files = result.rows.map(row => this.mapRowToFile(row));
            return {
                data: files,
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
            throw new errors_1.DatabaseError(`Failed to fetch files by user ID: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findByChatId(chatId, options = {}) {
        const client = await this.pool.connect();
        try {
            const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = options;
            const offset = (page - 1) * limit;
            const countQuery = 'SELECT COUNT(*) FROM files WHERE chat_id = $1';
            const countResult = await client.query(countQuery, [chatId]);
            const total = parseInt(countResult.rows[0].count);
            const query = `
        SELECT id, user_id, chat_id, original_name, file_name, file_path, 
               file_size, mime_type, upload_status, extracted_text, created_at
        FROM files 
        WHERE chat_id = $1
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $2 OFFSET $3
      `;
            const result = await client.query(query, [chatId, limit, offset]);
            const files = result.rows.map(row => this.mapRowToFile(row));
            return {
                data: files,
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
            throw new errors_1.DatabaseError(`Failed to fetch files by chat ID: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async findByMessageId(messageId) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT f.id, f.user_id, f.chat_id, f.original_name, f.file_name, 
               f.file_path, f.file_size, f.mime_type, f.upload_status, f.extracted_text, f.created_at
        FROM files f
        JOIN message_files mf ON f.id = mf.file_id
        WHERE mf.message_id = $1
        ORDER BY f.created_at ASC
      `;
            const result = await client.query(query, [messageId]);
            return result.rows.map(row => this.mapRowToFile(row));
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to fetch files by message ID: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async updateStatus(id, status) {
        const client = await this.pool.connect();
        try {
            const existingFile = await this.findById(id);
            if (!existingFile) {
                throw new errors_1.NotFoundError('File not found');
            }
            const query = `
        UPDATE files 
        SET upload_status = $1
        WHERE id = $2
        RETURNING id, user_id, chat_id, original_name, file_name, file_path, 
                  file_size, mime_type, upload_status, extracted_text, created_at
      `;
            const result = await client.query(query, [status, id]);
            return this.mapRowToFile(result.rows[0]);
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to update file status: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async delete(id, deletePhysicalFile = true) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const existingFile = await this.findById(id);
            if (!existingFile) {
                throw new errors_1.NotFoundError('File not found');
            }
            await client.query('DELETE FROM message_files WHERE file_id = $1', [id]);
            await client.query('DELETE FROM files WHERE id = $1', [id]);
            if (deletePhysicalFile && existingFile.filePath) {
                try {
                    await promises_1.default.unlink(existingFile.filePath);
                }
                catch (fsError) {
                    console.error(`Failed to delete physical file: ${fsError instanceof Error ? fsError.message : 'Unknown error'}`);
                }
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to delete file: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async deleteByUserId(userId, deletePhysicalFiles = true) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const filesQuery = 'SELECT id, file_path FROM files WHERE user_id = $1';
            const filesResult = await client.query(filesQuery, [userId]);
            const files = filesResult.rows;
            if (files.length === 0) {
                await client.query('COMMIT');
                return 0;
            }
            const fileIds = files.map(f => f.id);
            await client.query('DELETE FROM message_files WHERE file_id = ANY($1)', [fileIds]);
            const deleteResult = await client.query('DELETE FROM files WHERE user_id = $1', [userId]);
            if (deletePhysicalFiles) {
                for (const file of files) {
                    if (file.file_path) {
                        try {
                            await promises_1.default.unlink(file.file_path);
                        }
                        catch (fsError) {
                            console.error(`Failed to delete physical file ${file.file_path}: ${fsError instanceof Error ? fsError.message : 'Unknown error'}`);
                        }
                    }
                }
            }
            await client.query('COMMIT');
            return deleteResult.rowCount || 0;
        }
        catch (error) {
            await client.query('ROLLBACK');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to delete files by user ID: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async getFileStats(userId) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT 
          COUNT(*) as total_files,
          COALESCE(SUM(file_size), 0) as total_size,
          mime_type,
          COUNT(*) as type_count
        FROM files 
        WHERE user_id = $1
        GROUP BY mime_type
      `;
            const result = await client.query(query, [userId]);
            let totalFiles = 0;
            let totalSize = 0;
            const fileTypes = {};
            result.rows.forEach(row => {
                totalFiles += parseInt(row.type_count);
                totalSize += parseInt(row.total_size);
                fileTypes[row.mime_type] = parseInt(row.type_count);
            });
            return {
                totalFiles,
                totalSize,
                fileTypes
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to fetch file stats: ${errorMessage}`);
        }
        finally {
            client.release();
        }
    }
    async cleanupOrphanedFiles() {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const orphanedQuery = `
        SELECT f.id, f.file_path
        FROM files f
        LEFT JOIN message_files mf ON f.id = mf.file_id
        WHERE mf.file_id IS NULL 
        AND f.created_at < NOW() - INTERVAL '24 hours'
        AND f.upload_status = 'completed'
      `;
            const orphanedResult = await client.query(orphanedQuery);
            const orphanedFiles = orphanedResult.rows;
            if (orphanedFiles.length === 0) {
                await client.query('COMMIT');
                return 0;
            }
            const fileIds = orphanedFiles.map(f => f.id);
            const deleteResult = await client.query('DELETE FROM files WHERE id = ANY($1)', [fileIds]);
            for (const file of orphanedFiles) {
                if (file.file_path) {
                    try {
                        await promises_1.default.unlink(file.file_path);
                    }
                    catch (fsError) {
                        console.error(`Failed to delete orphaned file ${file.file_path}: ${fsError instanceof Error ? fsError.message : 'Unknown error'}`);
                    }
                }
            }
            await client.query('COMMIT');
            return deleteResult.rowCount || 0;
        }
        catch (error) {
            await client.query('ROLLBACK');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new errors_1.DatabaseError(`Failed to cleanup orphaned files: ${errorMessage}`);
        }
        finally {
            client.release();
        }
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
exports.FileModel = FileModel;
exports.default = new FileModel();
//# sourceMappingURL=File.js.map