import { hashPassword, comparePassword } from '../utils/hash';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';
import { users, refreshTokens, findUserByEmail } from '../db/memory-store';
import { v4 as uuidv4 } from 'uuid';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const { email, password } = credentials;

    const user = findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const tokenId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    refreshTokens.set(tokenId, {
      id: tokenId,
      userId: user.id,
      token: refreshToken,
      expiresAt,
      isRevoked: false,
      createdAt: new Date(),
    });

    user.lastLogin = new Date();

    logger.info({ userId: user.id, email: user.email }, 'User logged in');

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyRefreshToken(refreshToken);

    const storedToken = Array.from(refreshTokens.values()).find(
      (t) => t.userId === payload.userId && !t.isRevoked && t.expiresAt > new Date()
    );

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    const tokenId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    refreshTokens.set(tokenId, {
      id: tokenId,
      userId: payload.userId,
      token: newRefreshToken,
      expiresAt,
      isRevoked: false,
      createdAt: new Date(),
    });

    storedToken.isRevoked = true;

    logger.info({ userId: payload.userId }, 'Token refreshed');

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string): Promise<void> {
    Array.from(refreshTokens.values())
      .filter((t) => t.userId === userId)
      .forEach((t) => {
        t.isRevoked = true;
      });

    logger.info({ userId }, 'User logged out');
  }

  async register(userData: {
    email: string;
    password: string;
    role: string;
    firstName?: string;
    lastName?: string;
  }) {
    const existingUser = findUserByEmail(userData.email);

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    const passwordHash = await hashPassword(userData.password);
    const userId = uuidv4();

    const user = {
      id: userId,
      email: userData.email,
      passwordHash,
      role: userData.role,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
    };

    users.set(userId, user);

    logger.info({ userId, email: user.email }, 'User registered');

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    };
  }
}

export default new AuthService();
