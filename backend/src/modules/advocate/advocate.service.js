import User from '../../models/User.js';
import Document from '../../models/Document.js';
import ServiceRequest from '../../models/ServiceRequest.js';
import AdvocateProfile from '../../models/AdvocateProfile.js';
import ApiError from '../../utils/apiError.js';
import logger from '../../utils/logger.js';

const getAdvocateProfile = async (userId) => {
  const profile = await AdvocateProfile.findOne({ userId })
    .populate('userId', 'name email phone profilePhotoUrl countryOfResidence createdAt');
  if (!profile) throw ApiError.notFound('Advocate profile not found');
  return { profile: profile.toProfileJSON() };
};

const getDashboard = async (userId) => {
  const profile = await AdvocateProfile.findOne({ userId });
  if (!profile) throw ApiError.notFound('Advocate profile not found');

  const [activeCases, totalCases, pendingCases, completedCases, managedClients] = await Promise.all([
    ServiceRequest.countDocuments({ assignedAdvocate: profile._id, status: { $in: ['assigned', 'in_progress', 'awaiting_client'] } }),
    ServiceRequest.countDocuments({ assignedAdvocate: profile._id }),
    ServiceRequest.countDocuments({ assignedAdvocate: profile._id, status: { $in: ['submitted', 'under_review'] } }),
    ServiceRequest.countDocuments({ assignedAdvocate: profile._id, status: { $in: ['resolved', 'closed'] } }),
    User.countDocuments({ _id: { $in: profile.managedClients || [] } }),
  ]);

  return {
    stats: {
      activeCases,
      totalCases,
      pendingCases,
      completedCases,
      managedClients,
      averageRating: profile.averageRating,
      casesCompleted: profile.casesCompleted,
    },
  };
};

const getCases = async (userId, { page = 1, limit = 20, status, search }) => {
  const profile = await AdvocateProfile.findOne({ userId });
  if (!profile) throw ApiError.notFound('Advocate profile not found');

  const query = { assignedAdvocate: profile._id };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await ServiceRequest.countDocuments(query);
  const cases = await ServiceRequest.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('clientId', 'name email phone');

  return { cases, pagination: { page, limit, total } };
};

const getCaseDetail = async (userId, caseId) => {
  const profile = await AdvocateProfile.findOne({ userId });
  if (!profile) throw ApiError.notFound('Advocate profile not found');

  const caseDoc = await ServiceRequest.findOne({ _id: caseId, assignedAdvocate: profile._id })
    .populate('clientId', 'name email phone')
    .populate('statusHistory.changedBy', 'name role');
  if (!caseDoc) throw ApiError.notFound('Case not found');

  return { case: caseDoc };
};

const updateCase = async (userId, caseId, updates) => {
  const profile = await AdvocateProfile.findOne({ userId });
  if (!profile) throw ApiError.notFound('Advocate profile not found');

  const caseDoc = await ServiceRequest.findOne({ _id: caseId, assignedAdvocate: profile._id });
  if (!caseDoc) throw ApiError.notFound('Case not found');

  const allowedFields = ['status', 'advocateNotes'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      caseDoc[field] = updates[field];
    }
  }

  if (updates.status) {
    caseDoc.statusHistory.push({
      status: updates.status,
      notes: updates.notes || `Status updated to ${updates.status}`,
      changedBy: userId,
      changedAt: new Date(),
    });
    if (updates.status === 'resolved') caseDoc.resolvedAt = new Date();
    if (updates.status === 'closed') caseDoc.closedAt = new Date();
  }

  await caseDoc.save();
  logger.info(`Case updated by advocate ${userId}: ${caseId}`);
  return { case: caseDoc };
};

const addCaseUpdate = async (userId, caseId, { status, notes }) => {
  const profile = await AdvocateProfile.findOne({ userId });
  if (!profile) throw ApiError.notFound('Advocate profile not found');

  const caseDoc = await ServiceRequest.findOne({ _id: caseId, assignedAdvocate: profile._id });
  if (!caseDoc) throw ApiError.notFound('Case not found');

  caseDoc.statusHistory.push({
    status: status || caseDoc.status,
    notes: notes || '',
    changedBy: userId,
    changedAt: new Date(),
  });

  if (status) {
    caseDoc.status = status;
    if (status === 'resolved') caseDoc.resolvedAt = new Date();
    if (status === 'closed') caseDoc.closedAt = new Date();
  }

  await caseDoc.save();
  logger.info(`Case update added by advocate ${userId}: ${caseId}`);
  return { case: caseDoc };
};

const getDocuments = async (userId, { page = 1, limit = 20, status }) => {
  const query = { ownerId: userId, isDeleted: false };
  if (status) query.verificationStatus = status;

  const total = await Document.countDocuments(query);
  const documents = await Document.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { documents, pagination: { page, limit, total } };
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
