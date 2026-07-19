import verificationService from './verification.service.js';
import ApiResponse from '../../utils/apiResponse.js';

const submitCredentials = async (req, res, next) => {
  try {
    const profileData = {};
    if (req.body.yearsOfExperience !== undefined) {
      profileData.yearsOfExperience = Number(req.body.yearsOfExperience);
    }
    if (req.body.specializations) {
      profileData.specializations = JSON.parse(req.body.specializations);
    }
    if (req.body.languagesSpoken) {
      profileData.languagesSpoken = JSON.parse(req.body.languagesSpoken);
    }
    if (req.body.courtJurisdictions) {
      profileData.courtJurisdictions = JSON.parse(req.body.courtJurisdictions);
    }
    if (req.body.bio !== undefined) {
      profileData.bio = req.body.bio;
    }
    if (req.body.education) {
      profileData.education = JSON.parse(req.body.education);
    }
    if (req.body.serviceOfferings) {
      profileData.serviceOfferings = JSON.parse(req.body.serviceOfferings);
    }
    if (req.body.availability) {
      profileData.availability = JSON.parse(req.body.availability);
    }

    const result = await verificationService.submitCredentials(
      req.user.userId,
      req.files,
      profileData,
    );
    return ApiResponse.success(
      res,
      result,
      'Credentials submitted successfully',
    );
  } catch (error) {
    next(error);
  }
};

const getVerificationStatus = async (req, res, next) => {
  try {
    const result = await verificationService.getVerificationStatus(
      req.user.userId,
    );
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

const getVerificationQueue = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await verificationService.getVerificationQueue({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
    });
    return ApiResponse.paginated(
      res,
      result.profiles,
      result.pagination,
      'Verification queue retrieved',
    );
  } catch (error) {
    next(error);
  }
};

const getAdvocateDetailForReview = async (req, res, next) => {
  try {
    const result = await verificationService.getAdvocateDetailForReview(
      req.params.advocateId,
    );
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

const approveVerification = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const result = await verificationService.approveVerification(
      req.user.userId,
      req.params.advocateId,
      notes,
    );
    return ApiResponse.success(res, result, 'Advocate verified successfully');
  } catch (error) {
    next(error);
  }
};

const rejectVerification = async (req, res, next) => {
  try {
    const { reason, notes } = req.body;
    const result = await verificationService.rejectVerification(
      req.user.userId,
      req.params.advocateId,
      reason,
      notes,
    );
    return ApiResponse.success(
      res,
      result,
      'Advocate verification rejected',
    );
  } catch (error) {
    next(error);
  }
};

const requestMoreInfo = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const result = await verificationService.requestMoreInfo(
      req.user.userId,
      req.params.advocateId,
      notes,
    );
    return ApiResponse.success(res, result, 'More information requested');
  } catch (error) {
    next(error);
  }
};

const removeCredentialDocument = async (req, res, next) => {
  try {
    const { documentIndex } = req.params;
    const result = await verificationService.removeCredentialDocument(
      req.user.userId,
      parseInt(documentIndex),
    );
    return ApiResponse.success(res, result, 'Document removed');
  } catch (error) {
    next(error);
  }
};

const getVerifiedAdvocates = async (req, res, next) => {
  try {
    const { page, limit, specialization, language, state, search } = req.query;
    const result = await verificationService.getVerifiedAdvocates({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      specialization,
      language,
      state,
      search,
    });
    return ApiResponse.paginated(
      res,
      result.profiles,
      result.pagination,
      'Advocate directory retrieved',
    );
  } catch (error) {
    next(error);
  }
};

export default {
  submitCredentials,
  getVerificationStatus,
  getVerificationQueue,
  getAdvocateDetailForReview,
  approveVerification,
  rejectVerification,
  requestMoreInfo,
  removeCredentialDocument,
  getVerifiedAdvocates,
};
