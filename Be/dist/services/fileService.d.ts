import { UploadedFile, QueryOptions, PaginatedResponse } from '../types';
export interface FileUploadData {
    originalName: string;
    buffer: Buffer;
    mimeType: string;
    size: number;
}
export interface FileProcessingResult {
    file: UploadedFile;
    extractedText?: string;
    metadata?: {
        pageCount?: number;
        wordCount?: number;
        fileType?: string;
        processingTime?: number;
    };
}
declare class FileService {
    private readonly uploadDir;
    private readonly maxFileSize;
    private readonly allowedMimeTypes;
    constructor();
    private ensureUploadDir;
    uploadFile(userId: string, fileData: FileUploadData, chatId?: string): Promise<FileProcessingResult>;
    getFile(fileId: string, userId: string): Promise<UploadedFile>;
    getUserFiles(userId: string, options?: QueryOptions): Promise<PaginatedResponse<UploadedFile>>;
    getChatFiles(chatId: string, userId: string, options?: QueryOptions): Promise<PaginatedResponse<UploadedFile>>;
    downloadFile(fileId: string, userId: string): Promise<{
        buffer: Buffer;
        filename: string;
        mimeType: string;
    }>;
    deleteFile(fileId: string, userId: string): Promise<void>;
    deleteUserFiles(userId: string): Promise<number>;
    getFileStats(userId: string): Promise<{
        totalFiles: number;
        totalSize: number;
        fileTypes: Record<string, number>;
        storageUsed: string;
    }>;
    cleanupOrphanedFiles(): Promise<number>;
    private validateFile;
    private getFileExtension;
    private extractTextFromFile;
    private generateFileMetadata;
    private getFileTypeFromMime;
    private formatFileSize;
    processFileForAI(fileId: string, userId: string): Promise<{
        content: string;
        summary: string;
        keyPoints: string[];
    }>;
}
declare const _default: FileService;
export default _default;
//# sourceMappingURL=fileService.d.ts.map