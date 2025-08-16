import { AppError } from '../types';
export declare class CustomError extends Error implements AppError {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number, isOperational?: boolean);
}
export declare class ValidationError extends CustomError {
    constructor(message: string);
}
export declare class AuthenticationError extends CustomError {
    constructor(message?: string);
}
export declare class AuthorizationError extends CustomError {
    constructor(message?: string);
}
export declare class NotFoundError extends CustomError {
    constructor(message?: string);
}
export declare class ConflictError extends CustomError {
    constructor(message?: string);
}
export declare class InternalServerError extends CustomError {
    constructor(message?: string);
}
export declare class DatabaseError extends CustomError {
    constructor(message?: string);
}
export declare const handleAsyncError: (fn: Function) => (req: any, res: any, next: any) => void;
//# sourceMappingURL=errors.d.ts.map