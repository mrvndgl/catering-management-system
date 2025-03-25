import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { adminStaffAuth } from "../middleware/auth.js";
import Product from "../models/Product.js";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  createCategory,
  getAllCategories,
  archiveProduct,
  unarchiveProduct,
} from "../controllers/productController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Ensure "uploads" directory exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Middleware to handle file uploads
const handleImageUpload = upload.array("images", 5);
const processImages = (req, res, next) => {
  handleImageUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (req.files && req.files.length > 0) {
      const imageData = req.files.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        is_primary: index === 0,
      }));

      const existingImages = Array.isArray(req.body.images)
        ? req.body.images
        : req.body.images
        ? JSON.parse(req.body.images)
        : [];
      req.body.images = [...existingImages, ...imageData];
    }

    next();
  });
};

// ===== Product Routes =====
router.post("/create", adminStaffAuth, processImages, createProduct);
router.put("/:product_id", adminStaffAuth, processImages, updateProduct);
router.delete("/:product_id", adminStaffAuth, deleteProduct);
router.put("/:product_id/archive", adminStaffAuth, archiveProduct);
router.put("/:product_id/unarchive", adminStaffAuth, unarchiveProduct);
router.get("/", getAllProducts);

// ===== Category Routes =====
router.post("/category/create", adminStaffAuth, createCategory);
router.get("/categories", adminStaffAuth, getAllCategories);
router.get("/categories-distinct", adminStaffAuth, async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

export default router;
