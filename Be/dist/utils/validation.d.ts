import { ValidationChain } from 'express-validator';
export declare const validateUserRegistration: ValidationChain[];
export declare const validateUserLogin: ValidationChain[];
export declare const validateChatCreation: ValidationChain[];
export declare const validateChatUpdate: ValidationChain[];
export declare const validatePasswordChange: ValidationChain[];
export declare const validatePasswordReset: ValidationChain[];
export declare const validatePasswordResetConfirm: ValidationChain[];
export declare const validateMessageCreation: ValidationChain[];
export declare const validateMessageUpdate: ValidationChain[];
export declare const validateFileUpload: ValidationChain[];
export declare const validateMultipleFileUpload: ValidationChain[];
export declare const validateUUIDParam: (paramName: string) => ValidationChain;
export declare const validatePagination: ValidationChain[];
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidUUID: (uuid: string) => boolean;
export declare const isValidFileType: (mimeType: string) => boolean;
export declare const isValidFileSize: (size: number) => boolean;
//# sourceMappingURL=validation.d.ts.map