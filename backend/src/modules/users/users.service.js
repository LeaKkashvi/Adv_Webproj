import User from '../../models/User.js';
import AdvocateProfile from '../../models/AdvocateProfile.js';
import ApiError from '../../utils/apiError.js';
import logger from '../../utils/logger.js';

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  let advocateProfile = null;
  if (user.role === 'advocate') {
    advocateProfile = await AdvocateProfile.findOne({ userId });
  }

  return {
    user: user.toProfileJSON(),
    advocateProfile: advocateProfile ? advocateProfile.toProfileJSON() : null,
  };
};

const updateProfile = async (userId, updates) => {
  const allowedFields = ['name', 'countryOfResidence', 'currentAddress', 'indianAddress', 'profilePhotoUrl'];
  const filteredUpdates = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  logger.info(`Profile updated for user: ${userId}`);
  return user.toProfileJSON();
};

const updatePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  logger.info(`Password updated for user: ${userId}`);
  return { message: 'Password updated successfully. Please login again.' };
};

const getAdvocateProfile = async (advocateId) => {
  const profile = await AdvocateProfile.findById(advocateId).populate(
    'userId',
    'name email profilePhotoUrl',
  );

  if (!profile) {
    throw ApiError.notFound('Advocate profile not found');
  }

  return profile.toProfileJSON();
};

const updateAdvocateProfile = async (userId, updates) => {
  const profile = await AdvocateProfile.findOne({ userId });
  if (!profile) {
    throw ApiError.notFound('Advocate profile not found');
  }

  const allowedFields = [
    'bio',
    'yearsOfExperience',
    'specializations',
    'languagesSpoken',
    'courtJurisdictions',
    'education',
    'serviceOfferings',
    'availability',
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      profile[field] = updates[field];
    }
  }

  await profile.save();
  logger.info(`Advocate profile updated for user: ${userId}`);
  return profile.toProfileJSON();
};

export default {
  getProfile,
  updateProfile,
  updatePassword,
  getAdvocateProfile,
  updateAdvocateProfile,
};
