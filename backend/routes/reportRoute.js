import express from "express";
import { auth as authenticate } from "../middleware/auth.js";
import {
  generateMonthlyReport,
  generateYearlyReport,
  getOverallStats,
} from "../controllers/reportController.js";

const router = express.Router();

// Monthly report generation route
router.get(
  "/monthly/:year/:month",
  authenticate,
  (req, res, next) => {
    // Validate year and month format
    const { year, month } = req.params;

    if (!year || !month) {
      return res.status(400).json({
        message: "Year and month are required",
      });
    }

    const numMonth = parseInt(month);
    if (isNaN(numMonth) || numMonth < 1 || numMonth > 12) {
      return res.status(400).json({
        message: "Month must be between 1 and 12",
      });
    }

    const numYear = parseInt(year);
    if (isNaN(numYear) || numYear < 1900 || numYear > 2100) {
      return res.status(400).json({
        message: "Please provide a valid year",
      });
    }

    next();
  },
  generateMonthlyReport
);

// New yearly report generation route
router.get(
  "/yearly/:year",
  authenticate,
  (req, res, next) => {
    // Validate year format
    const { year } = req.params;

    if (!year) {
      return res.status(400).json({
        message: "Year is required",
      });
    }

    const numYear = parseInt(year);
    if (isNaN(numYear) || numYear < 1900 || numYear > 2100) {
      return res.status(400).json({
        message: "Please provide a valid year",
      });
    }

    next();
  },
  generateYearlyReport
);

router.get("/overall-stats", authenticate, getOverallStats);

export default router;
