import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../config/env.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      match: [
        /^[a-zA-Z0-9_]+$/,
        'Username may only contain letters, numbers, and underscores',
      ],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      match: [/^\+?[\d\s-]{10,15}$/, 'Please provide a valid mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['client', 'advocate', 'admin'],
        message: 'Role must be client, advocate, or admin',
      },
      default: 'client',
    },
    profilePhotoUrl: {
      type: String,
      default: '',
    },
    countryOfResidence: {
      type: String,
      default: '',
    },
    currentAddress: {
      type: String,
      default: '',
    },
    indianAddress: {
      type: String,
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    profileStatus: {
      type: String,
      enum: {
        values: ['incomplete', 'pending_review', 'active', 'suspended'],
        message: 'Profile status must be incomplete, pending_review, active, or suspended',
      },
      default: 'incomplete',
    },
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
    ],
    assignedCases: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceRequest',
      },
    ],
    emailVerificationToken: String,
    emailVerificationExpiry: Date,
    passwordResetToken: String,
    passwordResetExpiry: Date,
    accountStatus: {
      type: String,
      enum: {
        values: ['active', 'suspended', 'deleted'],
        message: 'Account status must be active, suspended, or deleted',
      },
      default: 'active',
    },
    refreshTokens: [
      {
        token: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastLogin: Date,
  },
  {
    timestamps: true,
  },
);

userSchema.index({ role: 1, accountStatus: 1 });
userSchema.index({ role: 1, profileStatus: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, config.bcryptSaltRounds);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toProfileJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    username: this.username,
    email: this.email,
    phone: this.phone,
    role: this.role,
    profilePhotoUrl: this.profilePhotoUrl,
    countryOfResidence: this.countryOfResidence,
    currentAddress: this.currentAddress,
    indianAddress: this.indianAddress,
    profileStatus: this.profileStatus,
    isEmailVerified: this.isEmailVerified,
    accountStatus: this.accountStatus,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
