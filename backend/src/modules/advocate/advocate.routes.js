import { Router } from 'express';
import authenticate from '../../middleware/auth.middleware.js';
import authorize from '../../middleware/rbac.middleware.js';
import advocateController from './advocate.controller.js';

const router = Router();

router.use(authenticate, authorize('advocate'));

router.get('/dashboard', advocateController.getDashboard);
router.get('/profile', advocateController.getAdvocateProfile);

router.get('/cases', advocateController.getCases);
router.get('/cases/:caseId', advocateController.getCaseDetail);
router.patch('/cases/:caseId', advocateController.updateCase);
router.post('/cases/:caseId/updates', advocateController.addCaseUpdate);

router.get('/documents', advocateController.getDocuments);

export default router;
