import { Router } from "express";
import {
  deleteFeedback,
  getFeedbackById,
  getFeedbackList,
  getMyFeedback,
  getFeedbackSummary,
  retriggerFeedbackAnalysis,
  restoreFeedback,
  submitFeedback,
  updateFeedbackStatus
} from "../controllers/feedback.controller";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { feedbackRateLimit } from "../middleware/rateLimit";

const router = Router();

/**
 * @openapi
 * /api/feedback:
 *   post:
 *     tags:
 *       - Feedback
 *     summary: Submit new feedback
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackCreateRequest'
 *     responses:
 *       201:
 *         description: Feedback submitted
 */
router.post("/", feedbackRateLimit, submitFeedback);
router.get("/mine", requireAuth, getMyFeedback);
/**
 * @openapi
 * /api/feedback/summary:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get AI summary for recent feedback
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary generated
 */
router.get("/summary", requireAdmin, getFeedbackSummary);
/**
 * @openapi
 * /api/feedback:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: List feedback for admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Feedback fetched
 */
router.get("/", requireAdmin, getFeedbackList);
/**
 * @openapi
 * /api/feedback/{id}/reanalyze:
 *   post:
 *     tags:
 *       - Feedback
 *     summary: Re-run Gemini AI analysis for a feedback item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI analysis re-triggered
 */
router.post("/:id/reanalyze", requireAdmin, retriggerFeedbackAnalysis);
/**
 * @openapi
 * /api/feedback/{id}/restore:
 *   patch:
 *     tags:
 *       - Feedback
 *     summary: Restore feedback from trash
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feedback restored
 */
router.patch("/:id/restore", requireAdmin, restoreFeedback);
/**
 * @openapi
 * /api/feedback/{id}:
 *   get:
 *     tags:
 *       - Feedback
 *     summary: Get one feedback item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feedback fetched
 */
router.get("/:id", requireAdmin, getFeedbackById);
/**
 * @openapi
 * /api/feedback/{id}:
 *   patch:
 *     tags:
 *       - Feedback
 *     summary: Update feedback status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FeedbackStatusUpdateRequest'
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/:id", requireAdmin, updateFeedbackStatus);
/**
 * @openapi
 * /api/feedback/{id}:
 *   delete:
 *     tags:
 *       - Feedback
 *     summary: Delete feedback
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feedback deleted
 */
router.delete("/:id", requireAdmin, deleteFeedback);

export default router;
