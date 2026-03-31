import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      trim: true,
      default: "FeedPulse Admin"
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String
    },
    verificationEmailSentAt: {
      type: Date
    },
    verificationEmailError: {
      type: String
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user"
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ email: 1 }, { unique: true });

export type UserDocument = mongoose.HydratedDocument<{
  email: string;
  passwordHash: string;
  name: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationEmailSentAt?: Date;
  verificationEmailError?: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}>;

export const User =
  (mongoose.models.User as mongoose.Model<UserDocument> | undefined) ||
  mongoose.model<UserDocument>("User", userSchema);
