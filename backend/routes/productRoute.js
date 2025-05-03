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
      let existingImages = [];

      if (req.body.existingImages) {
        try {
          existingImages = JSON.parse(req.body.existingImages);
        } catch (parseError) {
          console.warn("Error parsing existingImages JSON:", parseError);
        }
      } else if (req.body.images) {
        try {
          existingImages = Array.isArray(req.body.images)
            ? req.body.images
            : JSON.parse(req.body.images);
        } catch (parseError) {
          console.warn("Error parsing images JSON:", parseError);
        }
      }

      // Filter out any images with invalid URLs
      const formattedExistingImages = Array.isArray(existingImages)
        ? existingImages
            .filter((img) => img && img.url && !img.url.includes("/undefined")) // Filter out invalid URLs
            .map((img) => ({
              url: img.url,
              filename: img.filename || path.basename(img.url),
              is_primary: !!img.is_primary,
            }))
        : [];

      // Process newly uploaded files
      const newImageData = req.files
        ? req.files.map((file, index) => ({
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            is_primary: false, // Set to false by default
          }))
        : [];

      // Combine all images
      const combinedImages = [...formattedExistingImages, ...newImageData];

      // Ensure only one primary image - set the first one as primary
      if (combinedImages.length > 0) {
        // First, reset all primary flags
        combinedImages.forEach((img) => (img.is_primary = false));

        // Then set the first one as primary
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
router.delete("/products/:product_id", deleteProduct);
router.get("/", getAllProducts);

export default router;
