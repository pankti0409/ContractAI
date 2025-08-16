"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidFileSize = exports.isValidFileType = exports.isValidUUID = exports.isValidEmail = exports.validatePagination = exports.validateUUIDParam = exports.validateMultipleFileUpload = exports.validateFileUpload = exports.validateMessageUpdate = exports.validateMessageCreation = exports.validatePasswordResetConfirm = exports.validatePasswordReset = exports.validatePasswordChange = exports.validateChatUpdate = exports.validateChatCreation = exports.validateUserLogin = exports.validateUserRegistration = void 0;
const express_validator_1 = require("express-validator");
exports.validateUserRegistration = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    (0, express_validator_1.body)('firstName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('First name is required and must be less than 100 characters'),
    (0, express_validator_1.body)('lastName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Last name is required and must be less than 100 characters'),
    (0, express_validator_1.body)('company')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Company name must be less than 255 characters')
];
exports.validateUserLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required')
];
exports.validateChatCreation = [
    (0, express_validator_1.body)('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Chat title must be between 1 and 255 characters')
];
exports.validateChatUpdate = [
    (0, express_validator_1.param)('chatId')
        .isUUID()
        .withMessage('Invalid chat ID format'),
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Chat title must be between 1 and 255 characters')
];
exports.validatePasswordChange = [
    (0, express_validator_1.body)('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8, max: 128 })
        .withMessage('New password must be between 8 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];
exports.validatePasswordReset = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
];
exports.validatePasswordResetConfirm = [
    (0, express_validator_1.body)('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 8, max: 128 })
        .withMessage('New password must be between 8 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];
exports.validateMessageCreation = [
    (0, express_validator_1.body)('chatId')
        .isUUID()
        .withMessage('Invalid chat ID format'),
    (0, express_validator_1.body)('content')
        .trim()
        .isLength({ min: 1, max: 10000 })
        .withMessage('Message content must be between 1 and 10000 characters'),
    (0, express_validator_1.body)('messageType')
        .isIn(['user', 'assistant'])
        .withMessage('Message type must be either "user" or "assistant"'),
    (0, express_validator_1.body)('files')
        .optional()
        .isArray()
        .withMessage('Files must be an array')
        .custom((files) => {
        if (files && files.length > 0) {
            for (const fileId of files) {
                if (typeof fileId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(fileId)) {
                    throw new Error('Each file ID must be a valid UUID');
                }
            }
        }
        return true;
    })
];
exports.validateMessageUpdate = [
    (0, express_validator_1.body)('content')
        .optional()
        .trim()
        .isLength({ min: 1, max: 10000 })
        .withMessage('Message content must be between 1 and 10000 characters')
];
exports.validateFileUpload = [
    (0, express_validator_1.body)('chatId')
        .optional()
        .isUUID()
        .withMessage('Invalid chat ID format')
];
exports.validateMultipleFileUpload = [
    (0, express_validator_1.body)('chatId')
        .optional()
        .isUUID()
        .withMessage('Invalid chat ID format'),
    (0, express_validator_1.body)('files')
        .optional()
        .isArray()
        .withMessage('Files must be an array')
        .custom((files) => {
        if (files && files.length > 10) {
            throw new Error('Maximum 10 files allowed per upload');
        }
        return true;
    })
];
const validateUUIDParam = (paramName) => {
    return (0, express_validator_1.param)(paramName)
        .isUUID()
        .withMessage(`Invalid ${paramName} format`);
};
exports.validateUUIDParam = validateUUIDParam;
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('Sort field must be a valid string'),
    (0, express_validator_1.query)('sortOrder')
        .optional()
        .isIn(['ASC', 'DESC'])
        .withMessage('Sort order must be either ASC or DESC')
];
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
exports.isValidUUID = isValidUUID;
const isValidFileType = (mimeType) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif'
    ];
    return allowedTypes.includes(mimeType);
};
exports.isValidFileType = isValidFileType;
const isValidFileSize = (size) => {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
    return size <= maxSize;
};
exports.isValidFileSize = isValidFileSize;
//# sourceMappingURL=validation.js.map