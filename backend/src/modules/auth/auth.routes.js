import { Router } from 'express';
import authController from './auth.controller.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';
import {
  registerClientSchema,
  registerAdvocateSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validators.js';

const router = Router();

router.post(
  '/register/client',
  validate(registerClientSchema),
  authController.registerClient,
);

router.post(
  '/register/advocate',
  validate(registerAdvocateSchema),
  authController.registerAdvocate,
);

router.post(
  '/login',
  validate(loginSchema),
  authController.login,
);

router.post('/refresh', authController.refreshAccessToken);

router.post('/logout', authenticate, authController.logout);

router.get('/verify-email', authController.verifyEmail);

router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword,
);

export default router;
