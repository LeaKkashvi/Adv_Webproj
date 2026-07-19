import User from '../../models/User.js';
import Document from '../../models/Document.js';
import ServiceRequest from '../../models/ServiceRequest.js';
import AdvocateProfile from '../../models/AdvocateProfile.js';
import { cloudinary } from '../../config/cloudinary.js';
import ApiError from '../../utils/apiError.js';
import logger from '../../utils/logger.js';

const getDashboard = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');
  if (!user) throw ApiError.notFound('User not found');

  const [cases, documents, advocateProfile] = await Promise.all([
    ServiceRequest.find({ clientId: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title status serviceCategory priority createdAt assignedAdvocate'),
    Document.find({ ownerId: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('originalFileName fileType verificationStatus createdAt'),
    user.role === 'client'
      ? ServiceRequest.findOne({ clientId: userId, assignedAdvocate: { $ne: null } })
          .populate({
            path: 'assignedAdvocate',
            populate: { path: 'userId', select: 'name email profilePhotoUrl' },
          })
          .then((sr) => sr?.assignedAdvocate || null)
      : null,
  ]);

  const activeCases = cases.filter((c) =>
    ['assigned', 'in_progress', 'awaiting_client'].includes(c.status),
  ).length;
  const pendingDocs = documents.filter((d) => d.verificationStatus === 'pending').length;
  const resolvedCases = cases.filter((c) =>
    ['resolved', 'closed'].includes(c.status),
  ).length;

  const notifications = [];
  for (const c of cases) {
    if (c.statusHistory?.length > 0) {
      const latest = c.statusHistory[c.statusHistory.length - 1];
      if (latest.changedBy?.toString() !== userId) {
        notifications.push({
          id: `${c._id}-${latest.changedAt.getTime()}`,
          type: 'case_update',
          message: `Case "${c.title}" status updated to ${latest.status.replace(/_/g, ' ')}`,
          timestamp: latest.changedAt,
          read: false,
          caseId: c._id,
        });
      }
    }
  }

  for (const d of documents) {
    if (d.verificationStatus !== 'pending') {
      notifications.push({
        id: `${d._id}-verified`,
        type: 'document_update',
        message: `Document "${d.originalFileName}" has been ${d.verificationStatus}`,
        timestamp: d.updatedAt || d.createdAt,
        read: false,
        documentId: d._id,
      });
    }
  }

  notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    profile: user.toProfileJSON(),
    stats: {
      activeCases,
      totalCases: cases.length,
      pendingDocuments: pendingDocs,
      resolvedCases,
    },
    recentCases: cases,
    recentDocuments: documents,
    assignedAdvocate: advocateProfile
      ? {
          _id: advocateProfile._id,
          name: advocateProfile.userId?.name,
          email: advocateProfile.userId?.email,
          profilePhotoUrl: advocateProfile.userId?.profilePhotoUrl,
          specializations: advocateProfile.specializations,
          averageRating: advocateProfile.averageRating,
          casesCompleted: advocateProfile.casesCompleted,
          verificationStatus: advocateProfile.verificationStatus,
        }
      : null,
    notifications: notifications.slice(0, 20),
  };
};

const getDocuments = async (userId) => {
  const documents = await Document.find({ ownerId: userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .select('originalFileName fileType fileSizeBytes verificationStatus rejectionReason category createdAt cloudinaryUrl');

  return { documents };
};

const uploadDocument = async (userId, file, category = 'other') => {
  if (!file) throw ApiError.badRequest('No file provided');

  let cloudinaryResult = null;
  if (cloudinary.config().cloud_name) {
    try {
      const b64 = file.buffer.toString('base64');
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      cloudinaryResult = await cloudinary.uploader.upload(dataURI, {
        folder: `nri-portal/documents/${userId}`,
        resource_type: 'auto',
      });
    } catch (err) {
      logger.warn('Cloudinary upload failed, storing metadata only:', err.message);
    }
  }

  const document = await Document.create({
    ownerId: userId,
    fileName: file.originalname,
    originalFileName: file.originalname,
    fileType: file.mimetype,
    fileSizeBytes: file.size,
    category,
    cloudinaryPublicId: cloudinaryResult?.public_id || null,
    cloudinaryUrl: cloudinaryResult?.secure_url || null,
    verificationStatus: 'pending',
  });

  await User.findByIdAndUpdate(userId, { $push: { documents: document._id } });

  logger.info(`Document uploaded: ${document._id} by user ${userId}`);
  return { document };
};

const deleteDocument = async (userId, documentId) => {
  const document = await Document.findOne({ _id: documentId, ownerId: userId });
  if (!document) throw ApiError.notFound('Document not found');
  if (document.isDeleted) throw ApiError.notFound('Document already deleted');

  document.isDeleted = true;
  document.deletedAt = new Date();
  await document.save();

  await User.findByIdAndUpdate(userId, { $pull: { documents: documentId } });

  if (document.cloudinaryPublicId && cloudinary.config().cloud_name) {
    try {
      await cloudinary.uploader.destroy(document.cloudinaryPublicId);
    } catch (err) {
      logger.warn('Cloudinary delete failed:', err.message);
    }
  }

  return { message: 'Document deleted successfully' };
};

const getCases = async (userId) => {
  const cases = await ServiceRequest.find({ clientId: userId })
    .sort({ createdAt: -1 })
    .select('title description serviceCategory status priority statusHistory assignedAdvocate assignedAt createdAt updatedAt')
    .populate({
      path: 'assignedAdvocate',
      populate: { path: 'userId', select: 'name email' },
    });

  return { cases };
};

const getCaseTimeline = async (userId, caseId) => {
  const caseDoc = await ServiceRequest.findOne({ _id: caseId, clientId: userId })
    .populate('statusHistory.changedBy', 'name role')
    .populate({
      path: 'assignedAdvocate',
      populate: { path: 'userId', select: 'name email profilePhotoUrl' },
    });

  if (!caseDoc) throw ApiError.notFound('Case not found');

  return {
    case: {
      _id: caseDoc._id,
      title: caseDoc.title,
      description: caseDoc.description,
      serviceCategory: caseDoc.serviceCategory,
      status: caseDoc.status,
      priority: caseDoc.priority,
      assignedAdvocate: caseDoc.assignedAdvocate
        ? {
            _id: caseDoc.assignedAdvocate._id,
            name: caseDoc.assignedAdvocate.userId?.name,
            email: caseDoc.assignedAdvocate.userId?.email,
            profilePhotoUrl: caseDoc.assignedAdvocate.userId?.profilePhotoUrl,
          }
        : null,
      createdAt: caseDoc.createdAt,
      updatedAt: caseDoc.updatedAt,
    },
    timeline: (caseDoc.statusHistory || []).map((entry) => ({
      status: entry.status,
      notes: entry.notes,
      changedBy: entry.changedBy
        ? { name: entry.changedBy.name, role: entry.changedBy.role }
        : null,
      changedAt: entry.changedAt,
    })),
  };
};

const getAssignedAdvocate = async (userId) => {
  const activeCase = await ServiceRequest.findOne({
    clientId: userId,
    assignedAdvocate: { $ne: null },
  })
    .populate({
      path: 'assignedAdvocate',
      populate: { path: 'userId', select: 'name email profilePhotoUrl phone' },
    })
    .sort({ assignedAt: -1 });

  if (!activeCase?.assignedAdvocate) {
    return { advocate: null };
  }

  const ap = activeCase.assignedAdvocate;

  const clientCount = await ServiceRequest.countDocuments({
    assignedAdvocate: ap._id,
    status: { $in: ['assigned', 'in_progress', 'awaiting_client'] },
  });

  return {
    advocate: {
      _id: ap._id,
      name: ap.userId?.name,
      email: ap.userId?.email,
      phone: ap.userId?.phone,
      profilePhotoUrl: ap.userId?.profilePhotoUrl,
      barCouncilNumber: ap.barCouncilNumber,
      stateBarCouncil: ap.stateBarCouncil,
      specializations: ap.specializations,
      languagesSpoken: ap.languagesSpoken,
      courtJurisdictions: ap.courtJurisdictions,
      yearsOfExperience: ap.yearsOfExperience,
      bio: ap.bio,
      education: ap.education,
      serviceOfferings: ap.serviceOfferings,
      availability: ap.availability,
      averageRating: ap.averageRating,
      totalReviews: ap.totalReviews,
      casesCompleted: ap.casesCompleted,
      activeClients: clientCount,
      verificationStatus: ap.verificationStatus,
    },
  };
};

const getNotifications = async (userId) => {
  const cases = await ServiceRequest.find({ clientId: userId })
    .select('title statusHistory')
    .sort({ updatedAt: -1 })
    .limit(50);

  const documents = await Document.find({ ownerId: userId, isDeleted: false })
    .select('originalFileName verificationStatus rejectionReason createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .limit(50);

  const notifications = [];

  for (const c of cases) {
    if (c.statusHistory?.length > 0) {
      for (let i = c.statusHistory.length - 1; i >= 0 && notifications.length < 50; i--) {
        const entry = c.statusHistory[i];
        notifications.push({
          id: `${c._id}-${entry.changedAt.getTime()}`,
          type: 'case_update',
          title: `Case "${c.title}"`,
          message: `Status updated to ${entry.status.replace(/_/g, ' ')}${entry.notes ? ': ' + entry.notes : ''}`,
          timestamp: entry.changedAt,
          read: false,
          caseId: c._id,
        });
      }
    }
  }

  for (const d of documents) {
    if (d.verificationStatus !== 'pending') {
      notifications.push({
        id: `${d._id}-verified`,
        type: 'document_update',
        title: `Document "${d.originalFileName}"`,
        message: d.verificationStatus === 'rejected'
          ? `Rejected: ${d.rejectionReason || 'No reason provided'}`
          : `Document has been ${d.verificationStatus}`,
        timestamp: d.updatedAt || d.createdAt,
        read: false,
        documentId: d._id,
      });
    }
  }

  notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return { notifications: notifications.slice(0, 50) };
};

const markNotificationRead = async (_userId, _notificationId) => {
  return { message: 'Notification marked as read', id: _notificationId };
};

const markAllNotificationsRead = async (_userId) => {
  return { message: 'All notifications marked as read' };
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
