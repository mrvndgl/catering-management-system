import express from "express";
import { adminStaffAuth } from "../middleware/auth.js";
import Product from "../models/Product.js";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  createCategory,
  getAllCategories,
} from "../controllers/productController.js";

const router = express.Router();

// Product Routes
router.post("/create", adminStaffAuth, createProduct);
router.get("/", getAllProducts);
router.put("/:product_id", adminStaffAuth, updateProduct);
router.delete("/:product_id", adminStaffAuth, deleteProduct);

// Category Routes
router.post("/category/create", adminStaffAuth, createCategory);

// Using the controller for the main categories route
router.get("/categories", adminStaffAuth, getAllCategories);

// Fallback route for getting distinct categories directly
// Note: You might want to remove this if using the controller version above
router.get("/categories-distinct", adminStaffAuth, async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

export default router;
