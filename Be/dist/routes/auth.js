"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_1 = require("../utils/validation");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});
const strictAuthLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
});
router.post('/register', authLimiter, validation_1.validateUserRegistration, errorHandler_1.handleValidationErrors, authController_1.default.register);
router.post('/login', authLimiter, validation_1.validateUserLogin, errorHandler_1.handleValidationErrors, authController_1.default.login);
router.post('/refresh', authLimiter, authController_1.default.refreshToken);
router.post('/logout', authController_1.default.logout);
router.post('/forgot-password', strictAuthLimiter, validation_1.validatePasswordReset, errorHandler_1.handleValidationErrors, authController_1.default.requestPasswordReset);
router.post('/reset-password', strictAuthLimiter, validation_1.validatePasswordResetConfirm, errorHandler_1.handleValidationErrors, authController_1.default.confirmPasswordReset);
router.get('/verify', auth_1.optionalAuth, authController_1.default.verifyToken);
router.get('/profile', auth_1.authenticateToken, auth_1.requireAuth, authController_1.default.getProfile);
router.post('/change-password', auth_1.authenticateToken, auth_1.requireAuth, strictAuthLimiter, validation_1.validatePasswordChange, errorHandler_1.handleValidationErrors, authController_1.default.changePassword);
router.post('/logout-all', auth_1.authenticateToken, auth_1.requireAuth, authController_1.default.logoutAll);
router.get('/sessions', auth_1.authenticateToken, auth_1.requireAuth, authController_1.default.getSessions);
router.delete('/sessions/:sessionId', auth_1.authenticateToken, auth_1.requireAuth, authController_1.default.revokeSession);
exports.default = router;
//# sourceMappingURL=auth.js.map