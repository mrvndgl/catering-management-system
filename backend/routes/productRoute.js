import express from "express";
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
router.post("/create", createProduct);
router.get("/", getAllProducts);
router.put("/:product_id", updateProduct);
router.delete("/:product_id", deleteProduct);

// Category Routes
router.post("/category/create", createCategory);
router.get("/categories", getAllCategories);

export default router;
