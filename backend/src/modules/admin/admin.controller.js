import adminService from './admin.service.js';
import ApiResponse from '../../utils/apiResponse.js';

const getDashboardMetrics = async (req, res, next) => {
  try {
    const result = await adminService.getDashboardMetrics();
    return ApiResponse.success(res, result, 'Dashboard metrics retrieved');
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, role, search, isVerified } = req.query;
    const result = await adminService.getAllUsers({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      role,
      search,
      isVerified,
    });
    return ApiResponse.paginated(
      res,
      result.users,
      result.pagination,
      'Users retrieved',
    );
  } catch (error) {
    next(error);
  }
};

const getUserDetail = async (req, res, next) => {
  try {
    const result = await adminService.getUserDetail(req.params.userId);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { role, isEmailVerified, accountStatus } = req.body;
    const result = await adminService.updateUserStatus(req.params.userId, {
      role,
      isEmailVerified,
      accountStatus,
    });
    return ApiResponse.success(res, result, 'User updated');
  } catch (error) {
    next(error);
  }
};

const getCaseAnalytics = async (req, res, next) => {
  try {
    const result = await adminService.getCaseAnalytics();
    return ApiResponse.success(res, result, 'Case analytics retrieved');
  } catch (error) {
    next(error);
  }
};

const getUserAnalytics = async (req, res, next) => {
  try {
    const result = await adminService.getUserAnalytics();
    return ApiResponse.success(res, result, 'User analytics retrieved');
  } catch (error) {
    next(error);
  }
};

const getDocumentAnalytics = async (req, res, next) => {
  try {
    const result = await adminService.getDocumentAnalytics();
    return ApiResponse.success(res, result, 'Document analytics retrieved');
  } catch (error) {
    next(error);
  }
};

const getAdvocateAnalytics = async (req, res, next) => {
  try {
    const result = await adminService.getAdvocateAnalytics();
    return ApiResponse.success(res, result, 'Advocate analytics retrieved');
  } catch (error) {
    next(error);
  }
};

const getCases = async (req, res, next) => {
  try {
    const { page, limit, status, search, priority } = req.query;
    const result = await adminService.getCases({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      search,
      priority,
    });
    return ApiResponse.paginated(res, result.cases, result.pagination, 'Cases retrieved');
  } catch (error) {
    next(error);
  }
};

const getCaseDetail = async (req, res, next) => {
  try {
    const result = await adminService.getCaseDetail(req.params.caseId);
    return ApiResponse.success(res, result, 'Case retrieved');
  } catch (error) {
    next(error);
  }
};

const createCase = async (req, res, next) => {
  try {
    const result = await adminService.createCase(req.body);
    return ApiResponse.created(res, result, 'Case created successfully');
  } catch (error) {
    next(error);
  }
};

const updateCase = async (req, res, next) => {
  try {
    const result = await adminService.updateCase(req.params.caseId, req.body);
    return ApiResponse.success(res, result, 'Case updated');
  } catch (error) {
    next(error);
  }
};

const addCaseUpdate = async (req, res, next) => {
  try {
    const result = await adminService.addCaseUpdate(req.params.caseId, req.body);
    return ApiResponse.success(res, result, 'Case update added');
  } catch (error) {
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await adminService.getDocuments({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      search,
    });
    return ApiResponse.paginated(res, result.documents, result.pagination, 'Documents retrieved');
  } catch (error) {
    next(error);
  }
};

const approveDocument = async (req, res, next) => {
  try {
    const result = await adminService.approveDocument(req.params.documentId, req.user.userId, req.body.notes);
    return ApiResponse.success(res, result, 'Document approved');
  } catch (error) {
    next(error);
  }
};

const rejectDocument = async (req, res, next) => {
  try {
    const result = await adminService.rejectDocument(req.params.documentId, req.user.userId, req.body.reason);
    return ApiResponse.success(res, result, 'Document rejected');
  } catch (error) {
    next(error);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const result = await adminService.getRoles();
    return ApiResponse.success(res, result, 'Roles retrieved');
  } catch (error) {
    next(error);
  }
};

const updateRolePermissions = async (req, res, next) => {
  try {
    const result = await adminService.updateRolePermissions(req.params.roleName, req.body.permissions);
    return ApiResponse.success(res, result, 'Role permissions updated');
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboardMetrics,
  getAllUsers,
  getUserDetail,
  updateUserStatus,
  getCaseAnalytics,
  getUserAnalytics,
  getDocumentAnalytics,
  getAdvocateAnalytics,
  getCases,
  getCaseDetail,
  createCase,
  updateCase,
  addCaseUpdate,
  getDocuments,
  approveDocument,
  rejectDocument,
  getRoles,
  updateRolePermissions,
};
