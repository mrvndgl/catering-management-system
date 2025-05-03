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

    // Get today's date with time set to midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate minimum allowed date (7 days from today)
    const minAllowedDate = new Date(today);
    minAllowedDate.setDate(today.getDate() + 7);

    // Fetch reservations from database
    const reservations = await Reservation.find({
      reservation_date: {
        $gte: startDateObj,
        $lte: endDateObj,
      },
    }).select("reservation_date timeSlot");

    // Create a map of dates with booked time slots
    const bookedDates = {};
    reservations.forEach((reservation) => {
      const date = reservation.reservation_date.toISOString().split("T")[0];
      if (!bookedDates[date]) {
        bookedDates[date] = new Set();
      }
      bookedDates[date].add(reservation.timeSlot);
    });

    // Generate all dates within range
    const availableDates = [];
    let currentDate = new Date(startDateObj);

    while (currentDate <= endDateObj) {
      const dateString = currentDate.toISOString().split("T")[0];

      // Only include dates that are at least 7 days in the future
      if (currentDate >= minAllowedDate) {
        availableDates.push(dateString);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({
      availableDates,
      minAllowedDate: minAllowedDate.toISOString().split("T")[0],
    });
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
    console.log("Phone Number:", phoneNumber);
    console.log("Number of Pax:", numberOfPax);
    console.log("Time Slot:", timeSlot);
    console.log("Payment Mode:", paymentMode);
    console.log("Reservation Date:", reservation_date);
    console.log("Venue:", venue);
    console.log("Selected Products:", selectedProducts);
    console.log("Additional Items:", additionalItems);

    // Basic validation - removed name field from validation
    if (
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

    // Validate reservation date (must be at least 7 days in advance)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minAllowedDate = new Date(today);
    minAllowedDate.setDate(today.getDate() + 7);

    const reservationDate = new Date(reservation_date);
    reservationDate.setHours(0, 0, 0, 0);

    if (reservationDate < minAllowedDate) {
      return res.status(400).json({
        success: false,
        message: "Reservations must be made at least 7 days in advance.",
      });
    }

    // Check if the date and time slot are already taken (regardless of status)
    const existingReservation = await Reservation.findOne({
      reservation_date: {
        $gte: reservationDate,
        $lt: new Date(reservationDate.getTime() + 24 * 60 * 60 * 1000),
      },
      timeSlot: timeSlot,
    });

    if (existingReservation) {
      return res.status(409).json({
        success: false,
        message:
          "This date and time slot is already booked. Please select another.",
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
        const product = await Product.findOne({ product_id: productId });

        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product with ID ${productId} in category ${category} not found`,
          });
        }

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

    // Create new reservation - removed name field
    const newReservation = new Reservation({
      reservation_id,
      customer_id: req.user.userId,
      phoneNumber,
      numberOfPax,
      timeSlot,
      createdAt: new Date(),
      paymentMode,
      reservation_date: reservationDate, // Use the cleaned-up date
      venue,
      selectedProducts: processedProducts,
      additionalItems: additionalItems.map((id) => Number(id)),
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

// Function to check if a reservation date and time slot is already taken
export const checkReservationAvailability = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Both date and timeSlot are required.",
      });
    }

    // Convert the date string to a Date object
    const reservationDate = new Date(date);

    // Set hours to 0 to compare just the date portion
    reservationDate.setHours(0, 0, 0, 0);

    // Find any accepted reservations for this date and time slot
    const existingReservation = await Reservation.findOne({
      reservation_date: {
        $gte: reservationDate,
        $lt: new Date(reservationDate.getTime() + 24 * 60 * 60 * 1000), // Next day
      },
      timeSlot: timeSlot,
      reservation_status: "accepted",
    });

    if (existingReservation) {
      return res.status(409).json({
        success: false,
        message:
          "This date and time slot is already booked. Please select another date or time.",
        isAvailable: false,
      });
    }

    // If no existing reservation found, the slot is available
    return res.status(200).json({
      success: true,
      message: "This date and time slot is available for booking.",
      isAvailable: true,
    });
  } catch (error) {
    console.error("Error checking reservation availability:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking reservation availability",
      error: error.message,
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

// For customers to edit their reservation details
export const editReservation = async (req, res) => {
  try {
    const { reservation_id } = req.params;
    let updateData = { ...req.body };

    console.log(`Editing reservation ${reservation_id} with data:`, updateData);

    // Find the reservation first to check permissions
    const reservation = await Reservation.findOne({
      reservation_id: parseInt(reservation_id),
    });

    if (!reservation) {
      console.log(`Reservation ${reservation_id} not found`);
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    console.log(`Original reservation:`, reservation);
    console.log(
      `User ID: ${req.user.userId}, Reservation owner: ${reservation.customer_id}`
    );

    // Check if the user is the owner of this reservation
    const isOwner =
      reservation.customer_id.toString() === req.user.userId.toString();

    if (!isOwner) {
      console.log("Owner validation failed");
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized access - you can only edit your own reservations",
      });
    }

    // Process field mappings from frontend to database fields
    const fieldMappings = {
      number_of_guests: "numberOfPax",
      special_requests: "specialNotes",
      reservation_time: "timeSlot",
      totalAmount: "total_amount",
    };

    // Map fields from frontend names to database names
    Object.keys(fieldMappings).forEach((frontendField) => {
      if (updateData[frontendField] !== undefined) {
        updateData[fieldMappings[frontendField]] = updateData[frontendField];
        delete updateData[frontendField]; // Remove the original key
      }
    });

    // Only allow certain fields to be updated by customers
    const allowedFields = [
      "reservation_date",
      "timeSlot",
      "numberOfPax",
      "specialNotes",
      "selectedProducts",
      "additionalItems",
      "total_amount",
      // Add additionalItems to allowed fields
      // Add other allowed fields here
    ];

    // Create a new object with only the allowed fields
    const filteredUpdateData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    }

    // Set update timestamp
    filteredUpdateData.updatedAt = new Date();

    console.log(`Final update data:`, filteredUpdateData);

    // Use findOneAndUpdate with proper options
    const updatedReservation = await Reservation.findOneAndUpdate(
      { reservation_id: parseInt(reservation_id) },
      { $set: filteredUpdateData }, // Use $set operator explicitly
      { new: true, runValidators: true }
    );

    console.log(`Updated reservation result:`, updatedReservation);

    // Double-check the update by fetching it again
    const verifyUpdate = await Reservation.findOne({
      reservation_id: parseInt(reservation_id),
    });

    console.log(`Verification fetch:`, verifyUpdate);

    res.status(200).json({
      success: true,
      data: updatedReservation,
    });
  } catch (error) {
    console.error("Edit reservation error:", error);
    res.status(500).json({
      success: false,
      message: "Error editing reservation",
      error: error.message,
    });
  }
};

export const updateReservationStatus = async (req, res) => {
  try {
    const { reservation_id } = req.params;
    const { reservation_status, decline_reason } = req.body;

    console.log(
      `Admin updating reservation ${reservation_id} status to: ${reservation_status}`
    );

    const statusLower = reservation_status.toLowerCase();

    const updateData = {
      reservation_status: statusLower,
      status: statusLower,
      ...(decline_reason && { decline_reason }),
    };

    const updatedReservation = await Reservation.findOneAndUpdate(
      { reservation_id: parseInt(reservation_id) },
      updateData,
      { new: true, runValidators: true }
    );

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
    console.error("Update reservation status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating reservation status",
      error: error.message,
    });
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

    // Find reservations and populate customer information
    const reservations = await Reservation.find({ customer_id: userId })
      .populate("customer_id", "firstName lastName -_id")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reservations.map((reservation) => ({
        ...reservation.toObject(),
        customerName: `${reservation.customer_id.firstName} ${reservation.customer_id.lastName}`,
      })),
      message: "Reservations retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching my reservations:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving reservations",
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
    const updateData = { ...req.body };

    // Find the reservation first to check permissions
    const reservation = await Reservation.findOne({
      reservation_id: parseInt(reservation_id),
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    // Check user roles and permissions
    const isAdminOrStaff =
      req.user.type === "admin" ||
      req.user.type === "staff" ||
      req.user.employeeType === "admin" ||
      req.user.employeeType === "staff";

    const isOwner =
      reservation.customer_id.toString() === req.user.userId.toString();

    // If not admin/staff and not the owner, deny access
    if (!isAdminOrStaff && !isOwner) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized access - you can only edit your own reservations",
      });
    }

    // Process field mappings from frontend to database fields
    const fieldMappings = {
      number_of_guests: "numberOfPax",
      special_requests: "specialNotes",
      reservation_time: "timeSlot",
      total_amount: "total_amount",
      // Add any other field mappings here
    };

    // Map fields from frontend names to database names
    Object.keys(fieldMappings).forEach((frontendField) => {
      if (updateData[frontendField] !== undefined) {
        updateData[fieldMappings[frontendField]] = updateData[frontendField];
        delete updateData[frontendField]; // Remove the original key
      }
    });

    // If customer is editing their own reservation, restrict what fields they can update
    if (!isAdminOrStaff && isOwner) {
      // Only allow certain fields to be updated by customers
      const allowedFields = [
        "reservation_date",
        "timeSlot",
        "numberOfPax",
        "specialNotes",
        "total_amount",
        // Add other allowed fields here
      ];

      // Create a new object with only the allowed fields
      const filteredUpdateData = {};

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredUpdateData[field] = updateData[field];
        }
      }

      // Replace updateData with filtered version
      updateData = filteredUpdateData;
    }

    console.log("Processed update data:", updateData);

    const updatedReservation = await Reservation.findOneAndUpdate(
      { reservation_id: parseInt(reservation_id) },
      updateData,
      { new: true, runValidators: true }
    );

    console.log("Updated reservation:", updatedReservation);

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

export const getAcceptedReservationsByMonth = async (req, res) => {
  try {
    const { year, month } = req.query;

    // Convert query params to numbers
    const numYear = parseInt(year);
    const numMonth = parseInt(month);

    // Create date range for the specified month
    const startDate = new Date(numYear, numMonth - 1, 1);
    const endDate = new Date(numYear, numMonth, 0, 23, 59, 59); // Last day of month

    // Query accepted reservations for the month
    const reservations = await Reservation.find({
      reservation_date: {
        $gte: startDate,
        $lte: endDate,
      },
      reservation_status: "accepted",
    }).select(
      "reservation_id name reservation_date timeSlot numberOfPax total_amount reservation_status"
    );

    res.status(200).json(reservations);
  } catch (error) {
    console.error("Error fetching accepted reservations:", error);
    res.status(500).json({
      message: "Failed to fetch accepted reservations",
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

export const cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = req.user.userId;

    console.log("Cancellation Request Details:", {
      reservationId,
      userId,
    });

    // Validate input
    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: "Reservation ID is required",
      });
    }

    // Find the reservation
    const reservation = await Reservation.findOne({
      reservation_id: reservationId,
      customer_id: userId,
    });

    if (!reservation) {
      console.warn(
        `Reservation not found: ID ${reservationId}, User ${userId}`
      );
      return res.status(404).json({
        success: false,
        message: "Reservation not found or unauthorized",
      });
    }

    // Disallow if already cancelled, completed, or declined
    if (reservation.reservation_status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Reservation is already cancelled",
      });
    }

    if (["Completed", "Declined"].includes(reservation.reservation_status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${reservation.reservation_status} reservation`,
      });
    }

    // Check if it's at least 3 days before reservation date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservationDate = new Date(reservation.reservation_date);
    reservationDate.setHours(0, 0, 0, 0);

    const cancelDeadline = new Date(reservationDate);
    cancelDeadline.setDate(reservationDate.getDate() - 3);

    if (today > cancelDeadline) {
      return res.status(400).json({
        success: false,
        message:
          "Cancellations are only allowed up to 3 days before the reservation date.",
      });
    }

    // Update status to Cancelled
    reservation.reservation_status = "Cancelled";

    try {
      await reservation.save();
    } catch (saveError) {
      console.error("Error saving cancelled reservation:", saveError);
      return res.status(500).json({
        success: false,
        message: "Error updating reservation status",
        error: saveError.message,
      });
    }

    console.log("Successfully cancelled reservation:", reservationId);
    res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully",
      data: {
        reservation_id: reservation.reservation_id,
        status: reservation.reservation_status,
      },
    });
  } catch (error) {
    console.error("Unexpected error in cancelReservation:", {
      error: error.message,
      stack: error.stack,
      reservationId: req.params.reservationId,
    });

    res.status(500).json({
      success: false,
      message: "Unexpected error cancelling reservation",
      error: error.message,
    });
  }
};
