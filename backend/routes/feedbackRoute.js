import express from "express";
import {
  createFeedback,
  getUserFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  replyToFeedback,
  getPublicFeedback,
} from "../controllers/feedbackController.js";
import { auth, adminAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createFeedback);
router.get("/my-feedback", auth, getUserFeedback);
router.get("/all", auth, adminAuth, getAllFeedback);
router.patch("/:id", auth, adminAuth, updateFeedbackStatus);
router.post("/:id/reply", auth, adminAuth, replyToFeedback);

// New route for public feedback
router.get("/public", getPublicFeedback);

export default router;
