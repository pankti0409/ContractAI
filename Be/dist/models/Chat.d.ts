import { Chat, CreateChatRequest, QueryOptions, PaginatedResponse } from '../types';
export declare class ChatModel {
    private pool;
    constructor();
    create(userId: string, chatData: CreateChatRequest): Promise<Chat>;
    findById(id: string, userId?: string): Promise<Chat | null>;
    findByUserId(userId: string, options?: QueryOptions): Promise<PaginatedResponse<Chat>>;
    update(id: string, userId: string, updates: Partial<Chat>): Promise<Chat>;
    updateLastActivity(id: string): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
    findAll(options?: QueryOptions): Promise<PaginatedResponse<Chat>>;
    getRecentChats(userId: string, limit?: number): Promise<Chat[]>;
    getChatStats(userId: string): Promise<{
        totalChats: number;
        totalMessages: number;
    }>;
    private mapRowToChat;
}
declare const _default: ChatModel;
export default _default;
//# sourceMappingURL=Chat.d.ts.map