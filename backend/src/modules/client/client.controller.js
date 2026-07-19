import clientService from './client.service.js';
import ApiResponse from '../../utils/apiResponse.js';

const getDashboard = async (req, res, next) => {
  try {
    const result = await clientService.getDashboard(req.user.userId);
    return ApiResponse.success(res, result, 'Client dashboard retrieved');
  } catch (error) {
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const result = await clientService.getDocuments(req.user.userId);
    return ApiResponse.success(res, result, 'Documents retrieved');
  } catch (error) {
    next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    const category = req.body.category || 'other';
    const result = await clientService.uploadDocument(req.user.userId, req.file, category);
    return ApiResponse.created(res, result, 'Document uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const result = await clientService.deleteDocument(req.user.userId, req.params.documentId);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

const getCases = async (req, res, next) => {
  try {
    const result = await clientService.getCases(req.user.userId);
    return ApiResponse.success(res, result, 'Cases retrieved');
  } catch (error) {
    next(error);
  }
};

const getCaseTimeline = async (req, res, next) => {
  try {
    const result = await clientService.getCaseTimeline(req.user.userId, req.params.caseId);
    return ApiResponse.success(res, result, 'Case timeline retrieved');
  } catch (error) {
    next(error);
  }
};

const getAssignedAdvocate = async (req, res, next) => {
  try {
    const result = await clientService.getAssignedAdvocate(req.user.userId);
    return ApiResponse.success(res, result, 'Advocate details retrieved');
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const result = await clientService.getNotifications(req.user.userId);
    return ApiResponse.success(res, result, 'Notifications retrieved');
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const result = await clientService.markNotificationRead(req.user.userId, req.params.notificationId);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await clientService.markAllNotificationsRead(req.user.userId);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboard,
  getDocuments,
  uploadDocument,
  deleteDocument,
  getCases,
  getCaseTimeline,
  getAssignedAdvocate,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
