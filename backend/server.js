import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Category from "./models/Category.js";
import customerRoutes from "./routes/customerRoute.js";
import employeeRoutes from "./routes/employeeRoute.js";
import productRoutes from "./routes/productRoute.js";
import reservationRoutes from "./routes/reservationRoute.js";
import paymentRoutes from "./routes/paymentRoute.js";
import feedbackRoutes from "./routes/feedbackRoute.js";
import scheduleRoutes from "./routes/scheduleRoute.js";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!existsSync(uploadDir)) {
  try {
    await mkdir(uploadDir, { recursive: true });
    console.log("Uploads directory created successfully");
  } catch (error) {
    console.error("Error creating uploads directory:", error);
  }
}

// Logging middleware should be first
app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.path}`);
  next();
});

// CORS middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/schedules", scheduleRoutes);

const predefinedCategories = [
  {
    category_id: 1,
    category_name: "Beef",
    category_details: "All beef products",
  },
  {
    category_id: 2,
    category_name: "Pork",
    category_details: "All pork products",
  },
  {
    category_id: 3,
    category_name: "Chicken",
    category_details: "All chicken products",
  },
  {
    category_id: 4,
    category_name: "Seafood",
    category_details: "All seafood products",
  },
  {
    category_id: 5,
    category_name: "Noodles",
    category_details: "All noodle dishes",
  },
  {
    category_id: 6,
    category_name: "Vegetables",
    category_details: "All vegetable dishes",
  },
  {
    category_id: 7,
    category_name: "Dessert",
    category_details: "All desserts",
  },
];

async function initializeCategories() {
  try {
    for (const category of predefinedCategories) {
      const existingCategory = await Category.findOne({
        category_id: category.category_id,
      });
      if (!existingCategory) {
        await Category.create(category);
      }
    }
    console.log("Categories initialized successfully");
  } catch (error) {
    console.error("Error initializing categories:", error);
  }
}

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    initializeCategories();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "An unexpected error occurred",
    error: err.message,
  });
});

// Handle file upload errors
app.use((err, req, res, next) => {
  if (err.name === "MulterError") {
    return res.status(400).json({
      message: "File upload error",
      error: err.message,
    });
  }
  next(err);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
