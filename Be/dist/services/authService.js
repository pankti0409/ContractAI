"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../utils/errors");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const uuid_1 = require("uuid");
class AuthService {
    async register(data) {
        const { email, password, firstName, lastName } = data;
        const passwordValidation = (0, password_1.validatePasswordStrength)(password);
        if (!passwordValidation.isValid) {
            throw new errors_1.ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
        }
        const existingUser = await User_1.default.findByEmail(email);
        if (existingUser) {
            throw new errors_1.ConflictError('User with this email already exists');
        }
        const hashedPassword = await (0, password_1.hashPassword)(password);
        const userData = {
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: 'user'
        };
        const user = await User_1.default.create(userData);
        const payload = {
            id: user.id,
            userId: user.id,
            email: user.email,
            role: user.role
        };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);
        await RefreshToken_1.default.create({
            userId: user.id,
            token: refreshToken,
            expiresAt: refreshTokenExpiry
        });
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken
        };
    }
    async login(data) {
        const { email, password, deviceInfo, ipAddress } = data;
        const user = await User_1.default.findByEmailWithPassword(email.toLowerCase().trim());
        if (!user) {
            throw new errors_1.AuthenticationError('Invalid email or password');
        }
        if (!user.isActive) {
            throw new errors_1.AuthenticationError('Account is deactivated');
        }
        if (!user.passwordHash) {
            throw new errors_1.AuthenticationError('Invalid credentials');
        }
        const isPasswordValid = await (0, password_1.comparePassword)(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new errors_1.AuthenticationError('Invalid email or password');
        }
        await User_1.default.updateLastLogin(user.id);
        const payload = {
            id: user.id,
            userId: user.id,
            email: user.email,
            role: user.role
        };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);
        await RefreshToken_1.default.create({
            userId: user.id,
            token: refreshToken,
            expiresAt: refreshTokenExpiry,
            deviceInfo,
            ipAddress
        });
        await RefreshToken_1.default.deleteOldTokensForUser(user.id, 5);
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken
        };
    }
    async refreshAccessToken(data) {
        if (!data) {
            throw new errors_1.AuthenticationError('Refresh token data is required');
        }
        const { refreshToken, deviceInfo, ipAddress } = data;
        if (!refreshToken) {
            throw new errors_1.AuthenticationError('Refresh token is required');
        }
        const tokenData = await RefreshToken_1.default.findByToken(refreshToken);
        if (!tokenData) {
            throw new errors_1.AuthenticationError('Invalid or expired refresh token');
        }
        const user = await User_1.default.findById(tokenData.userId);
        if (!user || !user.isActive) {
            throw new errors_1.AuthenticationError('User not found or inactive');
        }
        await RefreshToken_1.default.updateLastUsed(refreshToken);
        const payload = {
            id: user.id,
            userId: user.id,
            email: user.email,
            role: user.role
        };
        const newAccessToken = (0, jwt_1.generateAccessToken)(payload);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(payload);
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);
        await RefreshToken_1.default.create({
            userId: user.id,
            token: newRefreshToken,
            expiresAt: refreshTokenExpiry,
            deviceInfo,
            ipAddress
        });
        await RefreshToken_1.default.deleteByToken(refreshToken);
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    }
    async logout(refreshToken) {
        try {
            await RefreshToken_1.default.deleteByToken(refreshToken);
        }
        catch (error) {
            if (!(error instanceof errors_1.NotFoundError)) {
                throw error;
            }
        }
    }
    async logoutAll(userId) {
        await RefreshToken_1.default.deleteByUserId(userId);
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await User_1.default.findById(userId);
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        const userWithPassword = await User_1.default.findByEmailWithPassword(user.email);
        if (!userWithPassword) {
            throw new errors_1.NotFoundError('User not found');
        }
        if (!userWithPassword.passwordHash) {
            throw new errors_1.ValidationError('User password not found');
        }
        const isCurrentPasswordValid = await (0, password_1.comparePassword)(currentPassword, userWithPassword.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new errors_1.AuthenticationError('Current password is incorrect');
        }
        const passwordValidation = (0, password_1.validatePasswordStrength)(newPassword);
        if (!passwordValidation.isValid) {
            throw new errors_1.ValidationError(`New password validation failed: ${passwordValidation.errors.join(', ')}`);
        }
        const hashedNewPassword = await (0, password_1.hashPassword)(newPassword);
        await User_1.default.update(userId, { password: hashedNewPassword });
        await RefreshToken_1.default.revokeAllUserTokens(userId);
    }
    async resetPassword(email) {
        const user = await User_1.default.findByEmail(email.toLowerCase().trim());
        if (!user) {
            throw new errors_1.NotFoundError('If this email exists, a reset link has been sent');
        }
        if (!user.isActive) {
            throw new errors_1.AuthenticationError('Account is deactivated');
        }
        const resetToken = (0, uuid_1.v4)();
        const resetTokenExpiry = new Date();
        resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);
        await RefreshToken_1.default.create({
            userId: user.id,
            token: resetToken,
            expiresAt: resetTokenExpiry,
            deviceInfo: 'PASSWORD_RESET'
        });
        return { resetToken };
    }
    async confirmPasswordReset(resetToken, newPassword) {
        const tokenData = await RefreshToken_1.default.findByToken(resetToken);
        if (!tokenData || tokenData.deviceInfo !== 'PASSWORD_RESET') {
            throw new errors_1.AuthenticationError('Invalid or expired reset token');
        }
        const passwordValidation = (0, password_1.validatePasswordStrength)(newPassword);
        if (!passwordValidation.isValid) {
            throw new errors_1.ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
        }
        const hashedPassword = await (0, password_1.hashPassword)(newPassword);
        await User_1.default.update(tokenData.userId, { password: hashedPassword });
        await RefreshToken_1.default.deleteByToken(resetToken);
        await RefreshToken_1.default.revokeAllUserTokens(tokenData.userId);
    }
    async getUserSessions(userId) {
        const tokens = await RefreshToken_1.default.findByUserId(userId);
        return tokens
            .filter(token => token.deviceInfo !== 'PASSWORD_RESET')
            .map(token => ({
            id: token.id,
            deviceInfo: token.deviceInfo,
            ipAddress: token.ipAddress,
            createdAt: token.createdAt,
            lastUsed: token.lastUsed
        }));
    }
    async revokeSession(userId, sessionId) {
        const tokens = await RefreshToken_1.default.findByUserId(userId);
        const token = tokens.find(t => t.id === sessionId);
        if (!token) {
            throw new errors_1.NotFoundError('Session not found');
        }
        await RefreshToken_1.default.deleteByToken(token.token);
    }
    async cleanupExpiredTokens() {
        return await RefreshToken_1.default.cleanupExpiredTokens();
    }
}
exports.default = new AuthService();
//# sourceMappingURL=authService.js.map