import { Router } from 'express';
import chatController from '../controllers/chatController';
import { authenticateToken, requireAuth } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/errorHandler';
import { 
  validateChatCreation,
  validateChatUpdate,
  validateMessageCreation,
  validateMessageUpdate,
  validateUUIDParam
} from '../utils/validation';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for chat operations
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: {
    success: false,
    message: 'Too many chat requests, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 messages per minute
  message: {
    success: false,
    message: 'Too many messages, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply auth middleware to all routes
router.use(authenticateToken);
router.use(requireAuth);

// Chat management routes
/**
 * @route   POST /api/chats
 * @desc    Create a new chat
 * @access  Private
 */
router.post('/', 
  chatLimiter,
  validateChatCreation,
  handleValidationErrors,
  chatController.createChat
);

/**
 * @route   GET /api/chats
 * @desc    Get user's chats
 * @access  Private
 */
router.get('/', 
  chatLimiter,
  chatController.getChats
);

/**
 * @route   GET /api/chats/search
 * @desc    Search user's chats
 * @access  Private
 */
router.get('/search', 
  chatLimiter,
  chatController.searchChats
);

/**
 * @route   GET /api/chats/stats
 * @desc    Get user's chat statistics
 * @access  Private
 */
router.get('/stats', 
  chatLimiter,
  chatController.getChatStats
);

/**
 * @route   GET /api/chats/:chatId
 * @desc    Get a specific chat with messages
 * @access  Private
 */
router.get('/:chatId', 
  chatLimiter,
  validateUUIDParam('chatId'),
  handleValidationErrors,
  chatController.getChatById
);

/**
 * @route   PUT /api/chats/:chatId
 * @desc    Update a chat
 * @access  Private
 */
router.put('/:chatId', 
  chatLimiter,
  validateUUIDParam('chatId'),
  validateChatUpdate,
  handleValidationErrors,
  chatController.updateChat
);

/**
 * @route   DELETE /api/chats/:chatId
 * @desc    Delete a chat
 * @access  Private
 */
router.delete('/:chatId', 
  chatLimiter,
  validateUUIDParam('chatId'),
  handleValidationErrors,
  chatController.deleteChat
);

/**
 * @route   GET /api/chats/:chatId/export
 * @desc    Export chat data
 * @access  Private
 */
router.get('/:chatId/export', 
  chatLimiter,
  validateUUIDParam('chatId'),
  handleValidationErrors,
  chatController.exportChat
);

// Message management routes
/**
 * @route   POST /api/chats/:chatId/messages
 * @desc    Send a message in a chat
 * @access  Private
 */
router.post('/:chatId/messages', 
  messageLimiter,
  validateUUIDParam('chatId'),
  validateMessageCreation,
  handleValidationErrors,
  chatController.sendMessage
);

/**
 * @route   POST /api/chats/:chatId/messages/stream
 * @desc    Send a message with streaming response
 * @access  Private
 */
router.post('/:chatId/messages/stream', 
  messageLimiter,
  validateUUIDParam('chatId'),
  validateMessageCreation,
  handleValidationErrors,
  chatController.streamMessage
);

/**
 * @route   GET /api/chats/:chatId/messages
 * @desc    Get messages for a chat
 * @access  Private
 */
router.get('/:chatId/messages', 
  chatLimiter,
  validateUUIDParam('chatId'),
  handleValidationErrors,
  chatController.getChatMessages
);

/**
 * @route   PUT /api/chats/:chatId/messages/:messageId
 * @desc    Update a message
 * @access  Private
 */
router.put('/:chatId/messages/:messageId', 
  chatLimiter,
  validateUUIDParam('chatId'),
  validateUUIDParam('messageId'),
  validateMessageUpdate,
  handleValidationErrors,
  chatController.updateMessage
);

/**
 * @route   DELETE /api/chats/:chatId/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:chatId/messages/:messageId', 
  chatLimiter,
  validateUUIDParam('chatId'),
  validateUUIDParam('messageId'),
  handleValidationErrors,
  chatController.deleteMessage
);

export default router;