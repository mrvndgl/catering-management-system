import express from "express";
import {
  createPayment,
  getAllPayments,
  getPaymentsByReservation,
  updatePaymentStatus,
  uploadPaymentProof,
} from "../controllers/paymentController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Payment routes
router.post("/", auth, createPayment);
router.get("/", auth, getAllPayments);
router.get("/reservation/:reservation_id", auth, getPaymentsByReservation);
router.patch("/:payment_id/status", auth, updatePaymentStatus);
router.post("/:payment_id/proof", auth, uploadPaymentProof);

export default router;
