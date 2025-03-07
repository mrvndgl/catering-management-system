import express from "express";
import mongoose from "mongoose";
import { Schedule } from "../models/Schedule.js";
import { Customer } from "../models/Customer.js";

const router = express.Router();

// GET public schedules with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;

    // Fetch schedules with customer details
    const schedules = await Schedule.find()
      .sort({ reservationDate: 1 }) // Sort by reservation date
      .skip(skipIndex)
      .limit(limit)
      .populate({
        path: "customerId",
        select: "firstName lastName contactNumber email",
        model: "Customer",
      })
      .lean();

    const totalSchedules = await Schedule.countDocuments();

    // If no schedules found
    if (schedules.length === 0) {
      return res.status(404).json({
        message: "No schedules found",
        schedules: [],
        currentPage: page,
        totalPages: 0,
        totalSchedules: 0,
      });
    }

    // Transform schedules to include formatted dates
    const formattedSchedules = schedules.map((schedule) => ({
      ...schedule,
      formattedReservationDate: new Date(
        schedule.reservationDate
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }),
      customerName: schedule.customerId
        ? `${schedule.customerId.firstName} ${schedule.customerId.lastName}`
        : "Unknown Customer",
    }));

    res.json({
      schedules: formattedSchedules,
      currentPage: page,
      totalPages: Math.ceil(totalSchedules / limit),
      totalSchedules,
    });
  } catch (error) {
    console.error("Schedule Fetch Error:", error);
    res.status(500).json({
      message: "Error fetching schedules",
      error: error.message,
    });
  }
});

export default router;
