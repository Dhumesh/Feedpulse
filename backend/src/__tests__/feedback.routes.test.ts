import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { env } from "../config/env";
import feedbackRoutes from "../routes/feedback.routes";

const createFeedbackDoc = (overrides: Record<string, unknown> = {}) => ({
  _id: { toString: () => "feedback-1" },
  title: "Need dark mode",
  description: "Please add dark mode support to reduce eye strain at night.",
  category: "Feature Request",
  status: "New",
  submittedByUserId: "",
  submittedByEmail: "",
  submitterName: "Jane",
  submitterEmail: "jane@example.com",
  ai_category: "",
  ai_sentiment: "",
  ai_priority: null,
  ai_summary: "",
  ai_tags: [],
  ai_processed: false,
  ai_error: "",
  isTrashed: false,
  trashedAt: null,
  createdAt: new Date("2026-03-31T00:00:00.000Z"),
  updatedAt: new Date("2026-03-31T00:00:00.000Z"),
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides
});

const feedbackCreateMock = jest.fn();
const feedbackFindByIdMock = jest.fn();
const feedbackFindByIdAndUpdateMock = jest.fn();

jest.mock("../models/Feedback", () => ({
  Feedback: {
    create: (...args: unknown[]) => feedbackCreateMock(...args),
    findById: (...args: unknown[]) => feedbackFindByIdMock(...args),
    findByIdAndUpdate: (...args: unknown[]) => feedbackFindByIdAndUpdateMock(...args)
  }
}));

const analyzeFeedbackMock = jest.fn();

jest.mock("../services/gemini.service", () => ({
  analyzeFeedback: (...args: unknown[]) => analyzeFeedbackMock(...args),
  summarizeThemes: jest.fn()
}));

const storeEmailRecordMock = jest.fn().mockResolvedValue(undefined);

jest.mock("../services/email-record.service", () => ({
  storeEmailRecord: (...args: unknown[]) => storeEmailRecordMock(...args)
}));

describe("feedback routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/feedback", feedbackRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
    feedbackFindByIdAndUpdateMock.mockResolvedValue(undefined);
  });

  it("POST /api/feedback saves valid feedback and triggers AI analysis", async () => {
    const createdFeedback = createFeedbackDoc();
    feedbackCreateMock.mockResolvedValue(createdFeedback);
    feedbackFindByIdMock.mockResolvedValue(createdFeedback);
    analyzeFeedbackMock.mockResolvedValue({
      category: "Feature Request",
      sentiment: "Positive",
      priority_score: 8,
      summary: "Dark mode is a recurring accessibility request.",
      tags: ["UI", "Accessibility"]
    });

    const response = await request(app).post("/api/feedback").send({
      title: "Need dark mode",
      description: "Please add dark mode support to reduce eye strain at night.",
      category: "Feature Request",
      submitterName: "Jane",
      submitterEmail: "jane@example.com"
    });

    expect(response.status).toBe(201);
    expect(feedbackCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Need dark mode",
        category: "Feature Request",
        submitterName: "Jane",
        submitterEmail: "jane@example.com"
      })
    );
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe("Need dark mode");
    expect(analyzeFeedbackMock).toHaveBeenCalledWith(
      "Need dark mode",
      "Please add dark mode support to reduce eye strain at night."
    );
    expect(createdFeedback.save).toHaveBeenCalled();
  });

  it("POST /api/feedback rejects an empty title", async () => {
    const response = await request(app).post("/api/feedback").send({
      title: "",
      description: "Please add dark mode support to reduce eye strain at night.",
      category: "Feature Request"
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      data: null,
      error: "VALIDATION_ERROR",
      message: "Title is required"
    });
    expect(feedbackCreateMock).not.toHaveBeenCalled();
    expect(analyzeFeedbackMock).not.toHaveBeenCalled();
  });

  it("PATCH /api/feedback/:id updates status for an authenticated admin", async () => {
    const updatedFeedback = createFeedbackDoc({ status: "Resolved" });
    feedbackFindByIdAndUpdateMock.mockResolvedValue(updatedFeedback);
    const token = jwt.sign({ id: "admin-1", email: "admin@example.com", role: "admin" }, env.jwtSecret);

    const response = await request(app)
      .patch("/api/feedback/feedback-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Resolved" });

    expect(response.status).toBe(200);
    expect(feedbackFindByIdAndUpdateMock).toHaveBeenCalledWith(
      "feedback-1",
      { status: "Resolved" },
      { new: true, runValidators: true }
    );
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("Resolved");
  });
});
