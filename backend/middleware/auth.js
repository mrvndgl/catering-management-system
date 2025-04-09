import fs from "fs";
import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AuthError";
  }
}

// Centralized token verification
const verifyToken = (token, requireRole = null) => {
  if (!token) {
    throw new AuthError("No authentication token found");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (requireRole) {
      const { type, employeeType } = decoded;
      if (
        type !== "employee" ||
        (Array.isArray(requireRole)
          ? !requireRole.includes(employeeType)
          : employeeType !== requireRole)
      ) {
        throw new AuthError(`Unauthorized access`, 403);
      }
    }

    return decoded;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    if (error.name === "JsonWebTokenError") {
      throw new AuthError("Invalid token");
    }
    if (error.name === "TokenExpiredError") {
      throw new AuthError("Token has expired");
    }
    throw new AuthError("Authentication failed");
  }
};

// Error handling middleware
const handleAuthError = (error, res) => {
  const statusCode = error.statusCode || 401;
  const message = error.message || "Authentication failed";
  res.status(statusCode).json({
    status: "error",
    message,
    timestamp: new Date().toISOString(),
  });
};

// Updated authentication middleware
export const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token);

    // Make sure decoded has the user id in the expected format
    req.user = {
      _id: decoded.id || decoded.userId || decoded._id,
      // Include other user properties if needed
    };

    next();
  } catch (error) {
    handleAuthError(error, res);
  }
};

// Admin-only authentication middleware
export const adminAuth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token, "admin");
    req.user = decoded;
    next();
  } catch (error) {
    handleAuthError(error, res);
  }
};

// Staff-only authentication middleware
export const staffAuth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const decoded = verifyToken(token, "staff");
    req.user = decoded;
    next();
  } catch (error) {
    handleAuthError(error, res);
  }
};

// Combined admin and staff authentication middleware
export const adminStaffAuth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    console.log("Received Token:", token); // Debugging

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = verifyToken(token, ["admin", "staff"]);
    console.log("Decoded User:", decoded); // Debugging
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth Error:", error.message); // Debugging
    handleAuthError(error, res);
  }
};

// Configure multer storage
// Update your multer configuration to handle filename generation better
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Make sure we have a valid filename
    if (!file.originalname) {
      cb(new Error("File has no name"), null);
      return;
    }

    // Create a safe filename with timestamp
    const timestamp = Date.now();
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${timestamp}-${safeFilename}`);
  },
});

// Create a more robust upload middleware
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Reject files without names
    if (!file.originalname || file.originalname === "undefined") {
      cb(new Error("Invalid filename"), false);
      return;
    }

    // Accept the file
    cb(null, true);
  },
});

// Middleware to handle file uploads - Fixed version
const handleImageUpload = upload.array("images", 5);
const processImages = (req, res, next) => {
  handleImageUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      if (req.body.existingImages) {
        try {
          existingImages = JSON.parse(req.body.existingImages);
        } catch (parseError) {
          console.warn("Error parsing existingImages JSON:", parseError);
        }
      }
      // Fall back to images field if it exists
      else if (req.body.images) {
        try {
          existingImages = Array.isArray(req.body.images)
            ? req.body.images
            : JSON.parse(req.body.images);
        } catch (parseError) {
          console.warn("Error parsing images JSON:", parseError);
        }
      }

      console.log("Processing existing images:", existingImages);

      // Ensure all existing images have proper URL structure and keep needed properties
      const formattedExistingImages = Array.isArray(existingImages)
        ? existingImages
            .filter((img) => img && img.url) // Ensure URL exists
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
            is_primary: formattedExistingImages.length === 0 && index === 0, // Only primary if first image and no existing
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

export { processImages };
