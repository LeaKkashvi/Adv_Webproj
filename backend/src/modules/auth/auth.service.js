import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../../models/User.js';
import AdvocateProfile from '../../models/AdvocateProfile.js';
import config from '../../config/env.js';
import ApiError from '../../utils/apiError.js';
import logger from '../../utils/logger.js';
import { sendEmail, emailTemplates } from '../../utils/mailer.js';

const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const registerClient = async ({ name, username, email, phone, password, countryOfResidence }) => {
  const existingUser = await User.findOne({ $or: [{ email }, { phone }, { username }] });
  if (existingUser) {
    if (existingUser.email === email) {
      throw ApiError.conflict('Email already registered');
    }
    if (existingUser.phone === phone) {
      throw ApiError.conflict('Phone number already registered');
    }
    throw ApiError.conflict('Username already taken');
  }

  const user = await User.create({
    name,
    username,
    email,
    phone,
    password,
    role: 'client',
    countryOfResidence: countryOfResidence || '',
  });

  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = hashToken(verificationToken);
  user.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  try {
    const template = emailTemplates.verifyEmail(verificationToken);
    await sendEmail({ to: email, subject: template.subject, html: template.html });
  } catch (err) {
    logger.warn('Verification email failed to send:', err.message);
  }

  return { message: 'Registration successful. Please verify your email.' };
};

const registerAdvocate = async ({ name, username, email, phone, password, barCouncilNumber, stateBarCouncil }) => {
  const existingUser = await User.findOne({ $or: [{ email }, { phone }, { username }] });
  if (existingUser) {
    if (existingUser.email === email) {
      throw ApiError.conflict('Email already registered');
    }
    if (existingUser.phone === phone) {
      throw ApiError.conflict('Phone number already registered');
    }
    throw ApiError.conflict('Username already taken');
  }

  const existingAdvocate = await AdvocateProfile.findOne({ barCouncilNumber });
  if (existingAdvocate) {
    throw ApiError.conflict('Bar council number already registered');
  }

  const user = await User.create({
    name,
    username,
    email,
    phone,
    password,
    role: 'advocate',
  });

  await AdvocateProfile.create({
    userId: user._id,
    barCouncilNumber,
    stateBarCouncil,
    verificationStatus: 'pending',
  });

  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = hashToken(verificationToken);
  user.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  try {
    const template = emailTemplates.verifyEmail(verificationToken);
    await sendEmail({ to: email, subject: template.subject, html: template.html });
  } catch (err) {
    logger.warn('Verification email failed to send:', err.message);
  }

  return { message: 'Registration successful. Please verify your email.' };
};

const login = async ({ email, password }, res) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.accountStatus !== 'active') {
    throw ApiError.forbidden('Account is not active');
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  const hashedRefreshToken = hashToken(refreshToken);

  user.refreshTokens.push({ token: hashedRefreshToken });
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  let advocateProfile = null;
  if (user.role === 'advocate') {
    advocateProfile = await AdvocateProfile.findOne({ userId: user._id });
  }

  return {
    user: user.toProfileJSON(),
    advocateProfile: advocateProfile ? advocateProfile.toProfileJSON() : null,
    accessToken,
  };
};

const refreshAccessToken = async (refreshToken, res) => {
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token required');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.userId).select('+refreshTokens');
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  const hashedToken = hashToken(refreshToken);
  const tokenIndex = user.refreshTokens.findIndex((t) => t.token === hashedToken);
  if (tokenIndex === -1) {
    throw ApiError.unauthorized('Refresh token has been revoked');
  }

  user.refreshTokens.splice(tokenIndex, 1);

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);
  const newHashedRefreshToken = hashToken(newRefreshToken);

  user.refreshTokens.push({ token: newHashedRefreshToken });
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken: newAccessToken };
};

const logout = async (userId, refreshToken, res) => {
  if (refreshToken) {
    const user = await User.findById(userId).select('+refreshTokens');
    if (user) {
      const hashedToken = hashToken(refreshToken);
      user.refreshTokens = user.refreshTokens.filter((t) => t.token !== hashedToken);
      await user.save({ validateBeforeSave: false });
    }
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
  });

  return { message: 'Logged out successfully' };
};

const verifyEmail = async (token) => {
  const hashedToken = hashToken(token);
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return { message: 'Email verified successfully' };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    return { message: 'If the email exists, a reset link has been sent' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetExpiry = Date.now() + 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  try {
    const template = emailTemplates.forgotPassword(resetToken);
    await sendEmail({ to: email, subject: template.subject, html: template.html });
  } catch (err) {
    logger.warn('Password reset email failed to send:', err.message);
  }

  return { message: 'If the email exists, a reset link has been sent' };
};

const resetPassword = async (token, newPassword) => {
  const hashedToken = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  }).select('+password');

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  user.refreshTokens = [];
  await user.save();

  return { message: 'Password reset successful. Please login with your new password.' };
};

export default {
  registerClient,
  registerAdvocate,
  login,
  refreshAccessToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
