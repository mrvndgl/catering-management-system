import express from "express";
import {
  createReservation,
  getAllReservations,
  getReservationByCustomerId,
  updateReservation,
  deleteReservation,
  getAvailableDates,
} from "../controllers/reservationController.js";

const router = express.Router();

router.post("/", createReservation);
router.get("/", getAllReservations);
router.get("/available-dates", getAvailableDates);
router.get("/customer/:customer_id", getReservationByCustomerId);
router.put("/:reservation_id", updateReservation);
router.delete("/:reservation_id", deleteReservation);

export default router;
