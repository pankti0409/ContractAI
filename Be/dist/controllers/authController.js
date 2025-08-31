"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authService_1 = __importDefault(require("../services/authService"));
const userSessionService_1 = __importDefault(require("../services/userSessionService"));
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
            const sessionInfo = userSessionService_1.default.extractSessionInfo(req);
            const userSession = await userSessionService_1.default.createSession(result.user.id, sessionInfo);
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
            res.cookie('sessionToken', userSession.sessionToken, {
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
                    accessToken: result.accessToken,
                    sessionToken: userSession.sessionToken
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
            const sessionInfo = userSessionService_1.default.extractSessionInfo(req);
            const userSession = await userSessionService_1.default.createSession(result.user.id, sessionInfo);
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
            res.cookie('sessionToken', userSession.sessionToken, {
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
                    accessToken: result.accessToken,
                    sessionToken: userSession.sessionToken
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
            const sessionToken = req.cookies.sessionToken || req.body.sessionToken;
            if (refreshToken) {
                try {
                    await authService_1.default.logout(refreshToken);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.log('Logout error (non-critical):', errorMessage);
                }
            }
            if (sessionToken) {
                try {
                    await userSessionService_1.default.logoutSession(sessionToken);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.log('Session logout error (non-critical):', errorMessage);
                }
            }
            res.clearCookie('refreshToken');
            res.clearCookie('sessionToken');
            return res.json({
                success: true,
                message: 'Logout successful'
            });
        });
        this.logoutAll = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            await authService_1.default.logoutAll(userId);
            await userSessionService_1.default.logoutAllSessions(userId);
            res.clearCookie('refreshToken');
            res.clearCookie('sessionToken');
            return res.json({
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
            return res.json({
                success: true,
                data: {
                    user: req.user
                }
            });
        });
        this.getSessions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.userId;
            const sessions = await authService_1.default.getUserSessions(userId);
            return res.json({
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
            return res.json({
                success: true,
                message: 'Session revoked successfully'
            });
        });
        this.verifyToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            return res.json({
                success: true,
                message: 'Token is valid',
                data: {
                    user: req.user
                }
            });
        });
        this.validateSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const sessionToken = req.cookies.sessionToken || req.body.sessionToken || req.headers['x-session-token'];
            if (!sessionToken) {
                return res.status(401).json({
                    success: false,
                    message: 'No session token provided'
                });
            }
            const sessionWithUser = await userSessionService_1.default.getSessionWithUser(sessionToken);
            if (!sessionWithUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired session'
                });
            }
            return res.json({
                success: true,
                message: 'Session is valid',
                data: {
                    user: sessionWithUser.user,
                    session: {
                        id: sessionWithUser.id,
                        deviceInfo: sessionWithUser.deviceInfo,
                        lastAccessed: sessionWithUser.lastAccessed,
                        expiresAt: sessionWithUser.expiresAt
                    }
                }
            });
        });
        this.getSessionInfo = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const sessionToken = req.cookies.sessionToken || req.body.sessionToken || req.headers['x-session-token'];
            if (!sessionToken) {
                return res.status(401).json({
                    success: false,
                    message: 'No session token provided'
                });
            }
            const session = await userSessionService_1.default.validateSession(sessionToken);
            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired session'
                });
            }
            const sessionStats = await userSessionService_1.default.getSessionStats(session.userId);
            return res.json({
                success: true,
                message: 'Session information retrieved',
                data: {
                    session: {
                        id: session.id,
                        deviceInfo: session.deviceInfo,
                        ipAddress: session.ipAddress,
                        lastAccessed: session.lastAccessed,
                        expiresAt: session.expiresAt,
                        createdAt: session.createdAt
                    },
                    stats: sessionStats
                }
            });
        });
    }
}
exports.default = new AuthController();
//# sourceMappingURL=authController.js.map