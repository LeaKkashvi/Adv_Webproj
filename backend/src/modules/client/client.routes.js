import { Router } from 'express';
import authenticate from '../../middleware/auth.middleware.js';
import authorize from '../../middleware/rbac.middleware.js';
import upload from '../../middleware/upload.middleware.js';
import clientController from './client.controller.js';

const router = Router();

router.use(authenticate, authorize('client'));

router.get('/dashboard', clientController.getDashboard);

router.get('/documents', clientController.getDocuments);
router.post('/documents', upload.single('file'), clientController.uploadDocument);
router.delete('/documents/:documentId', clientController.deleteDocument);

router.get('/cases', clientController.getCases);
router.get('/cases/:caseId/timeline', clientController.getCaseTimeline);

router.get('/advocate', clientController.getAssignedAdvocate);

router.get('/notifications', clientController.getNotifications);
router.patch('/notifications/:notificationId/read', clientController.markNotificationRead);
router.patch('/notifications/read-all', clientController.markAllNotificationsRead);

export default router;
