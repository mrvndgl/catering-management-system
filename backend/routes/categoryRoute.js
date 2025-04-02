import express from "express";
import { adminStaffAuth } from "../middleware/auth.js";
import {
  createCategory,
  getAllCategories,
  getDistinctCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// Create new category
router.post("/create", adminStaffAuth, createCategory);

// Get all categories
router.get("/", getAllCategories);

// Get distinct categories
router.get("/distinct", adminStaffAuth, getDistinctCategories);

// Update category
router.put("/:category_id", adminStaffAuth, updateCategory);

// Delete category
router.delete("/:category_id", adminStaffAuth, deleteCategory);

export default router;
