import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    serviceCategory: {
      type: String,
      required: true,
      enum: [
        "property_registration",
        "land_documentation",
        "property_dispute",
        "power_of_attorney",
        "legal_documentation",
        "general_legal_assistance",
      ],
      index: true,
    },
    linkedProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "urgent"],
      default: "normal",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "assigned",
        "in_progress",
        "awaiting_client",
        "resolved",
        "closed",
        "rejected",
      ],
      default: "submitted",
      index: true,
    },
    assignedAdvocate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdvocateProfile",
      default: null,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
    },
    clientNotes: {
      type: String,
      maxlength: 2000,
    },
    advocateNotes: {
      type: String,
      maxlength: 2000,
    },
    adminNotes: {
      type: String,
      maxlength: 2000,
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: {
          type: String,
          maxlength: 1000,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

serviceRequestSchema.index({ createdAt: -1 });

export default mongoose.models.ServiceRequest ||
  mongoose.model("ServiceRequest", serviceRequestSchema);
