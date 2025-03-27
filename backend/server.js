import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { mkdir, chmod } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Import routes
import Category from "./models/Category.js";
import customerRoutes from "./routes/customerRoute.js";
import employeeRoutes from "./routes/employeeRoute.js";
import productRoutes from "./routes/productRoute.js";
import reservationRoutes from "./routes/reservationRoute.js";
import paymentRoutes from "./routes/paymentRoute.js";
import feedbackRoutes from "./routes/feedbackRoute.js";
import scheduleRoutes from "./routes/scheduleRoute.js";
import reportRoutes from "./routes/reportRoute.js";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize express app
dotenv.config();
const app = express();

// Create required directories
async function initializeDirectories() {
  const directories = [
    path.join(__dirname, "uploads"),
    path.join(__dirname, "uploads", "payments"),
  ];

  for (const dir of directories) {
    if (!existsSync(dir)) {
      try {
        await mkdir(dir, { recursive: true });
        await chmod(dir, 0o755);
        console.log(`Directory created successfully: ${dir}`);
      } catch (error) {
        console.error(`Error creating directory ${dir}:`, error);
      }
    }
  }
}

// Initialize directories
await initializeDirectories();

// Global middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving middleware
app.use("/uploads", (req, res, next) => {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=3600",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "image/*",
  });
  console.log("Image request received:", {
    path: req.path,
    method: req.method,
    headers: req.headers,
  });
  next();
});

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  "/api/payments/proof",
  express.static(path.join(__dirname, "uploads", "payments"))
);

// Debug endpoints
app.get("/api/debug/image/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);
  const exists = existsSync(filePath);
  res.json({
    exists,
    filePath,
    requestedFile: req.params.filename,
    fullUrl: `${req.protocol}://${req.get("host")}/uploads/${
      req.params.filename
    }`,
  });
});

app.get("/api/debug/payment-proof/:filename", (req, res) => {
  const filePath = path.join(
    __dirname,
    "uploads",
    "payments",
    req.params.filename
  );
  const exists = existsSync(filePath);
  res.json({
    exists,
    filePath,
    requestedFile: req.params.filename,
  });
});

// API Routes
app.use("/api/customers", customerRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/reports", reportRoutes);

// Predefined categories
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
];

// Initialize categories
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

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
