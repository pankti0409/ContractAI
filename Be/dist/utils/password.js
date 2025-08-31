"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordStrength = exports.comparePassword = exports.hashPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const hashPassword = async (password) => {
    try {
        const salt = crypto_1.default.randomBytes(16).toString('hex');
        const hash = crypto_1.default.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }
    catch (error) {
        throw new Error('Password hashing failed');
    }
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hashedPassword) => {
    try {
        if (hashedPassword.includes(':')) {
            const [salt, hash] = hashedPassword.split(':');
            if (!salt || !hash) {
                return false;
            }
            const hashToCompare = crypto_1.default.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
            return hash === hashToCompare;
        }
        else {
            return false;
        }
    }
    catch (error) {
        throw new Error('Password comparison failed');
    }
};
exports.comparePassword = comparePassword;
const validatePasswordStrength = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
        errors.push('Password must be less than 128 characters long');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    const commonPasswords = [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Password is too common and easily guessable');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validatePasswordStrength = validatePasswordStrength;
//# sourceMappingURL=password.js.map