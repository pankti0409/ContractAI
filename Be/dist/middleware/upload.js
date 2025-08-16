"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.cleanupUploadedFiles = exports.validateUploadedFiles = exports.uploadFields = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const errors_1 = require("../utils/errors");
const validation_1 = require("../utils/validation");
const uploadPath = process.env.UPLOAD_PATH || './uploads';
if (!fs_1.default.existsSync(uploadPath)) {
    fs_1.default.mkdirSync(uploadPath, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.user?.userId || 'anonymous';
        const userUploadPath = path_1.default.join(uploadPath, userId);
        if (!fs_1.default.existsSync(userUploadPath)) {
            fs_1.default.mkdirSync(userUploadPath, { recursive: true });
        }
        cb(null, userUploadPath);
    },
    filename: (req, file, cb) => {
        const fileExtension = path_1.default.extname(file.originalname);
        const uniqueFilename = `${(0, uuid_1.v4)()}${fileExtension}`;
        cb(null, uniqueFilename);
    }
});
const fileFilter = (req, file, cb) => {
    if (!(0, validation_1.isValidFileType)(file.mimetype)) {
        cb(new errors_1.ValidationError(`File type ${file.mimetype} is not allowed`));
        return;
    }
    if (file.originalname.length > 255) {
        cb(new errors_1.ValidationError('File name is too long'));
        return;
    }
    cb(null, true);
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
        files: 10,
        fieldSize: 1024 * 1024,
    }
});
const uploadSingle = (fieldName = 'file') => {
    return upload.single(fieldName);
};
exports.uploadSingle = uploadSingle;
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
    return upload.array(fieldName, maxCount);
};
exports.uploadMultiple = uploadMultiple;
const uploadFields = (fields) => {
    return upload.fields(fields);
};
exports.uploadFields = uploadFields;
const validateUploadedFiles = (req, res, next) => {
    const files = req.files;
    const file = req.file;
    const allFiles = files || (file ? [file] : []);
    if (allFiles.length === 0) {
        return next();
    }
    for (const uploadedFile of allFiles) {
        if (!(0, validation_1.isValidFileSize)(uploadedFile.size)) {
            return next(new errors_1.ValidationError(`File ${uploadedFile.originalname} is too large`));
        }
        if (!fs_1.default.existsSync(uploadedFile.path)) {
            return next(new errors_1.ValidationError(`File ${uploadedFile.originalname} was not saved properly`));
        }
    }
    next();
};
exports.validateUploadedFiles = validateUploadedFiles;
const cleanupUploadedFiles = (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    const cleanup = () => {
        if (res.statusCode >= 400) {
            const files = req.files;
            const file = req.file;
            const allFiles = files || (file ? [file] : []);
            allFiles.forEach(uploadedFile => {
                if (fs_1.default.existsSync(uploadedFile.path)) {
                    fs_1.default.unlinkSync(uploadedFile.path);
                }
            });
        }
    };
    res.send = function (body) {
        cleanup();
        return originalSend.call(this, body);
    };
    res.json = function (body) {
        cleanup();
        return originalJson.call(this, body);
    };
    next();
};
exports.cleanupUploadedFiles = cleanupUploadedFiles;
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs_1.default.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
exports.deleteFile = deleteFile;
exports.default = upload;
//# sourceMappingURL=upload.js.map