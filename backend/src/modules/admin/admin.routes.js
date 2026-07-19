import { Router } from 'express';
import adminController from './admin.controller.js';
import authenticate from '../../middleware/auth.middleware.js';
import authorize from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', adminController.getDashboardMetrics);
router.get('/analytics/cases', adminController.getCaseAnalytics);
router.get('/analytics/users', adminController.getUserAnalytics);
router.get('/analytics/documents', adminController.getDocumentAnalytics);
router.get('/analytics/advocates', adminController.getAdvocateAnalytics);

router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetail);
router.patch('/users/:userId', adminController.updateUserStatus);

router.get('/cases', adminController.getCases);
router.get('/cases/:caseId', adminController.getCaseDetail);
router.post('/cases', adminController.createCase);
router.patch('/cases/:caseId', adminController.updateCase);
router.post('/cases/:caseId/updates', adminController.addCaseUpdate);

router.get('/documents', adminController.getDocuments);
router.patch('/documents/:documentId/approve', adminController.approveDocument);
router.patch('/documents/:documentId/reject', adminController.rejectDocument);

router.get('/roles', adminController.getRoles);
router.patch('/roles/:roleName', adminController.updateRolePermissions);

export default router;
