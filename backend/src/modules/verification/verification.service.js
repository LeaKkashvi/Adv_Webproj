import { Readable } from 'stream';
import AdvocateProfile from '../../models/AdvocateProfile.js';
import ApiError from '../../utils/apiError.js';
import logger from '../../utils/logger.js';

let cloudinary;
try {
  const mod = await import('../../config/cloudinary.js');
  cloudinary = mod.cloudinary;
} catch {
  cloudinary = null;
}

const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    if (!cloudinary) {
      return reject(new Error('Cloudinary not configured'));
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        access_mode: 'authenticated',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

const submitCredentials = async (userId, files, profileData) => {
  const profile = await AdvocateProfile.findOne({ userId });
  if (!profile) {
    throw ApiError.notFound('Advocate profile not found');
  }

  const allowedProfileFields = [
    'yearsOfExperience',
    'specializations',
    'languagesSpoken',
    'courtJurisdictions',
    'bio',
    'education',
    'serviceOfferings',
    'availability',
  ];

  for (const field of allowedProfileFields) {
    if (profileData[field] !== undefined) {
      profile[field] = profileData[field];
    }
  }

  if (files && files.length > 0) {
    const newDocuments = [];
    for (const file of files) {
      const folder = `nri-portal/credentials/${userId}`;
      const result = await uploadBufferToCloudinary(file.buffer, folder);
      newDocuments.push({
        type: file.originalname,
        url: result.secure_url,
        uploadedAt: new Date(),
      });
    }
    profile.credentialDocuments = [
      ...profile.credentialDocuments,
      ...newDocuments,
    ];
  }

  if (
    profile.verificationStatus === 'rejected' ||
    profile.verificationStatus === 'pending'
  ) {
    profile.verificationStatus = 'under_review';
    profile.rejectionReason = '';
    profile.verificationNotes = '';
  }

  await profile.save();

  logger.info(`Credentials submitted for advocate: ${userId}`);

  return profile.toProfileJSON();
};

const getVerificationStatus = async (userId) => {
  const profile = await AdvocateProfile.findOne({ userId }).populate(
    'userId',
    'name email profilePhotoUrl',
  );

  if (!profile) {
    throw ApiError.notFound('Advocate profile not found');
  }

  return profile.toProfileJSON();
};

const getVerificationQueue = async ({ page = 1, limit = 20, status }) => {
  const query = {};
  if (status) {
    query.verificationStatus = status;
  } else {
    query.verificationStatus = { $in: ['under_review', 'pending'] };
  }

  const total = await AdvocateProfile.countDocuments(query);
  const profiles = await AdvocateProfile.find(query)
    .populate('userId', 'name email phone profilePhotoUrl')
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    profiles: profiles.map((p) => p.toProfileJSON()),
    pagination: { page, limit, total },
  };
};

const getAdvocateDetailForReview = async (advocateId) => {
  const profile = await AdvocateProfile.findById(advocateId).populate(
    'userId',
    'name email phone profilePhotoUrl isEmailVerified createdAt',
  );

  if (!profile) {
    throw ApiError.notFound('Advocate profile not found');
  }

  return profile.toProfileJSON();
};

const approveVerification = async (adminId, advocateId, notes) => {
  const profile = await AdvocateProfile.findById(advocateId);
  if (!profile) {
    throw ApiError.notFound('Advocate profile not found');
  }

  if (profile.verificationStatus === 'verified') {
    throw ApiError.badRequest('This advocate is already verified');
  }

  profile.verificationStatus = 'verified';
  profile.verificationNotes = notes || '';
  profile.rejectionReason = '';
  await profile.save();

  logger.info(`Advocate ${advocateId} approved by admin ${adminId}`);

  return profile.toProfileJSON();
};

const rejectVerification = async (adminId, advocateId, reason, notes) => {
  if (!reason || reason.trim().length === 0) {
    throw ApiError.badRequest('Rejection reason is required');
  }

  const profile = await AdvocateProfile.findById(advocateId);
  if (!profile) {
    throw ApiError.notFound('Advocate profile not found');
  }

  if (profile.verificationStatus === 'verified') {
    throw ApiError.badRequest('Cannot reject an already verified advocate');
  }

  profile.verificationStatus = 'rejected';
  profile.rejectionReason = reason;
  profile.verificationNotes = notes || '';
  await profile.save();

  logger.info(
    `Advocate ${advocateId} rejected by admin ${adminId}. Reason: ${reason}`,
  );

  return profile.toProfileJSON();
};

const requestMoreInfo = async (adminId, advocateId, notes) => {
  if (!notes || notes.trim().length === 0) {
    throw ApiError.badRequest(
      'Notes explaining what information is needed are required',
    );
  }

  const profile = await AdvocateProfile.findById(advocateId);
  if (!profile) {
    throw ApiError.notFound('Advocate profile not found');
  }

  profile.verificationNotes = notes;
  await profile.save();

  logger.info(
    `More info requested for advocate ${advocateId} by admin ${adminId}`,
  );

  return profile.toProfileJSON();
};

const removeCredentialDocument = async (userId, documentIndex) => {
  const profile = await AdvocateProfile.findOne({ userId });
  if (!profile) {
    throw ApiError.notFound('Advocate profile not found');
  }

  if (
    documentIndex < 0 ||
    documentIndex >= profile.credentialDocuments.length
  ) {
    throw ApiError.badRequest('Invalid document index');
  }

  profile.credentialDocuments.splice(documentIndex, 1);
  await profile.save();

  return profile.toProfileJSON();
};

const getVerifiedAdvocates = async ({
  page = 1,
  limit = 20,
  specialization,
  language,
  state,
  search,
}) => {
  const query = { verificationStatus: 'verified' };

  if (specialization) {
    query.specializations = {
      $in: Array.isArray(specialization) ? specialization : [specialization],
    };
  }
  if (language) {
    query.languagesSpoken = {
      $in: Array.isArray(language) ? language : [language],
    };
  }
  if (state) {
    query.stateBarCouncil = { $regex: state, $options: 'i' };
  }

  let profilesQuery = AdvocateProfile.find(query).populate(
    'userId',
    'name email profilePhotoUrl',
  );

  if (search) {
    const User = (await import('../../models/User.js')).default;
    const userMatches = await User.find({
      name: { $regex: search, $options: 'i' },
      role: 'advocate',
    }).select('_id');
    const userIds = userMatches.map((u) => u._id);
    query.$or = [{ userId: { $in: userIds } }];
    profilesQuery = AdvocateProfile.find(query).populate(
      'userId',
      'name email profilePhotoUrl',
    );
  }

  const total = await AdvocateProfile.countDocuments(query);
  const profiles = await profilesQuery
    .sort({ averageRating: -1, casesCompleted: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    profiles: profiles.map((p) => p.toProfileJSON()),
    pagination: { page, limit, total },
  };
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
