"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fileService_1 = __importDefault(require("../services/fileService"));
const errorHandler_1 = require("../middleware/errorHandler");
const express_validator_1 = require("express-validator");
class FileController {
    constructor() {
        this.uploadFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { chatId } = req.body;
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }
            const fs = require('fs').promises;
            const buffer = await fs.readFile(req.file.path);
            const fileData = {
                originalName: req.file.originalname,
                buffer: buffer,
                mimeType: req.file.mimetype,
                size: req.file.size
            };
            const result = await fileService_1.default.uploadFile(userId, fileData, chatId);
            return res.status(201).json({
                success: true,
                message: 'File uploaded successfully',
                data: result
            });
        });
        this.uploadMultipleFiles = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { chatId } = req.body;
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }
            const uploadPromises = req.files.map(async (file) => {
                const fs = require('fs').promises;
                const buffer = await fs.readFile(file.path);
                const fileData = {
                    originalName: file.originalname,
                    buffer: buffer,
                    mimeType: file.mimetype,
                    size: file.size
                };
                return fileService_1.default.uploadFile(userId, fileData, chatId);
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
        this.getFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { fileId } = req.params;
            const file = await fileService_1.default.getFile(fileId, userId);
            res.json({
                success: true,
                data: {
                    file
                }
            });
        });
        this.getUserFiles = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await fileService_1.default.getUserFiles(userId, options);
            res.json({
                success: true,
                data: result
            });
        });
        this.getChatFiles = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { chatId } = req.params;
            const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await fileService_1.default.getChatFiles(chatId, userId, options);
            res.json({
                success: true,
                data: result
            });
        });
        this.downloadFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { fileId } = req.params;
            const { buffer, filename, mimeType } = await fileService_1.default.downloadFile(fileId, userId);
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            res.send(buffer);
        });
        this.previewFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { fileId } = req.params;
            const { buffer, filename, mimeType } = await fileService_1.default.downloadFile(fileId, userId);
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
        this.deleteFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { fileId } = req.params;
            await fileService_1.default.deleteFile(fileId, userId);
            res.json({
                success: true,
                message: 'File deleted successfully'
            });
        });
        this.getFileStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const stats = await fileService_1.default.getFileStats(userId);
            res.json({
                success: true,
                data: {
                    stats
                }
            });
        });
        this.processFileForAI = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { fileId } = req.params;
            const result = await fileService_1.default.processFileForAI(fileId, userId);
            res.json({
                success: true,
                message: 'File processed successfully',
                data: result
            });
        });
        this.deleteMultipleFiles = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const validationErrors = (0, express_validator_1.validationResult)(req);
            if (!validationErrors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors.array()
                });
            }
            const userId = req.user.userId;
            const { fileIds } = req.body;
            if (!Array.isArray(fileIds) || fileIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'File IDs array is required'
                });
            }
            const deletePromises = fileIds.map(async (fileId) => {
                try {
                    await fileService_1.default.deleteFile(fileId, userId);
                    return { success: true, fileId };
                }
                catch (error) {
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
        this.validateFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file provided for validation'
                });
            }
            const file = req.file;
            const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
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
                errors: [],
                warnings: [],
                fileInfo: {
                    name: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype,
                    sizeFormatted: this.formatFileSize(file.size)
                }
            };
            if (file.size > maxSize) {
                validation.isValid = false;
                validation.errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`);
            }
            if (!allowedMimeTypes.includes(file.mimetype)) {
                validation.isValid = false;
                validation.errors.push(`File type '${file.mimetype}' is not allowed`);
            }
            if (!file.originalname || file.originalname.trim().length === 0) {
                validation.isValid = false;
                validation.errors.push('Filename is required');
            }
            if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
                validation.isValid = false;
                validation.errors.push('Invalid filename characters');
            }
            if (file.size > maxSize * 0.8) {
                validation.warnings.push('File size is close to the maximum limit');
            }
            return res.json({
                success: true,
                data: validation
            });
        });
    }
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}
exports.default = new FileController();
//# sourceMappingURL=fileController.js.map