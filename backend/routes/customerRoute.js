import express from "express";
import { customerController } from "../controllers/customerController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/signup", customerController.signup);
router.post("/login", customerController.login);

// Protected routes
router.get("/profile", auth, customerController.getProfile);

export default router;
