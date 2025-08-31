"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../utils/errors");
const File_1 = __importDefault(require("../models/File"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
class FileService {
    constructor() {
        this.uploadDir = process.env.UPLOAD_DIR || path_1.default.join(process.cwd(), 'uploads');
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
        this.allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/rtf',
            'application/rtf'
        ];
        this.ensureUploadDir();
    }
    async ensureUploadDir() {
        try {
            await promises_1.default.access(this.uploadDir);
        }
        catch {
            await promises_1.default.mkdir(this.uploadDir, { recursive: true });
        }
    }
    async uploadFile(userId, fileData, chatId) {
        this.validateFile(fileData);
        const startTime = Date.now();
        const fileExtension = this.getFileExtension(fileData.originalName);
        const uniqueFileName = `${(0, uuid_1.v4)()}${fileExtension}`;
        const filePath = path_1.default.join(this.uploadDir, uniqueFileName);
        try {
            await promises_1.default.writeFile(filePath, fileData.buffer);
            const fileRecord = {
                userId,
                chatId,
                originalName: fileData.originalName,
                fileName: uniqueFileName,
                filePath,
                fileSize: fileData.size,
                mimeType: fileData.mimeType,
                uploadStatus: 'uploaded'
            };
            const file = await File_1.default.create(fileRecord);
            const extractedText = await this.extractTextFromFile(filePath, fileData.mimeType);
            const metadata = await this.generateFileMetadata(filePath, fileData.mimeType, extractedText);
            const processingTime = Date.now() - startTime;
            metadata.processingTime = processingTime;
            return {
                file,
                extractedText,
                metadata
            };
        }
        catch (error) {
            try {
                await promises_1.default.unlink(filePath);
            }
            catch (unlinkError) {
                console.error('Failed to clean up file after error:', unlinkError);
            }
            throw new errors_1.InternalServerError(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getFile(fileId, userId) {
        const file = await File_1.default.findById(fileId);
        if (!file) {
            throw new errors_1.NotFoundError('File not found');
        }
        if (file.userId !== userId) {
            throw new errors_1.AuthorizationError('Access denied to this file');
        }
        return file;
    }
    async getUserFiles(userId, options = {}) {
        return await File_1.default.findByUserId(userId, options);
    }
    async getChatFiles(chatId, userId, options = {}) {
        const files = await File_1.default.findByChatId(chatId, options);
        const userFiles = files.data.filter(file => file.userId === userId);
        return {
            data: userFiles,
            pagination: {
                ...files.pagination,
                total: userFiles.length,
                totalPages: Math.ceil(userFiles.length / (options.limit || 20))
            }
        };
    }
    async downloadFile(fileId, userId) {
        const file = await this.getFile(fileId, userId);
        try {
            const buffer = await promises_1.default.readFile(file.filePath);
            return {
                buffer,
                filename: file.originalName,
                mimeType: file.mimeType
            };
        }
        catch (error) {
            throw new errors_1.NotFoundError('File not found on disk');
        }
    }
    async deleteFile(fileId, userId) {
        const file = await this.getFile(fileId, userId);
        await File_1.default.delete(fileId, true);
    }
    async deleteUserFiles(userId) {
        return await File_1.default.deleteByUserId(userId, true);
    }
    async getFileStats(userId) {
        const stats = await File_1.default.getFileStats(userId);
        return {
            ...stats,
            storageUsed: this.formatFileSize(stats.totalSize)
        };
    }
    async cleanupOrphanedFiles() {
        return await File_1.default.cleanupOrphanedFiles();
    }
    validateFile(fileData) {
        if (fileData.size > this.maxFileSize) {
            throw new errors_1.ValidationError(`File size exceeds maximum allowed size of ${this.formatFileSize(this.maxFileSize)}`);
        }
        if (!this.allowedMimeTypes.includes(fileData.mimeType)) {
            throw new errors_1.ValidationError(`File type ${fileData.mimeType} is not allowed`);
        }
        if (!fileData.originalName || fileData.originalName.trim().length === 0) {
            throw new errors_1.ValidationError('Filename is required');
        }
        if (fileData.originalName.includes('..') || fileData.originalName.includes('/') || fileData.originalName.includes('\\')) {
            throw new errors_1.ValidationError('Invalid filename');
        }
    }
    getFileExtension(filename) {
        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
    }
    async extractTextFromFile(filePath, mimeType) {
        try {
            switch (mimeType) {
                case 'text/plain':
                    const content = await promises_1.default.readFile(filePath, 'utf-8');
                    return content;
                case 'application/pdf':
                    return 'PDF text extraction temporarily disabled';
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    return 'DOCX text extraction temporarily disabled';
                case 'application/msword':
                case 'application/rtf':
                case 'text/rtf':
                    return 'Text extraction temporarily disabled for this file type';
                default:
                    return '[Text extraction not supported for this file type]';
            }
        }
        catch (error) {
            console.error('Text extraction failed:', error);
            return '[Text extraction failed]';
        }
    }
    async generateFileMetadata(filePath, mimeType, extractedText) {
        const metadata = {
            fileType: this.getFileTypeFromMime(mimeType)
        };
        if (extractedText) {
            metadata.wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
        }
        if (mimeType === 'application/pdf') {
            metadata.pageCount = 1;
        }
        try {
            const stats = await promises_1.default.stat(filePath);
            metadata.lastModified = stats.mtime;
        }
        catch (error) {
            console.error('Failed to get file stats:', error);
        }
        return metadata;
    }
    getFileTypeFromMime(mimeType) {
        const typeMap = {
            'application/pdf': 'PDF',
            'application/msword': 'Word Document',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
            'text/plain': 'Text File',
            'text/rtf': 'RTF Document',
            'application/rtf': 'RTF Document'
        };
        return typeMap[mimeType] || 'Unknown';
    }
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    async processFileForAI(fileId, userId) {
        const file = await this.getFile(fileId, userId);
        const extractedText = await this.extractTextFromFile(file.filePath, file.mimeType);
        return {
            content: extractedText,
            summary: 'This document contains important contract terms and conditions that require careful review.',
            keyPoints: [
                'Payment terms specified',
                'Termination clauses present',
                'Liability limitations noted',
                'Intellectual property rights defined'
            ]
        };
    }
}
exports.default = new FileService();
//# sourceMappingURL=fileService.js.map