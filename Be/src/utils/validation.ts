import { body, param, query, ValidationChain } from 'express-validator';

// User validation rules
export const validateUserRegistration: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required and must be less than 100 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required and must be less than 100 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Company name must be less than 255 characters')
];

export const validateUserLogin: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Chat validation rules
export const validateChatCreation: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Chat title must be between 1 and 255 characters')
];

export const validateChatUpdate: ValidationChain[] = [
  param('chatId')
    .isUUID()
    .withMessage('Invalid chat ID format'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Chat title must be between 1 and 255 characters')
];

// Message validation rules
// Password validation rules
export const validatePasswordChange: ValidationChain[] = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

export const validatePasswordReset: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

export const validatePasswordResetConfirm: ValidationChain[] = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

export const validateMessageCreation: ValidationChain[] = [
  body('chatId')
    .isUUID()
    .withMessage('Invalid chat ID format'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Message content must be between 1 and 10000 characters'),
  body('messageType')
    .isIn(['user', 'assistant'])
    .withMessage('Message type must be either "user" or "assistant"'),
  body('files')
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

export const validateMessageUpdate: ValidationChain[] = [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Message content must be between 1 and 10000 characters')
];

// File validation rules
export const validateFileUpload = [
  body('chatId')
    .optional()
    .isUUID()
    .withMessage('Invalid chat ID format')
];

export const validateMultipleFileUpload = [
  body('chatId')
    .optional()
    .isUUID()
    .withMessage('Invalid chat ID format'),
  body('files')
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

// Common parameter validations
export const validateUUIDParam = (paramName: string): ValidationChain => {
  return param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName} format`);
};

// Pagination validation
export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sort field must be a valid string'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Sort order must be either ASC or DESC')
];

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// UUID validation
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// File type validation
export const isValidFileType = (mimeType: string): boolean => {
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

// File size validation
export const isValidFileSize = (size: number): boolean => {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
  return size <= maxSize;
};