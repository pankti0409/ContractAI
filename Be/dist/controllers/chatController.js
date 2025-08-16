"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chatService_1 = __importDefault(require("../services/chatService"));
const errorHandler_1 = require("../middleware/errorHandler");
const express_validator_1 = require("express-validator");
class ChatController {
    constructor() {
        this.createChat = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const userId = req.user.userId;
            const { title, description } = req.body;
            const chat = await chatService_1.default.createChat(userId, title);
            return res.status(201).json({
                success: true,
                message: 'Chat created successfully',
                data: chat
            });
        });
        this.getChats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { page = 1, limit = 10, sortBy = 'updated_at', sortOrder = 'DESC' } = req.query;
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await chatService_1.default.getUserChats(userId, options);
            return res.json({
                success: true,
                data: result
            });
        });
        this.getChatById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { chatId } = req.params;
            const chat = await chatService_1.default.getChatById(chatId, userId);
            res.json({
                success: true,
                data: {
                    chat
                }
            });
        });
        this.updateChat = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const userId = req.user.userId;
            const { chatId } = req.params;
            const { title, description } = req.body;
            const chat = await chatService_1.default.updateChat(chatId, userId, {
                title,
                description
            });
            return res.json({
                success: true,
                message: 'Chat updated successfully',
                data: {
                    chat
                }
            });
        });
        this.deleteChat = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { chatId } = req.params;
            await chatService_1.default.deleteChat(chatId, userId);
            res.json({
                success: true,
                message: 'Chat deleted successfully'
            });
        });
        this.sendMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const userId = req.user.userId;
            const { chatId } = req.params;
            const { content, files } = req.body;
            const result = await chatService_1.default.sendMessage(chatId, userId, {
                content,
                files,
                messageType: 'user'
            });
            return res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: result
            });
        });
        this.getChatMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { chatId } = req.params;
            const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'ASC' } = req.query;
            const options = {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await chatService_1.default.getChatMessages(chatId, userId, options);
            return res.json({
                success: true,
                data: result
            });
        });
        this.updateMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const userId = req.user.userId;
            const { messageId } = req.params;
            const { content } = req.body;
            const message = await chatService_1.default.updateMessage(messageId, userId, {
                content
            });
            return res.json({
                success: true,
                message: 'Message updated successfully',
                data: {
                    message
                }
            });
        });
        this.deleteMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { messageId } = req.params;
            await chatService_1.default.deleteMessage(messageId, userId);
            res.json({
                success: true,
                message: 'Message deleted successfully'
            });
        });
        this.searchChats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { q: query, page = 1, limit = 10 } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }
            const options = {
                page: parseInt(page),
                limit: parseInt(limit)
            };
            const result = await chatService_1.default.searchChats(userId, query, options);
            return res.json({
                success: true,
                data: result
            });
        });
        this.getChatStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const stats = await chatService_1.default.getChatStats(userId);
            res.json({
                success: true,
                data: {
                    stats
                }
            });
        });
        this.exportChat = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { chatId } = req.params;
            const { format = 'json' } = req.query;
            if (format !== 'json' && format !== 'txt') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid format. Supported formats: json, txt'
                });
            }
            const exportData = await chatService_1.default.exportChat(chatId, userId, format);
            const filename = `chat-${chatId}-${new Date().toISOString().split('T')[0]}.${format}`;
            const contentType = format === 'json' ? 'application/json' : 'text/plain';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.send(exportData);
        });
        this.streamMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { chatId } = req.params;
            const { content, files } = req.body;
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
            try {
                const result = await chatService_1.default.sendMessage(chatId, userId, {
                    content,
                    files,
                    messageType: 'user'
                });
                res.write(`data: ${JSON.stringify({
                    type: 'user_message',
                    data: result.userMessage
                })}\n\n`);
                const aiResponse = result.aiResponse.content;
                const words = aiResponse.split(' ');
                res.write(`data: ${JSON.stringify({
                    type: 'ai_message_start',
                    data: { messageId: result.aiResponse.id }
                })}\n\n`);
                for (let i = 0; i < words.length; i++) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    res.write(`data: ${JSON.stringify({
                        type: 'ai_message_chunk',
                        data: {
                            messageId: result.aiResponse.id,
                            chunk: words[i] + ' ',
                            isComplete: i === words.length - 1
                        }
                    })}\n\n`);
                }
                res.write(`data: ${JSON.stringify({
                    type: 'ai_message_complete',
                    data: result.aiResponse
                })}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    data: { message: errorMessage }
                })}\n\n`);
                res.end();
            }
        });
    }
}
exports.default = new ChatController();
//# sourceMappingURL=chatController.js.map