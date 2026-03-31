import mongoose, { HydratedDocument, Model } from "mongoose";
import {
  feedbackCategories,
  feedbackSentiments,
  feedbackStatuses
} from "../types/feedback";

export type FeedbackDocument = HydratedDocument<{
  title: string;
  description: string;
  category: string;
  status: string;
  submitterName?: string;
  submitterEmail?: string;
  ai_category?: string;
  ai_sentiment?: string;
  ai_priority?: number;
  ai_summary?: string;
  ai_tags: string[];
  ai_processed: boolean;
  ai_error?: string;
  createdAt: Date;
  updatedAt: Date;
}>;

const feedbackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 120,
      trim: true
    },
    description: {
      type: String,
      required: true,
      minlength: 20,
      trim: true
    },
    category: {
      type: String,
      enum: feedbackCategories,
      required: true
    },
    status: {
      type: String,
      enum: feedbackStatuses,
      default: "New"
    },
    submitterName: {
      type: String,
      trim: true
    },
    submitterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value: string) =>
          !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Invalid email format"
      }
    },
    ai_category: {
      type: String
    },
    ai_sentiment: {
      type: String,
      enum: feedbackSentiments
    },
    ai_priority: {
      type: Number,
      min: 1,
      max: 10
    },
    ai_summary: {
      type: String
    },
    ai_tags: {
      type: [String],
      default: []
    },
    ai_processed: {
      type: Boolean,
      default: false
    },
    ai_error: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

feedbackSchema.index({ status: 1 });
feedbackSchema.index({ category: 1 });
feedbackSchema.index({ ai_priority: -1 });
feedbackSchema.index({ createdAt: -1 });

export const Feedback =
  (mongoose.models.Feedback as Model<FeedbackDocument> | undefined) ||
  mongoose.model<FeedbackDocument>("Feedback", feedbackSchema);
