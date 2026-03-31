import { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import { Feedback, FeedbackDocument } from "../models/Feedback";
import { AuthenticatedRequest, getAuthUserFromRequest } from "../middleware/auth";
import { analyzeFeedback, summarizeThemes } from "../services/gemini.service";
import { storeEmailRecord } from "../services/email-record.service";
import {
  FeedbackCategory,
  FeedbackStatus,
  feedbackCategories,
  feedbackStatuses
} from "../types/feedback";
import { createResponse } from "../utils/api";
import {
  sanitizeEmail,
  sanitizeMultilineText,
  sanitizeText
} from "../utils/sanitize";

const processFeedbackAnalysis = async (feedbackId: string, title: string, description: string) => {
  try {
    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return;
    }

    const analysis = await analyzeFeedback(title, description);
    feedback.ai_category = analysis.category;
    feedback.ai_sentiment = analysis.sentiment;
    feedback.ai_priority = analysis.priority_score;
    feedback.ai_summary = analysis.summary;
    feedback.ai_tags = analysis.tags;
    feedback.ai_processed = true;
    feedback.ai_error = undefined;
    await feedback.save();
  } catch (error) {
    await Feedback.findByIdAndUpdate(feedbackId, {
      ai_processed: false,
      ai_error: error instanceof Error ? error.message : "AI analysis failed"
    });
  }
};

const rerunFeedbackAnalysis = async (feedback: FeedbackDocument) => {
  feedback.ai_processed = false;
  feedback.ai_error = undefined;
  feedback.status = "In Review";
  await feedback.save();

  try {
    const analysis = await analyzeFeedback(feedback.title, feedback.description);
    feedback.ai_category = analysis.category;
    feedback.ai_sentiment = analysis.sentiment;
    feedback.ai_priority = analysis.priority_score;
    feedback.ai_summary = analysis.summary;
    feedback.ai_tags = analysis.tags;
    feedback.ai_processed = true;
    feedback.ai_error = undefined;
    feedback.status = "In Review";
    await feedback.save();
    return feedback;
  } catch (error) {
    feedback.ai_processed = false;
    feedback.ai_error = error instanceof Error ? error.message : "AI analysis failed";
    feedback.status = "In Review";
    await feedback.save();
    throw error;
  }
};

const serialize = (doc: FeedbackDocument) => ({
  id: doc._id.toString(),
  title: doc.title,
  description: doc.description,
  category: doc.category,
  status: doc.status,
  submittedByUserId: doc.submittedByUserId ?? "",
  submittedByEmail: doc.submittedByEmail ?? "",
  submitterName: doc.submitterName ?? "",
  submitterEmail: doc.submitterEmail ?? "",
  ai_category: doc.ai_category ?? "",
  ai_sentiment: doc.ai_sentiment ?? "",
  ai_priority: doc.ai_priority ?? null,
  ai_summary: doc.ai_summary ?? "",
  ai_tags: doc.ai_tags ?? [],
  ai_processed: doc.ai_processed,
  ai_error: doc.ai_error ?? "",
  isTrashed: doc.isTrashed,
  trashedAt: doc.trashedAt ?? null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const buildQuery = (req: Request): FilterQuery<FeedbackDocument> => {
  const query: FilterQuery<FeedbackDocument> = {};
  const category = sanitizeText(req.query.category);
  const status = sanitizeText(req.query.status);
  const search = sanitizeText(req.query.search);
  const trashed = sanitizeText(req.query.trashed);

  if (trashed === "true") {
    query.isTrashed = true;
  } else if (trashed === "all") {
    query.isTrashed = { $in: [true, false] };
  } else {
    query.isTrashed = { $ne: true };
  }

  if (feedbackCategories.includes(category as FeedbackCategory)) {
    query.category = category;
  }

  if (feedbackStatuses.includes(status as FeedbackStatus)) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { ai_summary: { $regex: search, $options: "i" } }
    ];
  }

  return query;
};

export const submitFeedback = async (req: Request, res: Response) => {
  const title = sanitizeText(req.body.title);
  const description = sanitizeMultilineText(req.body.description);
  const category = sanitizeText(req.body.category) as FeedbackCategory;
  const submitterName = sanitizeText(req.body.submitterName);
  const submitterEmail = sanitizeEmail(req.body.submitterEmail);
  const authUser = getAuthUserFromRequest(req);
  const submittedByUserId = authUser?.id ?? sanitizeText(req.body.submittedByUserId);
  const submittedByEmail = authUser?.email ?? sanitizeEmail(req.body.submittedByEmail);

  if (!title) {
    res.status(400).json(createResponse(false, null, "Title is required", "VALIDATION_ERROR"));
    return;
  }

  if (description.length < 20) {
    res
      .status(400)
      .json(createResponse(false, null, "Description must be at least 20 characters", "VALIDATION_ERROR"));
    return;
  }

  if (!feedbackCategories.includes(category)) {
    res.status(400).json(createResponse(false, null, "Invalid category", "VALIDATION_ERROR"));
    return;
  }

  const feedback = await Feedback.create({
    title,
    description,
    category,
    submittedByUserId: submittedByUserId || undefined,
    submittedByEmail: submittedByEmail || undefined,
    submitterName: submitterName || undefined,
    submitterEmail: submitterEmail || undefined
  });

  await Promise.all([
    storeEmailRecord({
      email: submittedByEmail || submitterEmail,
      source: submittedByEmail ? "feedback_owner" : "feedback_submitter",
      userId: submittedByUserId || undefined,
      feedbackId: feedback._id.toString()
    }),
    submitterEmail && submitterEmail !== submittedByEmail
      ? storeEmailRecord({
          email: submitterEmail,
          source: "feedback_submitter",
          userId: submittedByUserId || undefined,
          feedbackId: feedback._id.toString()
        })
      : Promise.resolve()
  ]);

  res.status(201).json(createResponse(true, serialize(feedback), "Feedback submitted"));

  void processFeedbackAnalysis(feedback._id.toString(), title, description);
};

export const getFeedbackList = async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const sortBy = sanitizeText(req.query.sortBy) || "date";
  const sortDirection = sanitizeText(req.query.sortDirection) === "asc" ? 1 : -1;
  const query = buildQuery(req);

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    date: { createdAt: sortDirection },
    priority: { ai_priority: sortDirection, createdAt: -1 },
    sentiment: { ai_sentiment: sortDirection, createdAt: -1 }
  };

  const [items, total, statsAggregation] = await Promise.all([
    Feedback.find(query)
      .sort(sortMap[sortBy] ?? sortMap.date)
      .skip((page - 1) * limit)
      .limit(limit),
    Feedback.countDocuments(query),
    Feedback.aggregate([
      { $match: query },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalFeedback: { $sum: 1 },
                openItems: {
                  $sum: {
                    $cond: [{ $ne: ["$status", "Resolved"] }, 1, 0]
                  }
                },
                averagePriority: { $avg: "$ai_priority" }
              }
            }
          ],
          tags: [
            { $unwind: { path: "$ai_tags", preserveNullAndEmptyArrays: false } },
            { $group: { _id: "$ai_tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
          ]
        }
      }
    ])
  ]);

  const totals = statsAggregation[0]?.totals[0] ?? {
    totalFeedback: 0,
    openItems: 0,
    averagePriority: 0
  };

  res.status(200).json(
    createResponse(
      true,
      {
        items: items.map((item) => serialize(item)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalFeedback: totals.totalFeedback,
          openItems: totals.openItems,
          averagePriority: Number((totals.averagePriority ?? 0).toFixed(1)),
          mostCommonTag: statsAggregation[0]?.tags[0]?._id ?? "N/A"
        }
      },
      "Feedback fetched"
    )
  );
};

export const getMyFeedback = async (req: AuthenticatedRequest, res: Response) => {
  const email = req.user?.email;
  const userId = req.user?.id;

  if (!email && !userId) {
    res.status(401).json(createResponse(false, null, "Authentication required", "UNAUTHORIZED"));
    return;
  }

  const items = await Feedback.find({
    isTrashed: { $ne: true },
    $or: [
      { submittedByUserId: userId },
      { submittedByEmail: email },
      { submitterEmail: email }
    ]
  }).sort({ createdAt: -1 });

  res.status(200).json(
    createResponse(
      true,
      {
        items: items.map((item) => serialize(item))
      },
      "User feedback fetched"
    )
  );
};

export const getFeedbackById = async (req: Request, res: Response) => {
  const item = await Feedback.findById(req.params.id);
  if (!item) {
    res.status(404).json(createResponse(false, null, "Feedback not found", "NOT_FOUND"));
    return;
  }

  res.status(200).json(createResponse(true, serialize(item), "Feedback fetched"));
};

export const updateFeedbackStatus = async (req: Request, res: Response) => {
  const status = sanitizeText(req.body.status) as FeedbackStatus;
  if (!feedbackStatuses.includes(status)) {
    res.status(400).json(createResponse(false, null, "Invalid status", "VALIDATION_ERROR"));
    return;
  }

  const item = await Feedback.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!item) {
    res.status(404).json(createResponse(false, null, "Feedback not found", "NOT_FOUND"));
    return;
  }

  res.status(200).json(createResponse(true, serialize(item), "Status updated"));
};

export const deleteFeedback = async (req: Request, res: Response) => {
  const item = await Feedback.findByIdAndUpdate(
    req.params.id,
    {
      isTrashed: true,
      trashedAt: new Date()
    },
    { new: true }
  );
  if (!item) {
    res.status(404).json(createResponse(false, null, "Feedback not found", "NOT_FOUND"));
    return;
  }

  res.status(200).json(createResponse(true, serialize(item), "Feedback moved to trash"));
};

export const restoreFeedback = async (req: Request, res: Response) => {
  const item = await Feedback.findByIdAndUpdate(
    req.params.id,
    {
      isTrashed: false,
      trashedAt: undefined
    },
    { new: true }
  );

  if (!item) {
    res.status(404).json(createResponse(false, null, "Feedback not found", "NOT_FOUND"));
    return;
  }

  res.status(200).json(createResponse(true, serialize(item), "Feedback restored"));
};

export const retriggerFeedbackAnalysis = async (req: Request, res: Response) => {
  const item = await Feedback.findById(req.params.id);

  if (!item) {
    res.status(404).json(createResponse(false, null, "Feedback not found", "NOT_FOUND"));
    return;
  }

  try {
    const updated = await rerunFeedbackAnalysis(item);
    res.status(200).json(createResponse(true, serialize(updated), "AI analysis re-triggered successfully"));
  } catch (error) {
    res.status(500).json(
      createResponse(
        false,
        serialize(item),
        "AI re-analysis failed",
        error instanceof Error ? error.message : "AI_REANALYSIS_FAILED"
      )
    );
  }
};

export const getFeedbackSummary = async (_req: Request, res: Response) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const items = await Feedback.find({ createdAt: { $gte: sevenDaysAgo }, isTrashed: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(50);

  try {
    const themes = await summarizeThemes(
      items.map((item) => ({
        title: item.title,
        description: item.description,
        summary: item.ai_summary
      }))
    );

    res.status(200).json(
      createResponse(
        true,
        {
          themes,
          rangeStart: sevenDaysAgo,
          rangeEnd: new Date()
        },
        "AI trend summary generated"
      )
    );
  } catch (error) {
    res.status(200).json(
      createResponse(
        true,
        {
          themes: [],
          rangeStart: sevenDaysAgo,
          rangeEnd: new Date(),
          error: error instanceof Error ? error.message : "Summary generation failed"
        },
        "Summary unavailable"
      )
    );
  }
};
