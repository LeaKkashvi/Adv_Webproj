import mongoose from 'mongoose';

const advocateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    barCouncilNumber: {
      type: String,
      required: [true, 'Bar council number is required'],
      unique: true,
      trim: true,
      minlength: [1, 'Bar council number cannot be empty'],
    },
    stateBarCouncil: {
      type: String,
      required: [true, 'State bar council is required'],
      trim: true,
      minlength: [1, 'State bar council cannot be empty'],
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: [0, 'Years of experience cannot be negative'],
      max: [60, 'Years of experience cannot exceed 60'],
    },
    specializations: [
      {
        type: String,
        trim: true,
      },
    ],
    languagesSpoken: [
      {
        type: String,
        trim: true,
      },
    ],
    courtJurisdictions: [
      {
        type: String,
        trim: true,
      },
    ],
    bio: {
      type: String,
      maxlength: [2000, 'Bio must be at most 2000 characters'],
      default: '',
    },
    education: [
      {
        degree: { type: String, trim: true },
        institution: { type: String, trim: true },
        year: { type: Number },
      },
    ],
    credentialDocuments: [
      {
        type: { type: String, default: 'document' },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    verificationStatus: {
      type: String,
      enum: {
        values: ['pending', 'under_review', 'verified', 'rejected'],
        message: 'Verification status must be pending, under_review, verified, or rejected',
      },
      default: 'pending',
    },
    verificationNotes: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    managedClients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    managedCases: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceRequest',
      },
    ],
    serviceOfferings: [
      {
        serviceType: { type: String, trim: true },
        pricingModel: {
          type: String,
          enum: {
            values: ['fixed', 'hourly', 'consultation'],
            message: 'Pricing model must be fixed, hourly, or consultation',
          },
        },
        priceRange: { type: String },
        estimatedTimelineDays: { type: Number },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Total reviews cannot be negative'],
    },
    casesCompleted: {
      type: Number,
      default: 0,
      min: [0, 'Cases completed cannot be negative'],
    },
    availability: [
      {
        dayOfWeek: {
          type: String,
          enum: {
            values: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            message: 'Invalid day of week',
          },
        },
        slots: [
          {
            start: { type: String },
            end: { type: String },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  },
);

advocateProfileSchema.index({ verificationStatus: 1 });
advocateProfileSchema.index({ specializations: 1 });
advocateProfileSchema.index({ verificationStatus: 1, specializations: 1 });
advocateProfileSchema.index({ managedClients: 1 });
advocateProfileSchema.index({ managedCases: 1 });
advocateProfileSchema.index({ createdAt: -1 });

advocateProfileSchema.methods.toProfileJSON = function () {
  return {
    _id: this._id,
    userId: this.userId,
    barCouncilNumber: this.barCouncilNumber,
    stateBarCouncil: this.stateBarCouncil,
    yearsOfExperience: this.yearsOfExperience,
    specializations: this.specializations,
    languagesSpoken: this.languagesSpoken,
    courtJurisdictions: this.courtJurisdictions,
    bio: this.bio,
    education: this.education,
    credentialDocuments: this.credentialDocuments,
    verificationStatus: this.verificationStatus,
    verificationNotes: this.verificationNotes,
    rejectionReason: this.rejectionReason,
    managedClients: this.managedClients,
    managedCases: this.managedCases,
    serviceOfferings: this.serviceOfferings,
    averageRating: this.averageRating,
    totalReviews: this.totalReviews,
    casesCompleted: this.casesCompleted,
    availability: this.availability,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const AdvocateProfile = mongoose.model('AdvocateProfile', advocateProfileSchema);

export default AdvocateProfile;
