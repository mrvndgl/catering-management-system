import express from "express";
import { auth, adminStaffAuth } from "../middleware/auth.js";
import {
  createPayment,
  getAllPayments,
  getPaymentsByReservation,
  updatePaymentStatus,
  uploadPaymentProof,
  getPaymentProof,
} from "../controllers/paymentController.js";
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

// Customer payment routes
router.post("/", auth, createPayment);
router.post(
  "/:payment_id/proof",
  auth,
  upload.single("payment_proof"),
  uploadPaymentProof
);

export default router;
