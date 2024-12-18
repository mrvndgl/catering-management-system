import Reservation from "../models/Reservation.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

const BASE_PAX = 50;
const PRICE_PER_HEAD = 350;
const ADDITIONAL_ITEM_PRICE = 35;
const BASE_PRICE = BASE_PAX * PRICE_PER_HEAD;

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
        processedProducts[category] = product._id;
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
      name,
      phoneNumber,
      numberOfPax,
      timeSlot,
      paymentMode,
      reservation_date: new Date(reservation_date),
      venue,
      selectedProducts: processedProducts,
      additionalItems: processedAdditionalItems,
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

export const getAvailableDates = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const reservations = await Reservation.find({
      reservation_date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
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

    res.status(200).json(bookedSlots);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching available dates",
      error: error.message,
    });
  }
};

export const getAllReservations = async (req, res) => {
  console.log("getAllReservations called");
  try {
    console.log("Attempting to fetch all reservations");
    const reservations = await Reservation.find().sort({ reservation_id: 1 });
    console.log(`Found ${reservations.length} reservations`);

    res.status(200).json(reservations);
    console.log("Successfully sent reservations response");
  } catch (error) {
    console.error("Error in getAllReservations:", error);
    res.status(500).json({
      message: "Error fetching reservations",
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
    const updateData = req.body;

    // Validate and convert numeric fields if present
    if (updateData.customer_id) {
      updateData.customer_id = Number(updateData.customer_id);
    }
    if (updateData.employee_id) {
      updateData.employee_id = Number(updateData.employee_id);
    }
    if (updateData.reservation_time) {
      updateData.reservation_time = Number(updateData.reservation_time);
    }
    if (updateData.total_amount) {
      updateData.total_amount = Number(updateData.total_amount);
    }

    // Validate products if provided
    if (updateData.products) {
      const validatedProducts = [];
      for (const productId of updateData.products) {
        const product = await Product.findOne({ product_id: productId });
        if (!product) {
          return res
            .status(400)
            .json({ message: `Product with ID ${productId} not found` });
        }
        validatedProducts.push(product._id);
      }
      updateData.products = validatedProducts;
    }

    const updatedReservation = await Reservation.findOneAndUpdate(
      { reservation_id: parseInt(reservation_id) },
      updateData,
      { new: true, runValidators: true }
    ).populate("products");

    if (!updatedReservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.status(200).json(updatedReservation);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating reservation", error: error.message });
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
