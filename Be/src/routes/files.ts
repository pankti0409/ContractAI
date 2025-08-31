import { Router } from 'express';
import fileController from '../controllers/fileController';
import { authenticateToken, requireAuth } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';
import { 
  validateUUIDParam,
  validateFileUpload,
  validateMultipleFileUpload
} from '../utils/validation';
import { 
  uploadSingle, 
  uploadMultiple,
  validateUploadedFiles,
  cleanupUploadedFiles
} from '../middleware/upload';
import upload from '../middleware/upload';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for file operations
const fileLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per minute
  message: {
    success: false,
    message: 'Too many file requests, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 uploads per minute
  message: {
    success: false,
    message: 'Too many upload attempts, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply auth middleware to all routes
router.use(authenticateToken);
router.use(requireAuth);

// File upload routes
/**
 * @route   POST /api/files/upload
 * @desc    Upload a single file
 * @access  Private
 */
router.post('/upload', 
  uploadLimiter,
  upload.single('file'),
  validateUploadedFiles,
  cleanupUploadedFiles,
  fileController.uploadFile
);

/**
 * @route   POST /api/files/upload/multiple
 * @desc    Upload multiple files
 * @access  Private
 */
router.post('/upload/multiple', 
  uploadLimiter,
  upload.array('files', 10), // Max 10 files
  validateUploadedFiles,
  cleanupUploadedFiles,
  fileController.uploadMultipleFiles
);

/**
 * @route   POST /api/files/validate
 * @desc    Validate a file without uploading
 * @access  Private
 */
router.post('/validate', 
  fileLimiter,
  upload.single('file'),
  fileController.validateFile
);

// File management routes
/**
 * @route   GET /api/files
 * @desc    Get user's files
 * @access  Private
 */
router.get('/', 
  fileLimiter,
  fileController.getUserFiles
);

/**
 * @route   GET /api/files/stats
 * @desc    Get user's file statistics
 * @access  Private
 */
router.get('/stats', 
  fileLimiter,
  fileController.getFileStats
);

/**
 * @route   GET /api/files/:fileId
 * @desc    Get file information
 * @access  Private
 */
router.get('/:fileId', 
  fileLimiter,
  validateUUIDParam('fileId'),
  handleValidationErrors,
  fileController.getFile
);

/**
 * @route   GET /api/files/:fileId/download
 * @desc    Download a file
 * @access  Private
 */
router.get('/:fileId/download', 
  fileLimiter,
  validateUUIDParam('fileId'),
  handleValidationErrors,
  fileController.downloadFile
);

/**
 * @route   GET /api/files/:fileId/preview
 * @desc    Preview a file (inline display)
 * @access  Private
 */
router.get('/:fileId/preview', 
  fileLimiter,
  validateUUIDParam('fileId'),
  handleValidationErrors,
  fileController.previewFile
);

/**
 * @route   GET /api/files/:fileId/text
 * @desc    Get extracted text content from a file
 * @access  Private
 */
router.get('/:fileId/text', 
  fileLimiter,
  validateUUIDParam('fileId'),
  handleValidationErrors,
  fileController.getFileText
);

/**
 * @route   DELETE /api/files/:fileId
 * @desc    Delete a file
 * @access  Private
 */
router.delete('/:fileId', 
  fileLimiter,
  validateUUIDParam('fileId'),
  handleValidationErrors,
  fileController.deleteFile
);

/**
 * @route   POST /api/files/delete/batch
 * @desc    Delete multiple files
 * @access  Private
 */
router.post('/delete/batch', 
  fileLimiter,
  validateMultipleFileUpload,
  handleValidationErrors,
  fileController.deleteMultipleFiles
);

// Chat-specific file routes
/**
 * @route   GET /api/files/chats/:chatId
 * @desc    Get files for a specific chat
 * @access  Private
 */
router.get('/chats/:chatId', 
  fileLimiter,
  validateUUIDParam('chatId'),
  handleValidationErrors,
  fileController.getChatFiles
);

// AI processing routes
/**
 * @route   POST /api/files/:fileId/process
 * @desc    Process file for AI analysis
 * @access  Private
 */
router.post('/:fileId/process', 
  fileLimiter,
  validateUUIDParam('fileId'),
  handleValidationErrors,
  fileController.processFileForAI
);

export default router;