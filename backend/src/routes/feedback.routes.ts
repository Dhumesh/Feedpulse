import { Router } from "express";
import {
  deleteFeedback,
  getFeedbackById,
  getFeedbackList,
  getFeedbackSummary,
  submitFeedback,
  updateFeedbackStatus
} from "../controllers/feedback.controller";
import { requireAdmin } from "../middleware/auth";
import { feedbackRateLimit } from "../middleware/rateLimit";

const router = Router();

router.post("/", feedbackRateLimit, submitFeedback);
router.get("/summary", requireAdmin, getFeedbackSummary);
router.get("/", requireAdmin, getFeedbackList);
router.get("/:id", requireAdmin, getFeedbackById);
router.patch("/:id", requireAdmin, updateFeedbackStatus);
router.delete("/:id", requireAdmin, deleteFeedback);

export default router;
