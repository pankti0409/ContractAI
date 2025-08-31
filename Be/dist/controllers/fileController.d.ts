import { Response } from 'express';
declare class FileController {
    uploadFile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    uploadMultipleFiles: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    getFile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    getUserFiles: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    getChatFiles: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    downloadFile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    previewFile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    getFileText: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    deleteFile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    getFileStats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    processFileForAI: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    deleteMultipleFiles: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    validateFile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    private formatFileSize;
}
declare const _default: FileController;
export default _default;
//# sourceMappingURL=fileController.d.ts.map