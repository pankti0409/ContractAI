import { User, JWTPayload } from '../types';
import { AuthenticationError, ValidationError, ConflictError, NotFoundError } from '../utils/errors';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import UserModel from '../models/User';
import RefreshTokenModel from '../models/RefreshToken';
import { v4 as uuidv4 } from 'uuid';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
}

class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userData = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'user' as const
    };

    const user = await UserModel.create(userData);

    // Generate tokens
    const payload: JWTPayload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 days

    await RefreshTokenModel.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiry
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password, deviceInfo, ipAddress } = data;

    // Find user with password
    const user = await UserModel.findByEmailWithPassword(email.toLowerCase().trim());
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    if (!user.passwordHash) {
      throw new AuthenticationError('Invalid credentials');
    }
    
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login
    await UserModel.updateLastLogin(user.id);

    // Generate tokens
    const payload: JWTPayload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 days

    await RefreshTokenModel.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
      deviceInfo,
      ipAddress
    });

    // Clean up old tokens (keep only 5 most recent)
    await RefreshTokenModel.deleteOldTokensForUser(user.id, 5);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  }

  async refreshAccessToken(data: RefreshTokenRequest): Promise<{ accessToken: string; refreshToken: string }> {
    if (!data) {
      throw new AuthenticationError('Refresh token data is required');
    }
    
    const { refreshToken, deviceInfo, ipAddress } = data;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required');
    }

    // Verify refresh token
    const tokenData = await RefreshTokenModel.findByToken(refreshToken);
    if (!tokenData) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // Get user
    const user = await UserModel.findById(tokenData.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Update token last used
    await RefreshTokenModel.updateLastUsed(refreshToken);

    // Generate new access token
    const payload: JWTPayload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const newAccessToken = generateAccessToken(payload);

    // Optionally generate new refresh token (token rotation)
    const newRefreshToken = generateRefreshToken(payload);
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

    // Create new refresh token
    await RefreshTokenModel.create({
      userId: user.id,
      token: newRefreshToken,
      expiresAt: refreshTokenExpiry,
      deviceInfo,
      ipAddress
    });

    // Delete old refresh token
    await RefreshTokenModel.deleteByToken(refreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      await RefreshTokenModel.deleteByToken(refreshToken);
    } catch (error) {
      // Don't throw error if token doesn't exist
      if (!(error instanceof NotFoundError)) {
        throw error;
      }
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await RefreshTokenModel.deleteByUserId(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user with password
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const userWithPassword = await UserModel.findByEmailWithPassword(user.email);
    if (!userWithPassword) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    if (!userWithPassword.passwordHash) {
      throw new ValidationError('User password not found');
    }
    
    const isCurrentPasswordValid = await comparePassword(currentPassword, userWithPassword.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new ValidationError(`New password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await UserModel.update(userId, { password: hashedNewPassword });

    // Revoke all refresh tokens to force re-login
    await RefreshTokenModel.revokeAllUserTokens(userId);
  }

  async resetPassword(email: string): Promise<{ resetToken: string }> {
    const user = await UserModel.findByEmail(email.toLowerCase().trim());
    if (!user) {
      // Don't reveal if email exists or not
      throw new NotFoundError('If this email exists, a reset link has been sent');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Generate reset token (in a real app, this would be sent via email)
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

    // Store reset token (you might want to create a separate table for this)
    // For now, we'll use the refresh token table with a special device info
    await RefreshTokenModel.create({
      userId: user.id,
      token: resetToken,
      expiresAt: resetTokenExpiry,
      deviceInfo: 'PASSWORD_RESET'
    });

    return { resetToken };
  }

  async confirmPasswordReset(resetToken: string, newPassword: string): Promise<void> {
    // Find reset token
    const tokenData = await RefreshTokenModel.findByToken(resetToken);
    if (!tokenData || tokenData.deviceInfo !== 'PASSWORD_RESET') {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await UserModel.update(tokenData.userId, { password: hashedPassword });

    // Delete reset token
    await RefreshTokenModel.deleteByToken(resetToken);

    // Revoke all other refresh tokens
    await RefreshTokenModel.revokeAllUserTokens(tokenData.userId);
  }

  async getUserSessions(userId: string): Promise<Array<{ id: string; deviceInfo?: string; ipAddress?: string; createdAt: Date; lastUsed?: Date }>> {
    const tokens = await RefreshTokenModel.findByUserId(userId);
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

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const tokens = await RefreshTokenModel.findByUserId(userId);
    const token = tokens.find(t => t.id === sessionId);
    
    if (!token) {
      throw new NotFoundError('Session not found');
    }

    await RefreshTokenModel.deleteByToken(token.token);
  }

  async cleanupExpiredTokens(): Promise<number> {
    return await RefreshTokenModel.cleanupExpiredTokens();
  }
}

export default new AuthService();