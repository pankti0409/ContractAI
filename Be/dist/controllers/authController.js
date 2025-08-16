"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authService_1 = __importDefault(require("../services/authService"));
const errorHandler_1 = require("../middleware/errorHandler");
const express_validator_1 = require("express-validator");
class AuthController {
    constructor() {
        this.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const { email, password, firstName, lastName } = req.body;
            const result = await authService_1.default.register({
                email,
                password,
                firstName,
                lastName
            });
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
            return res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: result.user,
                    accessToken: result.accessToken
                }
            });
        });
        this.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const { email, password } = req.body;
            const deviceInfo = req.get('User-Agent') || 'Unknown Device';
            const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';
            const result = await authService_1.default.login({
                email,
                password,
                deviceInfo,
                ipAddress
            });
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
            return res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    accessToken: result.accessToken
                }
            });
        });
        this.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }
            const deviceInfo = req.get('User-Agent') || 'Unknown Device';
            const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';
            try {
                const result = await authService_1.default.refreshAccessToken({
                    refreshToken,
                    deviceInfo,
                    ipAddress
                });
                if (!result || !result.accessToken || !result.refreshToken) {
                    console.error('Invalid result from refreshAccessToken:', result);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to refresh token'
                    });
                }
                res.cookie('refreshToken', result.refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 30 * 24 * 60 * 60 * 1000
                });
                return res.json({
                    success: true,
                    message: 'Token refreshed successfully',
                    data: {
                        accessToken: result.accessToken
                    }
                });
            }
            catch (error) {
                console.error('Error in refreshToken controller:', error);
                return res.status(401).json({
                    success: false,
                    message: 'Failed to refresh token'
                });
            }
        });
        this.logout = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
            if (refreshToken) {
                try {
                    await authService_1.default.logout(refreshToken);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.log('Logout error (non-critical):', errorMessage);
                }
            }
            res.clearCookie('refreshToken');
            res.json({
                success: true,
                message: 'Logout successful'
            });
        });
        this.logoutAll = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            await authService_1.default.logoutAll(userId);
            res.clearCookie('refreshToken');
            res.json({
                success: true,
                message: 'Logged out from all devices successfully'
            });
        });
        this.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const userId = req.user.userId;
            const { currentPassword, newPassword } = req.body;
            await authService_1.default.changePassword(userId, currentPassword, newPassword);
            res.clearCookie('refreshToken');
            return res.json({
                success: true,
                message: 'Password changed successfully. Please log in again.'
            });
        });
        this.requestPasswordReset = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const { email } = req.body;
            try {
                const result = await authService_1.default.resetPassword(email);
                return res.json({
                    success: true,
                    message: 'Password reset instructions sent to your email',
                    ...(process.env.NODE_ENV === 'development' && { resetToken: result.resetToken })
                });
            }
            catch (error) {
                return res.json({
                    success: true,
                    message: 'If this email exists, a reset link has been sent'
                });
            }
        });
        this.confirmPasswordReset = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const { resetToken, newPassword } = req.body;
            await authService_1.default.confirmPasswordReset(resetToken, newPassword);
            return res.json({
                success: true,
                message: 'Password reset successfully. Please log in with your new password.'
            });
        });
        this.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            res.json({
                success: true,
                data: {
                    user: req.user
                }
            });
        });
        this.getSessions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const sessions = await authService_1.default.getUserSessions(userId);
            res.json({
                success: true,
                data: {
                    sessions
                }
            });
        });
        this.revokeSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const { sessionId } = req.params;
            await authService_1.default.revokeSession(userId, sessionId);
            res.json({
                success: true,
                message: 'Session revoked successfully'
            });
        });
        this.verifyToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            res.json({
                success: true,
                message: 'Token is valid',
                data: {
                    user: req.user
                }
            });
        });
    }
}
exports.default = new AuthController();
//# sourceMappingURL=authController.js.map