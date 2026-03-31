import mongoose from "mongoose";

const emailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    source: {
      type: String,
      enum: ["registration", "feedback_submitter", "feedback_owner"],
      required: true
    },
    userId: {
      type: String
    },
    feedbackId: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

emailSchema.index({ email: 1 });
emailSchema.index({ source: 1 });

export const Email =
  (mongoose.models.Email as mongoose.Model<mongoose.HydratedDocument<Record<string, unknown>>> | undefined) ||
  mongoose.model("Email", emailSchema);
