"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenExpiration = exports.generateTokens = exports.extractTokenFromHeader = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("./errors");
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'contractai-api',
        audience: 'contractai-client'
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'contractai-api',
        audience: 'contractai-client'
    });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            issuer: 'contractai-api',
            audience: 'contractai-client'
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errors_1.AuthenticationError('Invalid access token');
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errors_1.AuthenticationError('Access token expired');
        }
        throw new errors_1.AuthenticationError('Token verification failed');
    }
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET, {
            issuer: 'contractai-api',
            audience: 'contractai-client'
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errors_1.AuthenticationError('Invalid refresh token');
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errors_1.AuthenticationError('Refresh token expired');
        }
        throw new errors_1.AuthenticationError('Refresh token verification failed');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader) {
        throw new errors_1.AuthenticationError('Authorization header missing');
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new errors_1.AuthenticationError('Invalid authorization header format');
    }
    return parts[1];
};
exports.extractTokenFromHeader = extractTokenFromHeader;
const generateTokens = (user) => {
    const payload = {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role
    };
    const accessToken = (0, exports.generateAccessToken)(payload);
    const refreshToken = (0, exports.generateRefreshToken)(payload);
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const getTokenExpiration = (token) => {
    const decoded = jsonwebtoken_1.default.decode(token);
    if (!decoded || !decoded.exp) {
        throw new errors_1.AuthenticationError('Invalid token format');
    }
    return new Date(decoded.exp * 1000);
};
exports.getTokenExpiration = getTokenExpiration;
//# sourceMappingURL=jwt.js.map