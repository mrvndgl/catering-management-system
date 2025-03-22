import express from "express";
import {
  getBookedDates,
  testEndpoint,
  getDbInfo,
  directQuery,
  insertTestData,
} from "../controllers/scheduleController.js";

const router = express.Router();

// Main endpoint
router.get("/booked-dates", getBookedDates);

// Test endpoints
router.get("/test", testEndpoint);
router.get("/db-info", getDbInfo);
router.get("/direct-query", directQuery);
router.get("/insert-test", insertTestData);

export default router;
