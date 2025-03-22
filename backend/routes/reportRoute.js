import express from "express";
import { auth as authenticate } from "../middleware/auth.js";
import { generateMonthlyReport } from "../controllers/reportController.js";

const router = express.Router();

// Report generation route
router.get("/monthly/:year/:month", authenticate, generateMonthlyReport);

export default router;
