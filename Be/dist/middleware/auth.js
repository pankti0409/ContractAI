"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOwnership = exports.optionalAuth = exports.requireAdmin = exports.requireRole = exports.requireAuth = exports.authenticateToken = void 0;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const authenticateToken = async (req, res, next) => {
    try {
        console.log('Auth header:', req.headers.authorization);
        const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
        console.log('Extracted token:', token?.substring(0, 50) + '...');
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        console.log('Token decoded successfully:', decoded.email);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.log('Authentication error:', error instanceof Error ? error.message : error);
        next(error);
    }
};
exports.authenticateToken = authenticateToken;
const requireAuth = (req, res, next) => {
    if (!req.user) {
        throw new errors_1.AuthenticationError('Authentication required');
    }
    next();
};
exports.requireAuth = requireAuth;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new errors_1.AuthenticationError('Authentication required');
        }
        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (!allowedRoles.includes(userRole)) {
            throw new errors_1.AuthorizationError('Insufficient permissions');
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)('admin');
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            req.user = decoded;
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const requireOwnership = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            throw new errors_1.AuthenticationError('Authentication required');
        }
        if (req.user.role === 'admin') {
            return next();
        }
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        if (resourceUserId && resourceUserId !== req.user.userId) {
            throw new errors_1.AuthorizationError('Access denied: You can only access your own resources');
        }
        next();
    };
};
exports.requireOwnership = requireOwnership;
//# sourceMappingURL=auth.js.map