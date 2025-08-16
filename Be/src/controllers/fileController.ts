import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import fileService from '../services/fileService';
import { asyncHandler } from '../middleware/errorHandler';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

class FileController {
  uploadFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { chatId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Read file buffer from disk since we're using diskStorage
    const fs = require('fs').promises;
    const buffer = await fs.readFile(req.file.path);

    const fileData = {
      originalName: req.file.originalname,
      buffer: buffer,
      mimeType: req.file.mimetype,
      size: req.file.size
    };

    const result = await fileService.uploadFile(userId, fileData, chatId);

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: result
    });
  });

  uploadMultipleFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { chatId } = req.body;
    
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadPromises = req.files.map(async file => {
      // Read file buffer from disk since we're using diskStorage
      const fs = require('fs').promises;
      const buffer = await fs.readFile(file.path);
      
      const fileData = {
        originalName: file.originalname,
        buffer: buffer,
        mimeType: file.mimetype,
        size: file.size
      };
      return fileService.uploadFile(userId, fileData, chatId);
    });

    const results = await Promise.all(uploadPromises);

    return res.status(201).json({
      success: true,
      message: `${results.length} files uploaded successfully`,
      data: {
        files: results
      }
    });
  });

  getFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { fileId } = req.params;

    const file = await fileService.getFile(fileId, userId);

    res.json({
      success: true,
      data: {
        file
      }
    });
  });

  getUserFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'ASC' | 'DESC'
    };

    const result = await fileService.getUserFiles(userId, options);

    res.json({
      success: true,
      data: result
    });
  });

  getChatFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { chatId } = req.params;
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'ASC' | 'DESC'
    };

    const result = await fileService.getChatFiles(chatId, userId, options);

    res.json({
      success: true,
      data: result
    });
  });

  downloadFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { fileId } = req.params;

    const { buffer, filename, mimeType } = await fileService.downloadFile(fileId, userId);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  });

  previewFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { fileId } = req.params;

    const { buffer, filename, mimeType } = await fileService.downloadFile(fileId, userId);

    // Only allow preview for certain file types
    const previewableMimeTypes = [
      'text/plain',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (!previewableMimeTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        message: 'File type not supported for preview'
      });
    }

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    return res.send(buffer);
  });

  deleteFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { fileId } = req.params;

    await fileService.deleteFile(fileId, userId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  });

  getFileStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;

    const stats = await fileService.getFileStats(userId);

    res.json({
      success: true,
      data: {
        stats
      }
    });
  });

  processFileForAI = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const { fileId } = req.params;

    const result = await fileService.processFileForAI(fileId, userId);

    res.json({
      success: true,
      message: 'File processed successfully',
      data: result
    });
  });

  // Batch operations
  deleteMultipleFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check validation errors
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors.array()
      });
    }

    const userId = req.user!.userId;
    const { fileIds } = req.body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File IDs array is required'
      });
    }

    const deletePromises = fileIds.map(async (fileId: string) => {
      try {
        await fileService.deleteFile(fileId, userId);
        return { success: true, fileId };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error', fileId };
      }
    });

    const results = await Promise.all(deletePromises);
    const failedResults = results.filter(result => !result.success);
    const successCount = results.length - failedResults.length;

    return res.json({
      success: failedResults.length === 0,
      message: `${successCount} files deleted successfully${failedResults.length > 0 ? `, ${failedResults.length} failed` : ''}`,
      data: {
        successCount,
        errorCount: failedResults.length,
        errors: failedResults.length > 0 ? failedResults : undefined
      }
    });
  });

  // File validation endpoint
  validateFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided for validation'
      });
    }

    const file = req.file;
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/rtf',
      'application/rtf'
    ];

    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      fileInfo: {
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        sizeFormatted: this.formatFileSize(file.size)
      }
    };

    // Check file size
    if (file.size > maxSize) {
      validation.isValid = false;
      validation.errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`);
    }

    // Check mime type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      validation.isValid = false;
      validation.errors.push(`File type '${file.mimetype}' is not allowed`);
    }

    // Check filename
    if (!file.originalname || file.originalname.trim().length === 0) {
      validation.isValid = false;
      validation.errors.push('Filename is required');
    }

    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      validation.isValid = false;
      validation.errors.push('Invalid filename characters');
    }

    // Warnings
    if (file.size > maxSize * 0.8) {
      validation.warnings.push('File size is close to the maximum limit');
    }

    return res.json({
      success: true,
      data: validation
    });
  });

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default new FileController();