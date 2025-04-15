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
  getPaidReservations,
  getMyReservations,
  cancelReservation,
  getAcceptedReservationsByMonth,
  editReservation,
  updateReservationStatus,
  checkReservationAvailability,
} from "../controllers/reservationController.js";
import { auth, adminStaffAuth } from "../middleware/auth.js";

const router = express.Router();

// Routes accessible by both admin and staff
router.get("/", adminStaffAuth, getAllReservations);
router.get(
  "/customer/:customer_id",
  adminStaffAuth,
  getReservationByCustomerId
);
router.put("/:reservation_id", adminStaffAuth, updateReservation);
router.delete("/:reservation_id", auth, deleteReservation);
router.get("/date/:date", adminStaffAuth, getReservationsByDate);
router.get("/accepted", adminStaffAuth, getAcceptedReservations);
router.get("/paid", adminStaffAuth, getPaidReservations); // Add this new route
router.get(
  "/reservations/accepted",
  adminStaffAuth,
  getAcceptedReservationsByMonth
);

// Customer-only routes
router.post("/", auth, createReservation);
router.get("/available-dates", auth, getAvailableDates);
router.get("/my-accepted", auth, getMyAcceptedReservations);
router.get("/my-reservations", auth, getMyReservations);
router.put("/:reservationId/cancel", auth, cancelReservation);
router.put("/:id/payment", auth, updatePaymentStatus);
router.post("/check-availability", checkReservationAvailability);

// Admin/staff route for status updates
router.put("/status/:reservation_id", adminStaffAuth, updateReservationStatus);

// Customer editing their reservation details
router.put("/edit/:reservation_id", auth, editReservation);

export default router;
