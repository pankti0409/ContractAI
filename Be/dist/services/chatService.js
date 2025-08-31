"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../utils/errors");
const Chat_1 = __importDefault(require("../models/Chat"));
const Message_1 = __importDefault(require("../models/Message"));
class ChatService {
    async createChat(userId, data) {
        const chatData = {
            ...data,
            userId,
            title: data.title || 'New Chat',
            description: data.description
        };
        return await Chat_1.default.create(userId, chatData);
    }
    async getChatById(chatId, userId) {
        const chat = await Chat_1.default.findById(chatId);
        if (!chat) {
            throw new errors_1.NotFoundError('Chat not found');
        }
        if (chat.userId !== userId) {
            throw new errors_1.AuthorizationError('Access denied to this chat');
        }
        const messagesResult = await Message_1.default.findByChatId(chatId, {
            sortBy: 'created_at',
            sortOrder: 'ASC',
            limit: 1000
        });
        return {
            ...chat,
            messages: messagesResult.data,
            messageCount: messagesResult.pagination.total
        };
    }
    async getUserChats(userId, options = {}) {
        return await Chat_1.default.findByUserId(userId, options);
    }
    async updateChat(chatId, userId, updates) {
        const chat = await Chat_1.default.findById(chatId);
        if (!chat) {
            throw new errors_1.NotFoundError('Chat not found');
        }
        if (chat.userId !== userId) {
            throw new errors_1.AuthorizationError('Access denied to this chat');
        }
        return await Chat_1.default.update(chatId, userId, updates);
    }
    async deleteChat(chatId, userId) {
        const chat = await Chat_1.default.findById(chatId);
        if (!chat) {
            throw new errors_1.NotFoundError('Chat not found');
        }
        if (chat.userId !== userId) {
            throw new errors_1.AuthorizationError('Access denied to this chat');
        }
        await Chat_1.default.delete(chatId, userId);
    }
    async sendMessage(chatId, userId, messageData) {
        const chat = await Chat_1.default.findById(chatId);
        if (!chat) {
            throw new errors_1.NotFoundError('Chat not found');
        }
        if (chat.userId !== userId) {
            throw new errors_1.AuthorizationError('Access denied to this chat');
        }
        const userMessageData = {
            ...messageData,
            chatId,
            userId,
            messageType: messageData.messageType || 'text'
        };
        const userMessage = await Message_1.default.create(userMessageData);
        const aiResponseData = await this.generateAIResponse(chatId, userMessage.content, userMessage.files);
        const aiMessageData = {
            chatId,
            userId,
            content: aiResponseData.content,
            messageType: 'text'
        };
        const aiMessage = await Message_1.default.create(aiMessageData);
        if (chat.title === 'New Chat') {
            const title = this.generateChatTitle(userMessage.content);
            await Chat_1.default.update(chatId, userId, { title });
        }
        return {
            userMessage,
            aiResponse: aiMessage
        };
    }
    async getChatMessages(chatId, userId, options = {}) {
        const chat = await Chat_1.default.findById(chatId);
        if (!chat) {
            throw new errors_1.NotFoundError('Chat not found');
        }
        if (chat.userId !== userId) {
            throw new errors_1.AuthorizationError('Access denied to this chat');
        }
        return await Message_1.default.findByChatId(chatId, options);
    }
    async updateMessage(messageId, userId, updates) {
        const message = await Message_1.default.findById(messageId);
        if (!message) {
            throw new errors_1.NotFoundError('Message not found');
        }
        if (message.userId !== userId) {
            throw new errors_1.AuthorizationError('Access denied to this message');
        }
        if (message.messageType !== 'text') {
            throw new errors_1.ValidationError('Only text messages can be updated');
        }
        return await Message_1.default.update(messageId, updates);
    }
    async deleteMessage(messageId, userId) {
        const message = await Message_1.default.findById(messageId);
        if (!message) {
            throw new errors_1.NotFoundError('Message not found');
        }
        if (message.userId !== userId) {
            throw new errors_1.AuthorizationError('Access denied to this message');
        }
        await Message_1.default.delete(messageId);
    }
    async searchChats(userId, query, options = {}) {
        const chats = await Chat_1.default.findByUserId(userId, {
            ...options,
            sortBy: 'updated_at',
            sortOrder: 'DESC'
        });
        const filteredChats = chats.data.filter(chat => chat.title.toLowerCase().includes(query.toLowerCase()) ||
            chat.description?.toLowerCase().includes(query.toLowerCase()));
        return {
            data: filteredChats,
            pagination: {
                ...chats.pagination,
                total: filteredChats.length,
                totalPages: Math.ceil(filteredChats.length / (options.limit || 10))
            }
        };
    }
    async getChatStats(userId) {
        const chatStats = await Chat_1.default.getChatStats(userId);
        const messageStats = await Message_1.default.getMessageStats(userId);
        return {
            totalChats: chatStats.totalChats,
            totalMessages: messageStats.totalMessages,
            userMessages: messageStats.userMessages,
            assistantMessages: messageStats.assistantMessages,
            averageMessagesPerChat: chatStats.totalChats > 0
                ? Math.round(messageStats.totalMessages / chatStats.totalChats * 100) / 100
                : 0
        };
    }
    async generateAIResponse(chatId, userMessage, files) {
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        const processingTime = Date.now() - startTime;
        let response = '';
        if (userMessage.toLowerCase().includes('contract')) {
            response = `I can help you analyze contracts. Based on your message, I understand you're interested in contract-related assistance. Here are some ways I can help:

1. **Contract Review**: I can analyze contract terms and identify potential issues
2. **Risk Assessment**: Highlight clauses that might pose risks
3. **Compliance Check**: Ensure contracts meet legal standards
4. **Clause Suggestions**: Recommend improvements or alternatives

Please share the specific contract or clause you'd like me to review, and I'll provide detailed analysis.`;
        }
        else if (userMessage.toLowerCase().includes('legal')) {
            response = `I can provide legal document analysis and insights. However, please note that I provide informational assistance only and this should not be considered as legal advice. For specific legal matters, please consult with a qualified attorney.

How can I assist you with your legal document today?`;
        }
        else if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
            response = `Hello! I'm ContractAI, your intelligent contract analysis assistant. I'm here to help you with:

• Contract review and analysis
• Legal document interpretation
• Risk assessment
• Compliance checking
• Contract drafting assistance

What would you like to work on today?`;
        }
        else if (files && files.length > 0) {
            response = `I can see you've uploaded ${files.length} file(s). I can analyze various document types including:

• PDF contracts and agreements
• Word documents
• Legal forms and templates

Please let me know what specific aspects of these documents you'd like me to focus on, such as:
- Risk analysis
- Clause review
- Compliance checking
- Term clarification`;
        }
        else {
            response = `Thank you for your message. As ContractAI, I specialize in contract and legal document analysis. I can help you with:

• **Document Review**: Analyze contracts, agreements, and legal documents
• **Risk Assessment**: Identify potential legal and business risks
• **Clause Analysis**: Break down complex legal language
• **Compliance**: Check against standard practices and regulations

Please share your contract or legal document, or let me know how I can assist you with your legal document needs.`;
        }
        return {
            content: response,
            messageType: 'assistant',
            metadata: {
                model: 'contractai-v1',
                tokens: Math.floor(response.length / 4),
                processingTime
            }
        };
    }
    generateChatTitle(firstMessage) {
        const words = firstMessage.split(' ').slice(0, 6);
        let title = words.join(' ');
        if (title.length > 50) {
            title = title.substring(0, 47) + '...';
        }
        if (title.length < 10) {
            title = 'Contract Discussion';
        }
        return title;
    }
    async exportChat(chatId, userId, format = 'json') {
        const chatWithMessages = await this.getChatById(chatId, userId);
        if (format === 'txt') {
            let content = `Chat: ${chatWithMessages.title}\n`;
            content += `Created: ${chatWithMessages.createdAt.toISOString()}\n`;
            content += `Messages: ${chatWithMessages.messageCount}\n\n`;
            chatWithMessages.messages.forEach((message, index) => {
                content += `[${index + 1}] ${message.messageType.toUpperCase()}: ${message.content}\n`;
                content += `Time: ${message.createdAt.toISOString()}\n\n`;
            });
            return content;
        }
        return JSON.stringify(chatWithMessages, null, 2);
    }
}
exports.default = new ChatService();
//# sourceMappingURL=chatService.js.map