import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    linkedProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
    },
    fileType: {
      type: String,
    },
    fileSizeBytes: {
      type: Number,
    },
    cloudinaryPublicId: {
      type: String,
    },
    cloudinaryUrl: {
      type: String,
    },
    category: {
      type: String,
      enum: ["property", "identity", "credential", "other"],
      default: "other",
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ createdAt: -1 });

export default mongoose.models.Document ||
  mongoose.model("Document", documentSchema);
