import advocateService from './advocate.service.js';
import ApiResponse from '../../utils/apiResponse.js';

const getAdvocateProfile = async (req, res, next) => {
  try {
    const result = await advocateService.getAdvocateProfile(req.user.userId);
    return ApiResponse.success(res, result, 'Advocate profile retrieved');
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const result = await advocateService.getDashboard(req.user.userId);
    return ApiResponse.success(res, result, 'Advocate dashboard retrieved');
  } catch (error) {
    next(error);
  }
};

const getCases = async (req, res, next) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await advocateService.getCases(req.user.userId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      search,
    });
    return ApiResponse.paginated(res, result.cases, result.pagination, 'Cases retrieved');
  } catch (error) {
    next(error);
  }
};

const getCaseDetail = async (req, res, next) => {
  try {
    const result = await advocateService.getCaseDetail(req.user.userId, req.params.caseId);
    return ApiResponse.success(res, result, 'Case retrieved');
  } catch (error) {
    next(error);
  }
};

const updateCase = async (req, res, next) => {
  try {
    const result = await advocateService.updateCase(req.user.userId, req.params.caseId, req.body);
    return ApiResponse.success(res, result, 'Case updated');
  } catch (error) {
    next(error);
  }
};

const addCaseUpdate = async (req, res, next) => {
  try {
    const result = await advocateService.addCaseUpdate(req.user.userId, req.params.caseId, req.body);
    return ApiResponse.success(res, result, 'Case update added');
  } catch (error) {
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await advocateService.getDocuments(req.user.userId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
    });
    return ApiResponse.paginated(res, result.documents, result.pagination, 'Documents retrieved');
  } catch (error) {
    next(error);
  }
};

export default {
  getAdvocateProfile,
  getDashboard,
  getCases,
  getCaseDetail,
  updateCase,
  addCaseUpdate,
  getDocuments,
};
