import usersService from './users.service.js';
import ApiResponse from '../../utils/apiResponse.js';

const getProfile = async (req, res, next) => {
  try {
    const result = await usersService.getProfile(req.user.userId);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await usersService.updateProfile(req.user.userId, req.body);
    return ApiResponse.success(res, { user: result }, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const result = await usersService.updatePassword(req.user.userId, req.body);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const getAdvocateProfile = async (req, res, next) => {
  try {
    const result = await usersService.getAdvocateProfile(req.params.id);
    return ApiResponse.success(res, { advocateProfile: result });
  } catch (error) {
    next(error);
  }
};

const updateAdvocateProfile = async (req, res, next) => {
  try {
    const result = await usersService.updateAdvocateProfile(
      req.user.userId,
      req.body,
    );
    return ApiResponse.success(
      res,
      { advocateProfile: result },
      'Advocate profile updated',
    );
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
  updatePassword,
  getAdvocateProfile,
  updateAdvocateProfile,
};
