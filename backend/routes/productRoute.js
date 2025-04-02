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
  archiveProduct,
  unarchiveProduct,
  getArchivedProducts,
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

    try {
      // Parse existing images from request body
      const existingImages = Array.isArray(req.body.images)
        ? req.body.images
        : req.body.images
        ? JSON.parse(req.body.images)
        : [];

      console.log("Processing existing images:", existingImages);

      // Ensure all existing images have proper URL structure and keep needed properties
      const formattedExistingImages = existingImages
        .filter((img) => !img.isNew && img.url) // Filter out new images (they'll be uploaded) and ensure URL exists
        .map((img) => ({
          url: img.url.startsWith("/uploads/") ? img.url : img.url,
          filename: img.filename || path.basename(img.url),
          is_primary: !!img.is_primary,
        }));

      // Process newly uploaded files
      const newImageData = req.files
        ? req.files.map((file, index) => ({
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            is_primary: existingImages.length === 0 && index === 0, // Only primary if first image and no existing
          }))
        : [];

      // Take primary flag into account when combining
      const combinedImages = [...formattedExistingImages, ...newImageData];

      // If there's no primary image, set the first one as primary
      if (
        !combinedImages.some((img) => img.is_primary) &&
        combinedImages.length > 0
      ) {
        combinedImages[0].is_primary = true;
      }

      // Set processed images to request body
      req.body.images = combinedImages;

      console.log("Final processed images:", req.body.images);
      next();
    } catch (parseError) {
      console.error("Image processing error:", parseError);
      return res.status(400).json({
        message: "Error processing images",
        error: parseError.message,
      });
    }
  });
};

// ===== Product Routes =====
router.post("/create", adminStaffAuth, processImages, createProduct);
router.put("/:product_id", adminStaffAuth, processImages, updateProduct);
router.delete("/:product_id", adminStaffAuth, deleteProduct);
router.get("/archived", getArchivedProducts);
router.put("/:product_id/archive", adminStaffAuth, archiveProduct);
router.put("/:product_id/unarchive", adminStaffAuth, unarchiveProduct);
router.get("/", getAllProducts);

export default router;
