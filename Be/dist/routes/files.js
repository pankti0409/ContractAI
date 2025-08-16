"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fileController_1 = __importDefault(require("../controllers/fileController"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../utils/validation");
const upload_1 = require("../middleware/upload");
const upload_2 = __importDefault(require("../middleware/upload"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const fileLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many file requests, please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false
});
const uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many upload attempts, please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false
});
router.use(auth_1.authenticateToken);
router.use(auth_1.requireAuth);
router.post('/upload', uploadLimiter, upload_2.default.single('file'), upload_1.validateUploadedFiles, upload_1.cleanupUploadedFiles, fileController_1.default.uploadFile);
router.post('/upload/multiple', uploadLimiter, upload_2.default.array('files', 10), upload_1.validateUploadedFiles, upload_1.cleanupUploadedFiles, fileController_1.default.uploadMultipleFiles);
router.post('/validate', fileLimiter, upload_2.default.single('file'), fileController_1.default.validateFile);
router.get('/', fileLimiter, fileController_1.default.getUserFiles);
router.get('/stats', fileLimiter, fileController_1.default.getFileStats);
router.get('/:fileId', fileLimiter, (0, validation_1.validateUUIDParam)('fileId'), errorHandler_1.handleValidationErrors, fileController_1.default.getFile);
router.get('/:fileId/download', fileLimiter, (0, validation_1.validateUUIDParam)('fileId'), errorHandler_1.handleValidationErrors, fileController_1.default.downloadFile);
router.get('/:fileId/preview', fileLimiter, (0, validation_1.validateUUIDParam)('fileId'), errorHandler_1.handleValidationErrors, fileController_1.default.previewFile);
router.delete('/:fileId', fileLimiter, (0, validation_1.validateUUIDParam)('fileId'), errorHandler_1.handleValidationErrors, fileController_1.default.deleteFile);
router.post('/delete/batch', fileLimiter, validation_1.validateMultipleFileUpload, errorHandler_1.handleValidationErrors, fileController_1.default.deleteMultipleFiles);
router.get('/chats/:chatId', fileLimiter, (0, validation_1.validateUUIDParam)('chatId'), errorHandler_1.handleValidationErrors, fileController_1.default.getChatFiles);
router.post('/:fileId/process', fileLimiter, (0, validation_1.validateUUIDParam)('fileId'), errorHandler_1.handleValidationErrors, fileController_1.default.processFileForAI);
exports.default = router;
//# sourceMappingURL=files.js.map