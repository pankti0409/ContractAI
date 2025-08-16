import { Chat, Message, CreateChatRequest, CreateMessageRequest, QueryOptions, PaginatedResponse } from '../types';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors';
import ChatModel from '../models/Chat';
import MessageModel from '../models/Message';
import FileModel from '../models/File';
import { v4 as uuidv4 } from 'uuid';

export interface ChatWithMessages extends Chat {
  messages: Message[];
  messageCount: number;
}

export interface AIResponse {
  content: string;
  messageType: 'assistant';
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
  };
}

class ChatService {
  async createChat(userId: string, data: CreateChatRequest): Promise<Chat> {
    const chatData = {
      ...data,
      userId,
      title: data.title || 'New Chat',
      description: data.description
    };

    return await ChatModel.create(userId, chatData);
  }

  async getChatById(chatId: string, userId: string): Promise<ChatWithMessages> {
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check ownership
    if (chat.userId !== userId) {
      throw new AuthorizationError('Access denied to this chat');
    }

    // Get messages for this chat
    const messagesResult = await MessageModel.findByChatId(chatId, {
      sortBy: 'created_at',
      sortOrder: 'ASC',
      limit: 1000 // Get all messages for a chat
    });

    return {
      ...chat,
      messages: messagesResult.data,
      messageCount: messagesResult.pagination.total
    };
  }

  async getUserChats(userId: string, options: QueryOptions = {}): Promise<PaginatedResponse<Chat>> {
    return await ChatModel.findByUserId(userId, options);
  }

  async updateChat(chatId: string, userId: string, updates: Partial<Chat>): Promise<Chat> {
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check ownership
    if (chat.userId !== userId) {
      throw new AuthorizationError('Access denied to this chat');
    }

    return await ChatModel.update(chatId, userId, updates);
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    // Check ownership
    if (chat.userId !== userId) {
      throw new AuthorizationError('Access denied to this chat');
    }

    await ChatModel.delete(chatId, userId);
  }

  async sendMessage(chatId: string, userId: string, messageData: Omit<CreateMessageRequest, 'chatId' | 'userId'>): Promise<{ userMessage: Message; aiResponse: Message }> {
    // Verify chat exists and user has access
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    if (chat.userId !== userId) {
      throw new AuthorizationError('Access denied to this chat');
    }

    // Create user message
    const userMessageData: CreateMessageRequest = {
      ...messageData,
      chatId,
      userId,
      messageType: 'user'
    };

    const userMessage = await MessageModel.create(userMessageData);

    // Generate AI response
    const aiResponseData = await this.generateAIResponse(chatId, userMessage.content, userMessage.files);
    
    // Create AI response message
    const aiMessageData: CreateMessageRequest = {
      chatId,
      userId,
      content: aiResponseData.content,
      messageType: 'assistant'
    };

    const aiMessage = await MessageModel.create(aiMessageData);

    // Update chat title if it's the first message
    if (chat.title === 'New Chat') {
      const title = this.generateChatTitle(userMessage.content);
      await ChatModel.update(chatId, userId, { title });
    }

    return {
      userMessage,
      aiResponse: aiMessage
    };
  }

  async getChatMessages(chatId: string, userId: string, options: QueryOptions = {}): Promise<PaginatedResponse<Message>> {
    // Verify chat exists and user has access
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      throw new NotFoundError('Chat not found');
    }

    if (chat.userId !== userId) {
      throw new AuthorizationError('Access denied to this chat');
    }

    return await MessageModel.findByChatId(chatId, options);
  }

  async updateMessage(messageId: string, userId: string, updates: Partial<Message>): Promise<Message> {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verify user owns the message
    if (message.userId !== userId) {
      throw new AuthorizationError('Access denied to this message');
    }

    // Only allow updating user messages
    if (message.messageType !== 'user') {
      throw new ValidationError('Only user messages can be updated');
    }

    return await MessageModel.update(messageId, updates);
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verify user owns the message
    if (message.userId !== userId) {
      throw new AuthorizationError('Access denied to this message');
    }

    await MessageModel.delete(messageId);
  }

  async searchChats(userId: string, query: string, options: QueryOptions = {}): Promise<PaginatedResponse<Chat>> {
    // This is a simplified search - in a real app, you might use full-text search
    const chats = await ChatModel.findByUserId(userId, {
      ...options,
      sortBy: 'updated_at',
      sortOrder: 'DESC'
    });

    // Filter chats by title containing the query
    const filteredChats = chats.data.filter(chat => 
      chat.title.toLowerCase().includes(query.toLowerCase()) ||
      chat.description?.toLowerCase().includes(query.toLowerCase())
    );

    return {
      data: filteredChats,
      pagination: {
        ...chats.pagination,
        total: filteredChats.length,
        totalPages: Math.ceil(filteredChats.length / (options.limit || 10))
      }
    };
  }

  async getChatStats(userId: string): Promise<{
    totalChats: number;
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    averageMessagesPerChat: number;
  }> {
    const chatStats = await ChatModel.getChatStats(userId);
    const messageStats = await MessageModel.getMessageStats(userId);

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

  private async generateAIResponse(chatId: string, userMessage: string, files?: any[]): Promise<AIResponse> {
    // This is a mock AI response generator
    // In a real application, you would integrate with OpenAI, Claude, or other AI services
    
    const startTime = Date.now();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const processingTime = Date.now() - startTime;
    
    // Mock responses based on content
    let response = '';
    
    if (userMessage.toLowerCase().includes('contract')) {
      response = `I can help you analyze contracts. Based on your message, I understand you're interested in contract-related assistance. Here are some ways I can help:

1. **Contract Review**: I can analyze contract terms and identify potential issues
2. **Risk Assessment**: Highlight clauses that might pose risks
3. **Compliance Check**: Ensure contracts meet legal standards
4. **Clause Suggestions**: Recommend improvements or alternatives

Please share the specific contract or clause you'd like me to review, and I'll provide detailed analysis.`;
    } else if (userMessage.toLowerCase().includes('legal')) {
      response = `I can provide legal document analysis and insights. However, please note that I provide informational assistance only and this should not be considered as legal advice. For specific legal matters, please consult with a qualified attorney.

How can I assist you with your legal document today?`;
    } else if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
      response = `Hello! I'm ContractAI, your intelligent contract analysis assistant. I'm here to help you with:

• Contract review and analysis
• Legal document interpretation
• Risk assessment
• Compliance checking
• Contract drafting assistance

What would you like to work on today?`;
    } else if (files && files.length > 0) {
      response = `I can see you've uploaded ${files.length} file(s). I can analyze various document types including:

• PDF contracts and agreements
• Word documents
• Legal forms and templates

Please let me know what specific aspects of these documents you'd like me to focus on, such as:
- Risk analysis
- Clause review
- Compliance checking
- Term clarification`;
    } else {
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
        tokens: Math.floor(response.length / 4), // Rough token estimate
        processingTime
      }
    };
  }

  private generateChatTitle(firstMessage: string): string {
    // Generate a title based on the first message
    const words = firstMessage.split(' ').slice(0, 6); // Take first 6 words
    let title = words.join(' ');
    
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    if (title.length < 10) {
      title = 'Contract Discussion';
    }
    
    return title;
  }

  async exportChat(chatId: string, userId: string, format: 'json' | 'txt' = 'json'): Promise<string> {
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

export default new ChatService();