import express from "express";
import { adminStaffAuth } from "../middleware/auth.js";
import {
  getPricingSettings,
  updatePricingSettings,
} from "../controllers/settingsController.js";

const router = express.Router();

// Get pricing settings
router.get("/pricing", getPricingSettings);

// Update pricing settings
router.post("/pricing", adminStaffAuth, updatePricingSettings);

export default router;
