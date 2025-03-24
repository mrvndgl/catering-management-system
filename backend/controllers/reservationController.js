import Reservation from "../models/Reservation.js";
import { Schedule } from "../models/Schedule.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

const BASE_PAX = 50;
const PRICE_PER_HEAD = 350;
const ADDITIONAL_ITEM_PRICE = 35;
const BASE_PRICE = BASE_PAX * PRICE_PER_HEAD;

// Function to sync a reservation to the schedules collection
export const syncReservationToSchedule = async (reservation) => {
  try {
    // Check if a schedule already exists for this date
    const existingSchedule = await Schedule.findOne({
      reservationDate: new Date(reservation.date),
    });

    if (!existingSchedule && reservation.status === "ACCEPTED") {
      // Create a new schedule entry if it doesn't exist
      const newSchedule = new Schedule({
        reservationDate: new Date(reservation.date),
        status: "Confirmed", // Map reservation status to schedule status
        // You could add more fields here if needed
        reservationId: reservation._id, // Reference back to the reservation
      });

      await newSchedule.save();
      console.log(`Created schedule for reservation date: ${reservation.date}`);
    }
  } catch (error) {
    console.error("Error syncing reservation to schedule:", error);
  }
};

// Function to sync all existing reservations
export const syncAllReservationsToSchedules = async () => {
  try {
    const acceptedReservations = await Reservation.find({
      status: "accepted", // Adjust based on your actual status values
    });

    console.log(
      `Syncing ${acceptedReservations.length} reservations to schedules`
    );

    for (const reservation of acceptedReservations) {
      await syncReservationToSchedule(reservation);
    }

    console.log("Finished syncing reservations to schedules");
    return acceptedReservations.length;
  } catch (error) {
    console.error("Error syncing all reservations:", error);
    throw error;
  }
};

// Add this endpoint to your routes to manually trigger a sync
export const triggerSync = async (req, res) => {
  try {
    const syncCount = await syncAllReservationsToSchedules();
    res.status(200).json({
      message: `Successfully synchronized ${syncCount} reservations`,
      syncCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error synchronizing reservations",
      error: error.message,
    });
  }
};

// You could also add a hook to automatically sync when reservations are created/updated
// Add this to your reservation model or wherever you handle reservation updates
export const addSyncHook = () => {
  // If using Mongoose middleware:
  Reservation.schema.post("save", async function (doc) {
    await syncReservationToSchedule(doc);
  });

  Reservation.schema.post("findOneAndUpdate", async function (doc) {
    if (doc) {
      await syncReservationToSchedule(doc);
    }
  });
};

// Function to get available dates
export const getAvailableDates = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message:
          "Both startDate and endDate are required in the query parameters.",
      });
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        message:
          "Invalid date format for startDate or endDate. Use YYYY-MM-DD format.",
      });
    }

    const reservations = await Reservation.find({
      reservation_date: {
        $gte: startDateObj,
        $lte: endDateObj,
      },
    }).select("reservation_date timeSlot");

    // Create a map of booked slots
    const bookedSlots = reservations.reduce((acc, reservation) => {
      const date = reservation.reservation_date.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = new Set();
      }
      acc[date].add(reservation.timeSlot);
      return acc;
    }, {});

    // Generate a list of all dates between startDate and endDate
    const allDates = [];
    let currentDate = new Date(startDateObj);
    while (currentDate <= endDateObj) {
      allDates.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Determine available dates
    const availableDates = allDates.filter((date) => !bookedSlots[date]);

    res.status(200).json(availableDates);
  } catch (error) {
    console.error("Error in getAvailableDates:", error);
    res.status(500).json({
      message: "Error fetching available dates",
      error: error.message,
    });
  }
};

export const createReservation = async (req, res) => {
  console.log("========== RESERVATION CREATION REQUEST ==========");
  console.log("Received request headers:", req.headers);
  console.log("Received request body:", JSON.stringify(req.body, null, 2));

  try {
    const {
      name,
      phoneNumber,
      numberOfPax,
      timeSlot,
      paymentMode,
      reservation_date,
      venue,
      selectedProducts,
      additionalItems = [],
      specialNotes = "",
    } = req.body;

    // Log each piece of received data for debugging
    console.log("Name:", name);
    console.log("Phone Number:", phoneNumber);
    console.log("Number of Pax:", numberOfPax);
    console.log("Time Slot:", timeSlot);
    console.log("Payment Mode:", paymentMode);
    console.log("Reservation Date:", reservation_date);
    console.log("Venue:", venue);
    console.log("Selected Products:", selectedProducts);
    console.log("Additional Items:", additionalItems);

    // Basic validation
    if (
      !name ||
      !phoneNumber ||
      !numberOfPax ||
      !timeSlot ||
      !paymentMode ||
      !reservation_date ||
      !venue
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Validate numberOfPax range
    if (numberOfPax < 50 || numberOfPax > 150) {
      return res.status(400).json({
        success: false,
        message: "Number of pax must be between 50 and 150",
      });
    }

    // Generate a unique reservation ID
    const lastReservation = await Reservation.findOne().sort({
      reservation_id: -1,
    });
    const reservation_id = lastReservation
      ? lastReservation.reservation_id + 1
      : 1;

    // Process selected products
    const processedProducts = {};
    for (const [category, productId] of Object.entries(selectedProducts)) {
      try {
        // Find the product by its numeric ID
        const product = await Product.findOne({ product_id: productId });

        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product with ID ${productId} in category ${category} not found`,
          });
        }

        // Use the MongoDB _id of the found product
        processedProducts[category] = Number(productId);
      } catch (error) {
        console.error(
          `Error processing product for category ${category}:`,
          error
        );
        return res.status(500).json({
          success: false,
          message: `Error processing product for category ${category}`,
        });
      }
    }

    // Process additional items
    const processedAdditionalItems = [];
    for (const itemId of additionalItems) {
      try {
        const product = await Product.findOne({ product_id: itemId });

        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Additional item with ID ${itemId} not found`,
          });
        }

        processedAdditionalItems.push(product._id);
      } catch (error) {
        console.error(`Error processing additional item ${itemId}:`, error);
        return res.status(500).json({
          success: false,
          message: `Error processing additional item ${itemId}`,
        });
      }
    }

    // Calculate total amount
    let totalAmount = BASE_PRICE + (numberOfPax - BASE_PAX) * PRICE_PER_HEAD;
    if (additionalItems && additionalItems.length > 0) {
      totalAmount +=
        numberOfPax * ADDITIONAL_ITEM_PRICE * additionalItems.length;
    }

    // Create new reservation
    const newReservation = new Reservation({
      reservation_id,
      customer_id: req.user.userId,
      name,
      phoneNumber,
      numberOfPax,
      timeSlot,
      createdAt: new Date(),
      paymentMode,
      reservation_date: new Date(reservation_date),
      venue,
      selectedProducts: processedProducts, // Store numeric IDs
      additionalItems: additionalItems.map((id) => Number(id)), // Convert to numbers
      total_amount: totalAmount,
      reservation_status: "Pending",
      specialNotes: specialNotes,
    });

    // Save the reservation
    const savedReservation = await newReservation.save();

    return res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: savedReservation,
    });
  } catch (error) {
    console.error("========== RESERVATION CREATION ERROR ==========");
    console.error("Full error details:", error);

    return res.status(500).json({
      success: false,
      message: "Error creating reservation",
      error: {
        type: error.name,
        details: error.message,
      },
    });
  }
};

export const getAdminReservations = async (req, res) => {
  try {
    const { month, year, status } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const reservations = await Reservation.find({
      reservation_date: {
        $gte: startDate,
        $lte: endDate,
      },
      status: status,
    });

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllReservations = async (req, res) => {
  console.log("getAllReservations called");
  try {
    console.log("Attempting to fetch all reservations");
    const reservations = await Reservation.find()
      .select({
        reservation_id: 1,
        name: 1,
        phoneNumber: 1,
        numberOfPax: 1,
        timeSlot: 1,
        createdAt: 1,
        paymentMode: 1,
        reservation_date: 1,
        venue: 1,
        selectedProducts: 1,
        additionalItems: 1,
        total_amount: 1,
        reservation_status: 1,
        specialNotes: 1,
        customer_id: 1,
      })
      .sort({ reservation_id: 1 });

    // Transform the dates safely
    const transformedReservations = reservations.map((reservation) => {
      const reservationObj = reservation.toObject();
      return {
        ...reservationObj,
        createdAt: reservationObj.createdAt
          ? new Date(reservationObj.createdAt).toISOString()
          : null,
        reservation_date: reservationObj.reservation_date
          ? new Date(reservationObj.reservation_date).toISOString()
          : null,
      };
    });

    res.status(200).json(transformedReservations);
  } catch (error) {
    console.error("Error in getAllReservations:", error);
    res.status(500).json({
      message: "Error fetching reservations",
      error: error.message,
    });
  }
};

export const getMyReservations = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("Fetching reservations for user:", userId);

    const reservations = await Reservation.find({ customer_id: userId })
      .sort({ createdAt: -1 })
      .lean(); // Remove populate since we're storing IDs directly

    // Add debug logging
    console.log("Raw reservations:", JSON.stringify(reservations, null, 2));

    // Transform the data to ensure proper format
    const transformedReservations = reservations.map((reservation) => ({
      ...reservation,
      selectedProducts: reservation.selectedProducts || {},
      additionalItems: reservation.additionalItems || [],
    }));

    console.log(
      "Transformed reservations:",
      JSON.stringify(transformedReservations, null, 2)
    );

    res.status(200).json({
      success: true,
      count: transformedReservations.length,
      data: transformedReservations,
    });
  } catch (error) {
    console.error("Error in getMyReservations:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reservations",
      error: error.message,
    });
  }
};

export const getPaidReservations = async (req, res) => {
  try {
    const paidReservations = await Reservation.aggregate([
      {
        $lookup: {
          from: "payments",
          localField: "reservation_id",
          foreignField: "reservation_id",
          as: "payment",
        },
      },
      {
        $match: {
          "payment.payment_status": "Paid",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "customer_id",
          foreignField: "user_id",
          as: "customer",
        },
      },
      {
        $project: {
          reservation_id: 1,
          customer_name: { $arrayElemAt: ["$customer.name", 0] },
          reservation_date: 1,
          timeSlot: 1,
          numberOfPax: 1,
          venue: 1,
          total_amount: 1,
          payment_status: { $arrayElemAt: ["$payment.payment_status", 0] },
          payment_method: { $arrayElemAt: ["$payment.payment_method", 0] },
          payment_date: { $arrayElemAt: ["$payment.created_at", 0] },
        },
      },
      {
        $sort: { payment_date: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: paidReservations,
    });
  } catch (error) {
    console.error("Error fetching paid reservations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch paid reservations",
      error: error.message,
    });
  }
};

export const getReservationByCustomerId = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const reservations = await Reservation.find({
      customer_id: parseInt(customer_id),
    })
      .populate("customer_id", "customer_name")
      .populate("employee_id", "employee_name")
      .populate("products")
      .sort({ reservation_date: -1 });

    if (!reservations || reservations.length === 0) {
      return res
        .status(404)
        .json({ message: "No reservations found for this customer" });
    }

    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching customer reservations",
      error: error.message,
    });
  }
};

export const updateReservation = async (req, res) => {
  try {
    const { reservation_id } = req.params;
    const { reservation_status, paymentRedirect } = req.body;

    console.log(
      `Updating reservation ${reservation_id} to status: ${reservation_status}`
    );

    const statusLower = reservation_status.toLowerCase();

    const updateData = {
      reservation_status: statusLower,
      status: statusLower, // Make sure both fields are updated
      ...(paymentRedirect && { payment_required: true }),
    };

    const updatedReservation = await Reservation.findOneAndUpdate(
      { reservation_id: parseInt(reservation_id) },
      updateData,
      { new: true, runValidators: true }
    );

    // Log the result for debugging
    console.log("Updated reservation:", updatedReservation);

    if (!updatedReservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedReservation,
    });
  } catch (error) {
    console.error("Update reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating reservation",
      error: error.message,
    });
  }
};

export const getMyAcceptedReservations = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("Fetching accepted reservations for user:", userId);

    const reservations = await Reservation.find({
      customer_id: userId,
      reservation_status: "accepted", // Your model converts to lowercase
      $or: [
        { payment_status: { $exists: false } },
        { payment_status: { $in: ["pending", null] } },
      ],
    }).sort({ reservation_date: -1 });

    console.log("Found reservations:", reservations);

    if (!reservations || reservations.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(reservations);
  } catch (error) {
    console.error("Error in getMyAcceptedReservations:", error);
    res.status(500).json({
      message: "Error fetching accepted reservations",
      error: error.message,
    });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    const { reservation_id } = req.params;

    const deletedReservation = await Reservation.findOneAndDelete({
      reservation_id: parseInt(reservation_id),
    });

    if (!deletedReservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.status(200).json({ message: "Reservation deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting reservation", error: error.message });
  }
};

// Add these functions to reservationController.js
export const getReservationsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const reservations = await Reservation.find({
      reservationDate: new Date(date),
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAcceptedReservations = async (req, res) => {
  try {
    // Remove any filtering by customer_id to get all accepted reservations
    const reservations = await Reservation.find({
      reservation_status: "accepted",
      reservation_date: { $gte: new Date() }, // Only get future reservations
    })
      .sort({ reservation_date: 1 }) // Sort by date ascending
      .populate("customer_id", "name") // Populate customer details if needed
      .select("-payment_status -paymentMode"); // Exclude sensitive information

    res.status(200).json(reservations);
  } catch (error) {
    console.error("Error in getAcceptedReservations:", error);
    res.status(500).json({
      message: "Error fetching accepted reservations",
      error: error.message,
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
