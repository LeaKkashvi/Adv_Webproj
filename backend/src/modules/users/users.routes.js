import { Router } from 'express';
import usersController from './users.controller.js';
import authenticate from '../../middleware/auth.middleware.js';
import authorize from '../../middleware/rbac.middleware.js';

const router = Router();

router.get('/me', authenticate, usersController.getProfile);
router.patch('/me', authenticate, usersController.updateProfile);
router.patch('/me/password', authenticate, usersController.updatePassword);

router.get('/advocates/:id', authenticate, usersController.getAdvocateProfile);
router.patch(
  '/advocates/me/profile',
  authenticate,
  authorize('advocate'),
  usersController.updateAdvocateProfile,
);

export default router;
