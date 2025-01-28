import Payment from "../models/Payment.js";
import Reservation from "../models/Reservation.js";

// Create a new payment record
export const createPayment = async (req, res) => {
  try {
    const { reservation_id, payment_method, amount, notes } = req.body;
    const customer_id = req.user.userId;

    // Verify the reservation exists and belongs to the user
    const reservation = await Reservation.findOne({
      reservation_id,
      customer_id,
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found or does not belong to you",
      });
    }

    // Get the last payment ID
    const lastPayment = await Payment.findOne().sort({ payment_id: -1 });
    const payment_id = lastPayment ? lastPayment.payment_id + 1 : 1;

    // Create new payment record
    const newPayment = new Payment({
      payment_id,
      reservation_id,
      customer_id, // Add customer_id
      amount: amount || reservation.total_amount,
      payment_method,
      customer_name: reservation.name,
      payment_status: "Pending",
      payment_date: new Date(),
      notes,
    });

    const savedPayment = await newPayment.save();

    // Update reservation payment status
    await Reservation.findOneAndUpdate(
      { reservation_id },
      {
        payment_status: "pending",
        payment_required: false,
      }
    );

    res.status(201).json({
      success: true,
      message: "Payment record created successfully",
      data: savedPayment,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating payment record",
      error: error.message,
    });
  }
};

// Get all payments
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ created_at: -1 });
    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

// Get payments by reservation ID
export const getPaymentsByReservation = async (req, res) => {
  try {
    const { reservation_id } = req.params;

    // Update status check to be case-insensitive
    const reservation = await Reservation.findOne({
      reservation_id,
      reservation_status: /^accepted$/i,
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "No accepted reservation found",
      });
    }

    // Get existing payments
    const payments = await Payment.find({ reservation_id });

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Error in getPaymentsByReservation:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { payment_status, notes } = req.body;

    const payment = await Payment.findOneAndUpdate(
      { payment_id },
      {
        payment_status,
        notes,
        ...(payment_status === "Paid" ? { payment_date: new Date() } : {}),
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // If payment is marked as paid, update reservation status
    if (payment_status === "Paid") {
      await Reservation.findOneAndUpdate(
        { reservation_id: payment.reservation_id },
        { payment_status: "Paid" }
      );
    }

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating payment status",
      error: error.message,
    });
  }
};

// Upload payment proof
export const uploadPaymentProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { reservation_id } = req.body;
    const customer_id = req.user.userId;

    // Verify the reservation exists and belongs to the user
    const reservation = await Reservation.findOne({
      reservation_id,
      customer_id,
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found or does not belong to you",
      });
    }

    // Get the last payment ID
    const lastPayment = await Payment.findOne().sort({ payment_id: -1 });
    const payment_id = lastPayment ? lastPayment.payment_id + 1 : 1;

    // Create new payment record
    const newPayment = new Payment({
      payment_id,
      reservation_id,
      customer_id,
      amount: reservation.total_amount,
      payment_method: req.body.payment_method,
      customer_name: reservation.name,
      payment_status: "Pending",
      payment_proof: req.file.filename,
      payment_date: new Date(),
    });

    const savedPayment = await newPayment.save();

    // Update reservation payment status
    await Reservation.findOneAndUpdate(
      { reservation_id },
      {
        payment_status: "pending",
        payment_required: false,
      }
    );

    res.status(201).json({
      success: true,
      message: "Payment proof uploaded successfully",
      data: savedPayment,
    });
  } catch (error) {
    console.error("Payment upload error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading payment proof",
      error: error.message,
    });
  }
};

// Serve uploaded files
export const getPaymentProof = async (req, res) => {
  try {
    const { filename } = req.params;
    res.sendFile(path.join(__dirname, "../uploads/payments", filename));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving payment proof",
      error: error.message,
    });
  }
};
