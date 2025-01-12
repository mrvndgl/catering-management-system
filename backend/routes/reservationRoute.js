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
import { auth, adminStaffAuth } from "../middleware/auth.js"; // Changed import

const router = express.Router();

// Routes accessible by both admin and staff
router.get("/", adminStaffAuth, getAllReservations);
router.get(
  "/customer/:customer_id",
  adminStaffAuth,
  getReservationByCustomerId
);
router.put("/:reservation_id", adminStaffAuth, updateReservation);
router.delete("/:reservation_id", adminStaffAuth, deleteReservation);
router.get("/date/:date", adminStaffAuth, getReservationsByDate);
router.get("/accepted", adminStaffAuth, getAcceptedReservations);

// Customer-only routes
router.post("/", auth, createReservation);
router.get("/available-dates", auth, getAvailableDates);
router.get("/my-accepted", auth, getMyAcceptedReservations);
router.put("/:id/payment", auth, updatePaymentStatus);

export default router;
