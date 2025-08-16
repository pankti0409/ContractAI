import { Message, CreateMessageRequest, QueryOptions, PaginatedResponse } from '../types';
export declare class MessageModel {
    private pool;
    constructor();
    create(messageData: CreateMessageRequest): Promise<Message>;
    findById(id: string): Promise<Message | null>;
    findByChatId(chatId: string, options?: QueryOptions): Promise<PaginatedResponse<Message>>;
    findByUserId(userId: string, options?: QueryOptions): Promise<PaginatedResponse<Message>>;
    update(id: string, updates: Partial<Message>): Promise<Message>;
    delete(id: string): Promise<void>;
    getMessageStats(userId: string): Promise<{
        totalMessages: number;
        userMessages: number;
        assistantMessages: number;
    }>;
    private mapRowToMessage;
    private mapRowToFile;
}
declare const _default: MessageModel;
export default _default;
//# sourceMappingURL=Message.d.ts.map