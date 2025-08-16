import { Chat, Message, CreateChatRequest, CreateMessageRequest, QueryOptions, PaginatedResponse } from '../types';
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
declare class ChatService {
    createChat(userId: string, data: CreateChatRequest): Promise<Chat>;
    getChatById(chatId: string, userId: string): Promise<ChatWithMessages>;
    getUserChats(userId: string, options?: QueryOptions): Promise<PaginatedResponse<Chat>>;
    updateChat(chatId: string, userId: string, updates: Partial<Chat>): Promise<Chat>;
    deleteChat(chatId: string, userId: string): Promise<void>;
    sendMessage(chatId: string, userId: string, messageData: Omit<CreateMessageRequest, 'chatId' | 'userId'>): Promise<{
        userMessage: Message;
        aiResponse: Message;
    }>;
    getChatMessages(chatId: string, userId: string, options?: QueryOptions): Promise<PaginatedResponse<Message>>;
    updateMessage(messageId: string, userId: string, updates: Partial<Message>): Promise<Message>;
    deleteMessage(messageId: string, userId: string): Promise<void>;
    searchChats(userId: string, query: string, options?: QueryOptions): Promise<PaginatedResponse<Chat>>;
    getChatStats(userId: string): Promise<{
        totalChats: number;
        totalMessages: number;
        userMessages: number;
        assistantMessages: number;
        averageMessagesPerChat: number;
    }>;
    private generateAIResponse;
    private generateChatTitle;
    exportChat(chatId: string, userId: string, format?: 'json' | 'txt'): Promise<string>;
}
declare const _default: ChatService;
export default _default;
//# sourceMappingURL=chatService.d.ts.map