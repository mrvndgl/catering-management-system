import express from "express";
import {
  createReservation,
  getAllReservations,
  getReservationByCustomerId,
  updateReservation,
  deleteReservation,
  getAvailableDates,
  getReservationsByDate,
  getAcceptedReservations,
  getMyAcceptedReservations,
  updatePaymentStatus,
} from "../controllers/reservationController.js";
import { auth, adminAuth } from "../middleware/auth.js";

const router = express.Router();

// Add auth middleware to protected routes
router.post("/", auth, createReservation);
router.get("/", adminAuth, getAllReservations);
router.get("/available-dates", auth, getAvailableDates);
router.get("/customer/:customer_id", auth, getReservationByCustomerId);
router.put("/:reservation_id", adminAuth, updateReservation); // Important for accepting reservations
router.delete("/:reservation_id", adminAuth, deleteReservation);

router.get("/date/:date", auth, getReservationsByDate);
router.get("/accepted", auth, getAcceptedReservations);
router.get("/my-accepted", auth, getMyAcceptedReservations);
router.put("/:id/payment", auth, updatePaymentStatus);

export default router;
