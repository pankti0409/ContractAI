import { Pool, PoolClient } from 'pg';
import pool from '../config/database';
import { UploadedFile, QueryOptions, PaginatedResponse } from '../types';
import { DatabaseError, NotFoundError } from '../utils/errors';
import fs from 'fs/promises';
import path from 'path';

export interface CreateFileRequest {
  userId: string;
  chatId?: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadStatus?: 'uploading' | 'uploaded' | 'processed' | 'failed';
}

export class FileModel {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async create(fileData: CreateFileRequest): Promise<UploadedFile> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        INSERT INTO files (user_id, chat_id, original_name, file_name, file_path, file_size, mime_type, upload_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, user_id, chat_id, original_name, file_name, file_path, file_size, mime_type, upload_status, created_at
      `;

      const values = [
        fileData.userId,
        fileData.chatId || null,
        fileData.originalName,
        fileData.fileName,
        fileData.filePath,
        fileData.fileSize,
        fileData.mimeType,
        fileData.uploadStatus || 'completed'
      ];

      const result = await client.query(query, values);
      return this.mapRowToFile(result.rows[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to create file record: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<UploadedFile | null> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        SELECT id, user_id, chat_id, original_name, file_name, file_path, 
               file_size, mime_type, upload_status, created_at
        FROM files 
        WHERE id = $1
      `;

      const result = await client.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToFile(result.rows[0]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to find file by ID: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  async findByUserId(userId: string, options: QueryOptions = {}): Promise<PaginatedResponse<UploadedFile>> {
    const client: PoolClient = await this.pool.connect();
    try {
      const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = options;
      const offset = (page - 1) * limit;

      // Count total records
      const countQuery = 'SELECT COUNT(*) FROM files WHERE user_id = $1';
      const countResult = await client.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const query = `
        SELECT id, user_id, chat_id, original_name, file_name, file_path, 
               file_size, mime_type, upload_status, created_at
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to fetch files by user ID: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  async findByChatId(chatId: string, options: QueryOptions = {}): Promise<PaginatedResponse<UploadedFile>> {
    const client: PoolClient = await this.pool.connect();
    try {
      const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = options;
      const offset = (page - 1) * limit;

      // Count total records
      const countQuery = 'SELECT COUNT(*) FROM files WHERE chat_id = $1';
      const countResult = await client.query(countQuery, [chatId]);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const query = `
        SELECT id, user_id, chat_id, original_name, file_name, file_path, 
               file_size, mime_type, upload_status, created_at
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to fetch files by chat ID: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  async findByMessageId(messageId: string): Promise<UploadedFile[]> {
    const client: PoolClient = await this.pool.connect();
    try {
      const query = `
        SELECT f.id, f.user_id, f.chat_id, f.original_name, f.file_name, 
               f.file_path, f.file_size, f.mime_type, f.upload_status, f.created_at
        FROM files f
        JOIN message_files mf ON f.id = mf.file_id
        WHERE mf.message_id = $1
        ORDER BY f.created_at ASC
      `;

      const result = await client.query(query, [messageId]);
      return result.rows.map(row => this.mapRowToFile(row));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to fetch files by message ID: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  async updateStatus(id: string, status: 'pending' | 'completed' | 'failed'): Promise<UploadedFile> {
    const client: PoolClient = await this.pool.connect();
    try {
      const existingFile = await this.findById(id);
      if (!existingFile) {
        throw new NotFoundError('File not found');
      }

      const query = `
        UPDATE files 
        SET upload_status = $1
        WHERE id = $2
        RETURNING id, user_id, chat_id, original_name, file_name, file_path, 
                  file_size, mime_type, upload_status, created_at
      `;

      const result = await client.query(query, [status, id]);
      return this.mapRowToFile(result.rows[0]);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to update file status: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  async delete(id: string, deletePhysicalFile: boolean = true): Promise<void> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const existingFile = await this.findById(id);
      if (!existingFile) {
        throw new NotFoundError('File not found');
      }

      // Delete file associations with messages
      await client.query('DELETE FROM message_files WHERE file_id = $1', [id]);

      // Delete the file record
      await client.query('DELETE FROM files WHERE id = $1', [id]);

      // Delete physical file if requested
      if (deletePhysicalFile && existingFile.filePath) {
        try {
          await fs.unlink(existingFile.filePath);
        } catch (fsError) {
          // Log the error but don't fail the database transaction
          console.error(`Failed to delete physical file: ${fsError instanceof Error ? fsError.message : 'Unknown error'}`);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof NotFoundError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to delete file: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  async deleteByUserId(userId: string, deletePhysicalFiles: boolean = true): Promise<number> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get all files for the user
      const filesQuery = 'SELECT id, file_path FROM files WHERE user_id = $1';
      const filesResult = await client.query(filesQuery, [userId]);
      const files = filesResult.rows;

      if (files.length === 0) {
        await client.query('COMMIT');
        return 0;
      }

      const fileIds = files.map(f => f.id);

      // Delete file associations with messages
      await client.query('DELETE FROM message_files WHERE file_id = ANY($1)', [fileIds]);

      // Delete the file records
      const deleteResult = await client.query('DELETE FROM files WHERE user_id = $1', [userId]);

      // Delete physical files if requested
      if (deletePhysicalFiles) {
        for (const file of files) {
          if (file.file_path) {
            try {
              await fs.unlink(file.file_path);
            } catch (fsError) {
              console.error(`Failed to delete physical file ${file.file_path}: ${fsError instanceof Error ? fsError.message : 'Unknown error'}`);
            }
          }
        }
      }

      await client.query('COMMIT');
      return deleteResult.rowCount || 0;
    } catch (error) {
      await client.query('ROLLBACK');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to delete files by user ID: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  async getFileStats(userId: string): Promise<{ totalFiles: number; totalSize: number; fileTypes: Record<string, number> }> {
    const client: PoolClient = await this.pool.connect();
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
      const fileTypes: Record<string, number> = {};

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to fetch file stats: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  async cleanupOrphanedFiles(): Promise<number> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Find files that are not associated with any messages and are older than 24 hours
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

      // Delete the orphaned file records
      const deleteResult = await client.query('DELETE FROM files WHERE id = ANY($1)', [fileIds]);

      // Delete physical files
      for (const file of orphanedFiles) {
        if (file.file_path) {
          try {
            await fs.unlink(file.file_path);
          } catch (fsError) {
            console.error(`Failed to delete orphaned file ${file.file_path}: ${fsError instanceof Error ? fsError.message : 'Unknown error'}`);
          }
        }
      }

      await client.query('COMMIT');
      return deleteResult.rowCount || 0;
    } catch (error) {
      await client.query('ROLLBACK');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError(`Failed to cleanup orphaned files: ${errorMessage}`);
    } finally {
      client.release();
    }
  }

  private mapRowToFile(row: any): UploadedFile {
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
      createdAt: new Date(row.created_at)
    };
  }
}

export default new FileModel();