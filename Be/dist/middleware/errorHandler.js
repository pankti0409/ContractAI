"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.globalErrorHandler = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const errors_1 = require("../utils/errors");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        const response = {
            success: false,
            error: 'Validation failed',
            message: errorMessages.join(', ')
        };
        res.status(400).json(response);
        return;
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
const globalErrorHandler = (error, req, res, next) => {
    console.error('Error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    let statusCode = 500;
    let message = 'Internal server error';
    let isOperational = false;
    if (error instanceof errors_1.CustomError) {
        statusCode = error.statusCode;
        message = error.message;
        isOperational = error.isOperational;
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        isOperational = true;
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        isOperational = true;
    }
    else if (error.name === 'QueryFailedError' || error.code === '23505') {
        statusCode = 409;
        message = 'Resource already exists';
        isOperational = true;
    }
    else if (error.code === '23503') {
        statusCode = 400;
        message = 'Referenced resource does not exist';
        isOperational = true;
    }
    else if (error.code === '23502') {
        statusCode = 400;
        message = 'Required field is missing';
        isOperational = true;
    }
    else if (error.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        message = 'File too large';
        isOperational = true;
    }
    else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = 400;
        message = 'Unexpected file field';
        isOperational = true;
    }
    const response = {
        success: false,
        error: message
    };
    if (process.env.NODE_ENV === 'development' && isOperational) {
        response.message = error.stack;
    }
    res.status(statusCode).json(response);
    if (!isOperational) {
        console.error('Non-operational error occurred. Consider restarting the application.');
    }
};
exports.globalErrorHandler = globalErrorHandler;
const notFoundHandler = (req, res, next) => {
    const response = {
        success: false,
        error: `Route ${req.method} ${req.originalUrl} not found`
    };
    res.status(404).json(response);
};
exports.notFoundHandler = notFoundHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map