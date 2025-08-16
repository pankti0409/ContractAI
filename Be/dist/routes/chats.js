"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = __importDefault(require("../controllers/chatController"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../utils/validation");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const chatLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: {
        success: false,
        message: 'Too many chat requests, please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false
});
const messageLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Too many messages, please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false
});
router.use(auth_1.authenticateToken);
router.use(auth_1.requireAuth);
router.post('/', chatLimiter, validation_1.validateChatCreation, errorHandler_1.handleValidationErrors, chatController_1.default.createChat);
router.get('/', chatLimiter, chatController_1.default.getChats);
router.get('/search', chatLimiter, chatController_1.default.searchChats);
router.get('/stats', chatLimiter, chatController_1.default.getChatStats);
router.get('/:chatId', chatLimiter, (0, validation_1.validateUUIDParam)('chatId'), errorHandler_1.handleValidationErrors, chatController_1.default.getChatById);
router.put('/:chatId', chatLimiter, (0, validation_1.validateUUIDParam)('chatId'), validation_1.validateChatUpdate, errorHandler_1.handleValidationErrors, chatController_1.default.updateChat);
router.delete('/:chatId', chatLimiter, (0, validation_1.validateUUIDParam)('chatId'), errorHandler_1.handleValidationErrors, chatController_1.default.deleteChat);
router.get('/:chatId/export', chatLimiter, (0, validation_1.validateUUIDParam)('chatId'), errorHandler_1.handleValidationErrors, chatController_1.default.exportChat);
router.post('/:chatId/messages', messageLimiter, (0, validation_1.validateUUIDParam)('chatId'), validation_1.validateMessageCreation, errorHandler_1.handleValidationErrors, chatController_1.default.sendMessage);
router.post('/:chatId/messages/stream', messageLimiter, (0, validation_1.validateUUIDParam)('chatId'), validation_1.validateMessageCreation, errorHandler_1.handleValidationErrors, chatController_1.default.streamMessage);
router.get('/:chatId/messages', chatLimiter, (0, validation_1.validateUUIDParam)('chatId'), errorHandler_1.handleValidationErrors, chatController_1.default.getChatMessages);
router.put('/:chatId/messages/:messageId', chatLimiter, (0, validation_1.validateUUIDParam)('chatId'), (0, validation_1.validateUUIDParam)('messageId'), validation_1.validateMessageUpdate, errorHandler_1.handleValidationErrors, chatController_1.default.updateMessage);
router.delete('/:chatId/messages/:messageId', chatLimiter, (0, validation_1.validateUUIDParam)('chatId'), (0, validation_1.validateUUIDParam)('messageId'), errorHandler_1.handleValidationErrors, chatController_1.default.deleteMessage);
exports.default = router;
//# sourceMappingURL=chats.js.map