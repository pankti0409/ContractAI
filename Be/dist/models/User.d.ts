import { User, CreateUserRequest, QueryOptions, PaginatedResponse } from '../types';
export declare class UserModel {
    private pool;
    constructor();
    create(userData: CreateUserRequest): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByEmailWithPassword(email: string): Promise<(User & {
        passwordHash: string;
    }) | null>;
    update(id: string, updates: Partial<User>): Promise<User>;
    updateLastLogin(id: string): Promise<void>;
    delete(id: string): Promise<void>;
    findAll(options?: QueryOptions): Promise<PaginatedResponse<User>>;
    private mapRowToUser;
}
declare const _default: UserModel;
export default _default;
//# sourceMappingURL=User.d.ts.map