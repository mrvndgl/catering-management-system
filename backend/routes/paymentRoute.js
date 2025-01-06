import express from "express";
import { auth, adminStaffAuth } from "../middleware/auth.js";
import {
  createPayment,
  getAllPayments,
  getPaymentsByReservation,
  updatePaymentStatus,
  uploadPaymentProof,
} from "../controllers/paymentController.js";

const router = express.Router();

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

// Customer payment routes
router.post("/", auth, createPayment);
router.post("/:payment_id/proof", auth, uploadPaymentProof);

export default router;
