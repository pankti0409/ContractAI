import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from '../utils/errors';
import { isValidFileType, isValidFileSize } from '../utils/validation';

// Ensure upload directory exists
const uploadPath = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    // Create user-specific directory
    const userId = req.user?.userId || 'anonymous';
    const userUploadPath = path.join(uploadPath, userId);
    
    if (!fs.existsSync(userUploadPath)) {
      fs.mkdirSync(userUploadPath, { recursive: true });
    }
    
    cb(null, userUploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename while preserving extension
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    cb(null, uniqueFilename);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (!isValidFileType(file.mimetype)) {
    cb(new ValidationError(`File type ${file.mimetype} is not allowed`));
    return;
  }
  
  // Check file name length
  if (file.originalname.length > 255) {
    cb(new ValidationError('File name is too long'));
    return;
  }
  
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 10, // Maximum 10 files per request
    fieldSize: 1024 * 1024, // 1MB field size limit
  }
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string = 'file') => {
  return upload.single(fieldName);
};

// Middleware for multiple file upload
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 10) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for mixed file upload (multiple fields)
export const uploadFields = (fields: { name: string; maxCount?: number }[]) => {
  return upload.fields(fields);
};

// Custom file validation middleware
export const validateUploadedFiles = (req: Request, res: any, next: any) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const file = req.file as Express.Multer.File | undefined;
  
  const allFiles = files || (file ? [file] : []);
  
  if (allFiles.length === 0) {
    return next();
  }
  
  // Additional validation for uploaded files
  for (const uploadedFile of allFiles) {
    // Double-check file size (multer should handle this, but extra safety)
    if (!isValidFileSize(uploadedFile.size)) {
      return next(new ValidationError(`File ${uploadedFile.originalname} is too large`));
    }
    
    // Check if file actually exists on disk
    if (!fs.existsSync(uploadedFile.path)) {
      return next(new ValidationError(`File ${uploadedFile.originalname} was not saved properly`));
    }
  }
  
  next();
};

// Cleanup middleware for failed requests
export const cleanupUploadedFiles = (req: Request, res: any, next: any) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  const cleanup = () => {
    if (res.statusCode >= 400) {
      const files = req.files as Express.Multer.File[] | undefined;
      const file = req.file as Express.Multer.File | undefined;
      
      const allFiles = files || (file ? [file] : []);
      
      allFiles.forEach(uploadedFile => {
        if (fs.existsSync(uploadedFile.path)) {
          fs.unlinkSync(uploadedFile.path);
        }
      });
    }
  };
  
  res.send = function(body: any) {
    cleanup();
    return originalSend.call(this, body);
  };
  
  res.json = function(body: any) {
    cleanup();
    return originalJson.call(this, body);
  };
  
  next();
};

// Utility function to delete file
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export default upload;