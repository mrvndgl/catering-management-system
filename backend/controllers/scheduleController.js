import { Schedule } from "../models/Schedule.js";
import Reservation from "../models/Reservation.js";
import mongoose from "mongoose";

// Updated endpoint to get booked dates from reservations
export const getBookedDates = async (req, res) => {
  try {
    // Query accepted reservations from the reservations collection
    const reservations = await Reservation.find({
      reservation_status: "accepted", // Lowercase, match your actual field name and values
    });

    console.log("Found reservations:", reservations);

    const bookedDates = reservations.map((reservation) => {
      // Use the correct field name from your model
      const reservationDate = new Date(reservation.reservation_date);

      return {
        date: reservationDate,
        formattedDate: reservationDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        }),
        // Match your actual field name
        timeSlot: reservation.timeSlot,
      };
    });

    res.status(200).json({
      bookedDates,
      message: "Booked dates retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching booked dates:", error);
    res.status(500).json({
      message: "Error fetching booked dates",
      error: error.message,
    });
  }
};

// Keep your existing test endpoints
export const testEndpoint = (req, res) => {
  res.json({ message: "Schedule route is working" });
};

// DB info endpoint function
export const getDbInfo = (req, res) => {
  try {
    const dbInfo = {
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      collections: mongoose.connection.collections
        ? Object.keys(mongoose.connection.collections)
        : [],
      modelName: Schedule.modelName,
      collectionName: Schedule.collection.name,
    };

    res.json(dbInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Direct query endpoint function
export const directQuery = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const schedules = await db.collection("schedules").find({}).toArray();

    res.json({
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Insert test data endpoint function
// Add this to scheduleController.js to insert multiple test dates
export const insertTestData = async (req, res) => {
  try {
    const dates = [
      new Date(), // today
      new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    ];

    const savedSchedules = [];

    for (const date of dates) {
      const newSchedule = new Schedule({
        reservationDate: date,
        status: "Confirmed",
      });

      const saved = await newSchedule.save();
      savedSchedules.push(saved);
    }

    res.json({
      message: "Test data inserted",
      count: savedSchedules.length,
      data: savedSchedules,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
