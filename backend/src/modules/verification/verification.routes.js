import { Router } from 'express';
import verificationController from './verification.controller.js';
import validate from '../../middleware/validate.middleware.js';
import authenticate from '../../middleware/auth.middleware.js';
import authorize from '../../middleware/rbac.middleware.js';
import upload from '../../middleware/upload.middleware.js';
import {
  approveVerificationSchema,
  rejectVerificationSchema,
  requestMoreInfoSchema,
} from './verification.validators.js';

const router = Router();

router.get(
  '/status',
  authenticate,
  authorize('advocate'),
  verificationController.getVerificationStatus,
);

router.post(
  '/submit',
  authenticate,
  authorize('advocate'),
  upload.array('documents', 10),
  verificationController.submitCredentials,
);

router.delete(
  '/documents/:documentIndex',
  authenticate,
  authorize('advocate'),
  verificationController.removeCredentialDocument,
);

router.get(
  '/directory',
  verificationController.getVerifiedAdvocates,
);

router.get(
  '/admin/queue',
  authenticate,
  authorize('admin'),
  verificationController.getVerificationQueue,
);

router.get(
  '/admin/:advocateId',
  authenticate,
  authorize('admin'),
  verificationController.getAdvocateDetailForReview,
);

router.patch(
  '/admin/:advocateId/approve',
  authenticate,
  authorize('admin'),
  validate(approveVerificationSchema),
  verificationController.approveVerification,
);

router.patch(
  '/admin/:advocateId/reject',
  authenticate,
  authorize('admin'),
  validate(rejectVerificationSchema),
  verificationController.rejectVerification,
);

router.patch(
  '/admin/:advocateId/request-info',
  authenticate,
  authorize('admin'),
  validate(requestMoreInfoSchema),
  verificationController.requestMoreInfo,
);

export default router;
