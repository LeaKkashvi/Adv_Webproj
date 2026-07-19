import AdvocateProfile from '../../models/AdvocateProfile.js';
import Document from '../../models/Document.js';
import ServiceRequest from '../../models/ServiceRequest.js';
import User from '../../models/User.js';
import ApiError from '../../utils/apiError.js';
import logger from '../../utils/logger.js';

const getDashboardMetrics = async () => {
  const [
    totalUsers,
    totalAdvocates,
    pendingVerifications,
    verifiedAdvocates,
    rejectedAdvocates,
    totalClients,
    activeCases,
    completedCases,
    pendingRequests,
    pendingDocumentVerifications,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'advocate' }),
    AdvocateProfile.countDocuments({ verificationStatus: 'under_review' }),
    AdvocateProfile.countDocuments({ verificationStatus: 'verified' }),
    AdvocateProfile.countDocuments({ verificationStatus: 'rejected' }),
    User.countDocuments({ role: 'client' }),
    ServiceRequest.countDocuments({
      status: { $in: ['assigned', 'in_progress', 'awaiting_client'] },
    }),
    ServiceRequest.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
    ServiceRequest.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
    Document.countDocuments({ verificationStatus: 'pending', isDeleted: false }),
  ]);

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name email role createdAt isEmailVerified');

  return {
    totalUsers,
    totalAdvocates,
    totalClients,
    pendingVerifications,
    verifiedAdvocates,
    rejectedAdvocates,
    activeCases,
    completedCases,
    pendingRequests,
    pendingDocumentVerifications,
    recentUsers,
  };
};

const getAllUsers = async ({
  page = 1,
  limit = 20,
  role,
  search,
  isVerified,
}) => {
  const query = {};
  if (role) query.role = role;
  if (isVerified !== undefined) query.isEmailVerified = isVerified === 'true';
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('name email role accountStatus isEmailVerified createdAt lastLogin');

  return {
    users: users.map((u) => u.toProfileJSON()),
    pagination: { page, limit, total },
  };
};

const getUserDetail = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshTokens');
  if (!user) throw ApiError.notFound('User not found');

  let advocateProfile = null;
  if (user.role === 'advocate') {
    advocateProfile = await AdvocateProfile.findOne({ userId }).populate(
      'userId',
      'name email',
    );
  }

  return {
    user: user.toProfileJSON(),
    advocateProfile: advocateProfile ? advocateProfile.toProfileJSON() : null,
  };
};

const updateUserStatus = async (userId, updates) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');

  if (updates.role !== undefined) user.role = updates.role;
  if (updates.isEmailVerified !== undefined)
    user.isEmailVerified = updates.isEmailVerified;
  if (updates.accountStatus !== undefined)
    user.accountStatus = updates.accountStatus;

  await user.save();
  logger.info(`Admin updated user ${userId}`);
  return user.toProfileJSON();
};

const getCaseAnalytics = async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [
    caseVolumeTrend,
    caseStatusBreakdown,
    casePriorityBreakdown,
    caseCategoryBreakdown,
    activeCases,
    completedCases,
    pendingRequests,
  ] = await Promise.all([
    ServiceRequest.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] },
            ],
          },
          count: 1,
        },
      },
    ]),
    ServiceRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    ServiceRequest.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    ServiceRequest.aggregate([
      { $group: { _id: '$serviceCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    ServiceRequest.countDocuments({
      status: { $in: ['assigned', 'in_progress', 'awaiting_client'] },
    }),
    ServiceRequest.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
    ServiceRequest.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
  ]);

  return {
    caseVolumeTrend,
    caseStatusBreakdown,
    casePriorityBreakdown,
    caseCategoryBreakdown,
    activeCases,
    completedCases,
    pendingRequests,
  };
};

const getUserAnalytics = async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [
    userDistribution,
    registrationTrend,
    activeClients,
    verifiedAdvocates,
    pendingVerifications,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] },
            ],
          },
          count: 1,
        },
      },
    ]),
    User.countDocuments({ role: 'client', accountStatus: 'active' }),
    AdvocateProfile.countDocuments({ verificationStatus: 'verified' }),
    AdvocateProfile.countDocuments({
      verificationStatus: { $in: ['under_review', 'pending'] },
    }),
  ]);

  return {
    userDistribution,
    registrationTrend,
    activeClients,
    verifiedAdvocates,
    pendingVerifications,
  };
};

const getDocumentAnalytics = async () => {
  const [
    documentVerificationStatus,
    recentPendingDocuments,
    totalDocuments,
  ] = await Promise.all([
    Document.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
    ]),
    Document.find({ verificationStatus: 'pending', isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('ownerId', 'name email'),
    Document.countDocuments({ isDeleted: false }),
  ]);

  return {
    documentVerificationStatus,
    recentPendingDocuments,
    totalDocuments,
  };
};

const getAdvocateAnalytics = async () => {
  const [
    topAdvocates,
    advocateSpecializationDistribution,
    platformActivityOverview,
  ] = await Promise.all([
    AdvocateProfile.find({ verificationStatus: 'verified' })
      .sort({ casesCompleted: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .select('userId casesCompleted averageRating averageResponseTimeHours specializations'),
    AdvocateProfile.aggregate([
      { $unwind: '$specializations' },
      { $group: { _id: '$specializations', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Promise.all([
      User.countDocuments(),
      AdvocateProfile.countDocuments(),
      ServiceRequest.countDocuments(),
      Document.countDocuments({ isDeleted: false }),
    ]).then(([totalUsers, totalAdvocates, totalCases, totalDocuments]) => ({
      totalUsers,
      totalAdvocates,
      totalCases,
      totalDocuments,
    })),
  ]);

  return {
    topAdvocates,
    advocateSpecializationDistribution,
    platformActivityOverview,
  };
};

const getCases = async ({ page = 1, limit = 20, status, search, priority }) => {
  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
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
    .populate('clientId', 'name email')
    .populate({ path: 'assignedAdvocate', populate: { path: 'userId', select: 'name email' } });

  return {
    cases,
    pagination: { page, limit, total },
  };
};

const getCaseDetail = async (caseId) => {
  const caseDoc = await ServiceRequest.findById(caseId)
    .populate('clientId', 'name email phone')
    .populate({ path: 'assignedAdvocate', populate: { path: 'userId', select: 'name email' } })
    .populate('statusHistory.changedBy', 'name role');
  if (!caseDoc) throw ApiError.notFound('Case not found');
  return { case: caseDoc };
};

const createCase = async ({ title, description, serviceCategory, clientId, priority, assignedAdvocate }) => {
  const client = await User.findById(clientId);
  if (!client || client.role !== 'client') {
    throw ApiError.badRequest('Invalid client ID');
  }

  const caseData = {
    title,
    description,
    serviceCategory,
    clientId,
    priority: priority || 'normal',
    status: 'submitted',
    statusHistory: [{
      status: 'submitted',
      notes: 'Case created by admin',
      changedAt: new Date(),
    }],
  };

  if (assignedAdvocate) {
    const advocate = await AdvocateProfile.findById(assignedAdvocate);
    if (!advocate) throw ApiError.badRequest('Invalid advocate ID');
    caseData.assignedAdvocate = assignedAdvocate;
    caseData.status = 'assigned';
    caseData.assignedAt = new Date();
    caseData.statusHistory.push({
      status: 'assigned',
      notes: `Assigned to advocate`,
      changedAt: new Date(),
    });
  }

  const caseDoc = await ServiceRequest.create(caseData);
  await User.findByIdAndUpdate(clientId, { $push: { assignedCases: caseDoc._id } });

  if (assignedAdvocate) {
    await AdvocateProfile.findByIdAndUpdate(assignedAdvocate, { $push: { managedCases: caseDoc._id } });
  }

  logger.info(`Case created: ${caseDoc._id} by admin`);
  return { case: caseDoc };
};

const updateCase = async (caseId, updates) => {
  const caseDoc = await ServiceRequest.findById(caseId);
  if (!caseDoc) throw ApiError.notFound('Case not found');

  const allowedFields = ['status', 'priority', 'assignedAdvocate', 'clientNotes', 'advocateNotes', 'adminNotes', 'rejectionReason'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      caseDoc[field] = updates[field];
    }
  }

  if (updates.status) {
    caseDoc.statusHistory.push({
      status: updates.status,
      notes: updates.statusNotes || `Status updated to ${updates.status}`,
      changedAt: new Date(),
    });
    if (updates.status === 'resolved') caseDoc.resolvedAt = new Date();
    if (updates.status === 'closed') caseDoc.closedAt = new Date();
  }

  await caseDoc.save();
  logger.info(`Case updated: ${caseId}`);
  return { case: caseDoc };
};

const addCaseUpdate = async (caseId, { status, notes }) => {
  const caseDoc = await ServiceRequest.findById(caseId);
  if (!caseDoc) throw ApiError.notFound('Case not found');

  caseDoc.statusHistory.push({
    status: status || caseDoc.status,
    notes: notes || '',
    changedAt: new Date(),
  });

  if (status) {
    caseDoc.status = status;
    if (status === 'resolved') caseDoc.resolvedAt = new Date();
    if (status === 'closed') caseDoc.closedAt = new Date();
  }

  await caseDoc.save();
  logger.info(`Case update added: ${caseId}`);
  return { case: caseDoc };
};

const getDocuments = async ({ page = 1, limit = 20, status, search }) => {
  const query = { isDeleted: false };
  if (status) query.verificationStatus = status;
  if (search) {
    query.$or = [
      { originalFileName: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Document.countDocuments(query);
  const documents = await Document.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('ownerId', 'name email role');

  return {
    documents,
    pagination: { page, limit, total },
  };
};

const approveDocument = async (documentId, verifiedBy, notes) => {
  const document = await Document.findById(documentId);
  if (!document) throw ApiError.notFound('Document not found');

  document.verificationStatus = 'approved';
  document.verifiedBy = verifiedBy;
  document.verifiedAt = new Date();
  document.rejectionReason = '';
  await document.save();

  logger.info(`Document approved: ${documentId} by ${verifiedBy}`);
  return { document };
};

const rejectDocument = async (documentId, verifiedBy, reason) => {
  const document = await Document.findById(documentId);
  if (!document) throw ApiError.notFound('Document not found');

  document.verificationStatus = 'rejected';
  document.verifiedBy = verifiedBy;
  document.verifiedAt = new Date();
  document.rejectionReason = reason;
  await document.save();

  logger.info(`Document rejected: ${documentId} by ${verifiedBy}: ${reason}`);
  return { document };
};

const ROLE_PERMISSIONS = {
  admin: [
    'users.read', 'users.write', 'users.delete',
    'cases.read', 'cases.write', 'cases.assign',
    'documents.read', 'documents.approve', 'documents.reject',
    'verification.read', 'verification.approve', 'verification.reject',
    'roles.read', 'roles.write',
    'analytics.read',
  ],
  advocate: [
    'cases.read', 'cases.update_status',
    'documents.read', 'documents.upload',
    'profile.read', 'profile.write',
    'verification.submit', 'verification.status',
  ],
  client: [
    'cases.read', 'cases.create',
    'documents.read', 'documents.upload', 'documents.delete',
    'profile.read', 'profile.write',
    'notifications.read',
  ],
};

const getRoles = async () => {
  const entries = Object.entries(ROLE_PERMISSIONS);
  const roles = await Promise.all(
    entries.map(async ([name, permissions]) => ({
      name,
      permissions,
      userCount: await User.countDocuments({ role: name }),
    })),
  );
  return { roles };
};

const updateRolePermissions = async (roleName, permissions) => {
  if (!ROLE_PERMISSIONS[roleName]) {
    throw ApiError.badRequest(`Invalid role: ${roleName}`);
  }
  ROLE_PERMISSIONS[roleName] = permissions;
  logger.info(`Role permissions updated: ${roleName}`);
  return {
    role: { name: roleName, permissions },
  };
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
