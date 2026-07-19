import authService from './auth.service.js';
import ApiResponse from '../../utils/apiResponse.js';

const registerClient = async (req, res, next) => {
  try {
    const result = await authService.registerClient(req.body);
    return ApiResponse.created(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const registerAdvocate = async (req, res, next) => {
  try {
    const result = await authService.registerAdvocate(req.body);
    return ApiResponse.created(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body, res);
    return ApiResponse.success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const result = await authService.refreshAccessToken(refreshToken, res);
    return ApiResponse.success(res, result, 'Token refreshed');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const result = await authService.logout(req.user.userId, refreshToken, res);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const result = await authService.verifyEmail(token);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
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
