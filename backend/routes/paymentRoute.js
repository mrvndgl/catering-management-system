import express from "express";
import { auth, adminStaffAuth } from "../middleware/auth.js";
import {
  createPayment,
  getAllPayments,
  getPaymentsByReservation,
  updatePaymentStatus,
  uploadPaymentProof,
  getPaymentProof,
  getPaymentStatuses,
  generateEReceipt,
  getReceipt,
} from "../controllers/paymentController.js";
import { cancelReservation } from "../controllers/reservationController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/payments/" });

// Admin/Staff payment routes
router.get("/admin/payments", adminStaffAuth, getAllPayments);
router.patch(
  "/admin/payments/:payment_id/status",
  adminStaffAuth,
  updatePaymentStatus
);
router.get(
  "/admin/payments/reservation/:reservation_id",
  adminStaffAuth,
  getPaymentsByReservation
);
router.get("/admin/payments/proof/:filename", adminStaffAuth, getPaymentProof);

// E-Receipt routes
router.get(
  "/admin/generate-receipt/:payment_id",
  adminStaffAuth,
  generateEReceipt
);
router.get("/receipts/:filename", auth, getReceipt);

// Customer payment routes
router.post("/", auth, createPayment);
router.post(
  "/upload",
  auth,
  upload.single("payment_proof"),
  uploadPaymentProof
);
router.put("/:reservationId/cancel", auth, cancelReservation);

// Add these routes to your paymentRoute.js
router.get("/status", auth, getPaymentStatuses);
router.post(
  "/upload",
  auth,
  upload.single("payment_proof"),
  uploadPaymentProof
);
router.post("/cash-intent", auth, createPayment); // Reuse or modify createPayment for this route
export default router;
