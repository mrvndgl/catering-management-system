import express from "express";
import {
  getAllFeedback,
  updateFeedbackStatus,
} from "../controllers/feedbackController.js";

const router = express.Router();

router.post("/", createFeedback);
router.get("/", getAllFeedback);
router.patch("/:id", updateFeedbackStatus);

export default router;
