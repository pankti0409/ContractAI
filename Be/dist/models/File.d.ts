import { UploadedFile, QueryOptions, PaginatedResponse } from '../types';
export interface CreateFileRequest {
    userId: string;
    chatId?: string;
    originalName: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    uploadStatus?: 'uploading' | 'uploaded' | 'processed' | 'failed';
    extractedText?: string;
}
export declare class FileModel {
    private pool;
    constructor();
    create(fileData: CreateFileRequest): Promise<UploadedFile>;
    findById(id: string): Promise<UploadedFile | null>;
    findByUserId(userId: string, options?: QueryOptions): Promise<PaginatedResponse<UploadedFile>>;
    findByChatId(chatId: string, options?: QueryOptions): Promise<PaginatedResponse<UploadedFile>>;
    findByMessageId(messageId: string): Promise<UploadedFile[]>;
    updateStatus(id: string, status: 'pending' | 'completed' | 'failed'): Promise<UploadedFile>;
    delete(id: string, deletePhysicalFile?: boolean): Promise<void>;
    deleteByUserId(userId: string, deletePhysicalFiles?: boolean): Promise<number>;
    getFileStats(userId: string): Promise<{
        totalFiles: number;
        totalSize: number;
        fileTypes: Record<string, number>;
    }>;
    cleanupOrphanedFiles(): Promise<number>;
    private mapRowToFile;
}
declare const _default: FileModel;
export default _default;
//# sourceMappingURL=File.d.ts.map