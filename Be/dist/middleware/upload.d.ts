import multer from 'multer';
import { Request } from 'express';
declare const upload: multer.Multer;
export declare const uploadSingle: (fieldName?: string) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadMultiple: (fieldName?: string, maxCount?: number) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadFields: (fields: {
    name: string;
    maxCount?: number;
}[]) => import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const validateUploadedFiles: (req: Request, res: any, next: any) => any;
export declare const cleanupUploadedFiles: (req: Request, res: any, next: any) => void;
export declare const deleteFile: (filePath: string) => Promise<void>;
export default upload;
//# sourceMappingURL=upload.d.ts.map