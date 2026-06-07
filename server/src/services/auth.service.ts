import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, UserDocument } from '../models/User';
import { generateToken, generateRefreshToken } from '../middleware/auth';
import { IAuthPayload } from '../types';
import logger from '../config/logger';

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    department: string;
  }) {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      ...data,
      email: data.email.toLowerCase(),
      password: hashedPassword,
    });

    const payload: IAuthPayload = {
      userId: (user._id as unknown as string),
      email: user.email,
      role: user.role,
    };

    return {
      user: user.toJSON(),
      token: generateToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    const payload: IAuthPayload = {
      userId: (user._id as unknown as string),
      email: user.email,
      role: user.role,
    };

    logger.info(`User logged in: ${user.email}`);

    return {
      user: user.toJSON(),
      token: generateToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  async refreshToken(token: string) {
    const config = (await import('../config/secrets')).default;
    const jwt = (await import('jsonwebtoken')).default;
    
    const decoded = jwt.verify(token, config.jwtRefreshSecret) as IAuthPayload;
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new Error('Invalid refresh token');
    }

    const payload: IAuthPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    return {
      token: generateToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  async forgotPassword(email: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return; // Don't reveal if user exists
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    logger.info(`Password reset requested for: ${user.email}`);

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`Password reset successful for: ${user.email}`);
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    return user.toJSON();
  }

  async updateProfile(userId: string, data: Partial<UserDocument>) {
    const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });
    if (!user) throw new Error('User not found');
    return user.toJSON();
  }
}

export default new AuthService();
