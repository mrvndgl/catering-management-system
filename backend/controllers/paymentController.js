import mongoose from "mongoose";
import Reservation from "../models/Reservation.js";
import Payment from "../models/Payment.js";
import pdf from "pdf-lib";
import path from "path";

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

// Get payment statuses for a user
export const getPaymentStatuses = async (req, res) => {
  try {
    const customer_id = req.user.userId;

    // Fetch all payments associated with the customer
    const payments = await Payment.find({ customer_id }).sort({
      created_at: -1,
    });

    if (!payments || payments.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No payment records found",
        data: [],
      });
    }

    // Format the data for the frontend
    const formattedPayments = payments.map((payment) => ({
      reservation_id: payment.reservation_id,
      payment_status: payment.payment_status,
      payment_method: payment.payment_method,
      amount: payment.amount,
      created_at: payment.payment_date,
      payment_proof: payment.payment_proof,
    }));

    res.status(200).json({
      success: true,
      message: "Payment statuses retrieved successfully",
      data: formattedPayments,
    });
  } catch (error) {
    console.error("Error fetching payment statuses:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving payment statuses",
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

    const { reservation_id, payment_method } = req.body;
    const customer_id = req.user.userId;

    // Verify the reservation exists and belongs to the user
    const reservation = await Reservation.findOne({
      reservation_id: parseInt(reservation_id),
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
    let payment_id = 1;
    if (lastPayment) {
      payment_id = lastPayment.payment_id + 1;
    }

    // Create new payment record
    const newPayment = new Payment({
      payment_id,
      reservation_id: parseInt(reservation_id),
      customer_id,
      amount: reservation.total_amount,
      payment_method,
      customer_name: reservation.name,
      payment_status: "Pending", // Admin will verify this later
      payment_proof: req.file.filename,
      payment_date: new Date(),
      notes: "Payment proof uploaded by customer",
    });

    const savedPayment = await newPayment.save();

    // Update reservation payment status
    await Reservation.findOneAndUpdate(
      { reservation_id: parseInt(reservation_id) },
      {
        payment_status: "Pending",
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

// Generate e-receipt for a payment
export const generateEReceipt = async (req, res) => {
  try {
    const { payment_id } = req.params;

    // Find the payment
    const payment = await Payment.findOne({ payment_id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Find the associated reservation for more details
    const reservation = await Reservation.findOne({
      reservation_id: payment.reservation_id,
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Associated reservation not found",
      });
    }

    // Generate a unique receipt number
    const receiptNumber = `R-${payment.payment_id}-${Date.now()
      .toString()
      .slice(-6)}`;

    // Create PDF document
    const { PDFDocument, rgb, StandardFonts } = pdf;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

    // Get fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Set up document
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;
    const lineHeight = 25;

    // Add header
    page.drawText("OFFICIAL RECEIPT", {
      x: margin,
      y,
      size: 24,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    y -= lineHeight * 2;

    // Add receipt details
    page.drawText(`Receipt No: ${receiptNumber}`, {
      x: margin,
      y,
      size: 12,
      font: helveticaFont,
    });

    y -= lineHeight;

    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: margin,
      y,
      size: 12,
      font: helveticaFont,
    });

    y -= lineHeight * 2;

    // Customer details
    page.drawText("Customer Details:", {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= lineHeight;

    page.drawText(`Name: ${payment.customer_name}`, {
      x: margin,
      y,
      size: 12,
      font: helveticaFont,
    });

    y -= lineHeight;

    // Reservation details
    page.drawText("Reservation Details:", {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= lineHeight;

    page.drawText(`Reservation ID: #${payment.reservation_id}`, {
      x: margin,
      y,
      size: 12,
      font: helveticaFont,
    });

    y -= lineHeight;

    page.drawText(
      `Check-in: ${new Date(reservation.check_in_date).toLocaleDateString()}`,
      {
        x: margin,
        y,
        size: 12,
        font: helveticaFont,
      }
    );

    y -= lineHeight;

    page.drawText(
      `Check-out: ${new Date(reservation.check_out_date).toLocaleDateString()}`,
      {
        x: margin,
        y,
        size: 12,
        font: helveticaFont,
      }
    );

    y -= lineHeight * 2;

    // Payment details
    page.drawText("Payment Details:", {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
    });

    y -= lineHeight;

    page.drawText(`Payment ID: #${payment.payment_id}`, {
      x: margin,
      y,
      size: 12,
      font: helveticaFont,
    });

    y -= lineHeight;

    page.drawText(`Amount: ₱${payment.amount.toLocaleString()}`, {
      x: margin,
      y,
      size: 12,
      font: helveticaFont,
    });

    y -= lineHeight;

    page.drawText(`Payment Method: ${payment.payment_method}`, {
      x: margin,
      y,
      size: 12,
      font: helveticaFont,
    });

    y -= lineHeight;

    page.drawText(`Payment Status: ${payment.payment_status}`, {
      x: margin,
      y,
      size: 12,
      font: helveticaFont,
    });

    y -= lineHeight;

    page.drawText(
      `Transaction Date: ${new Date(payment.created_at).toLocaleString()}`,
      {
        x: margin,
        y,
        size: 12,
        font: helveticaFont,
      }
    );

    y -= lineHeight * 2;

    // Add notes if any
    if (payment.notes) {
      page.drawText("Notes:", {
        x: margin,
        y,
        size: 14,
        font: helveticaBold,
      });

      y -= lineHeight;

      page.drawText(payment.notes, {
        x: margin,
        y,
        size: 12,
        font: helveticaFont,
      });

      y -= lineHeight * 2;
    }

    // Footer
    page.drawText("Thank you for your business!", {
      x: width / 2 - 100,
      y: margin + 30,
      size: 14,
      font: helveticaBold,
    });

    // Generate PDF
    const pdfBytes = await pdfDoc.save();

    // Create directory if it doesn't exist
    const receiptDir = path.join(process.cwd(), "uploads/receipts");
    await fs.mkdir(receiptDir, { recursive: true });

    // Save PDF to file
    const fileName = `receipt-${payment.payment_id}-${Date.now()}.pdf`;
    const filePath = path.join(receiptDir, fileName);
    await fs.writeFile(filePath, pdfBytes);

    // Update payment record with receipt info
    await Payment.findOneAndUpdate(
      { payment_id },
      {
        receipt_number: receiptNumber,
        receipt_file: fileName,
        receipt_generated_at: new Date(),
      }
    );

    // Return the PDF file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(pdfBytes);
  } catch (error) {
    console.error("Error generating e-receipt:", error);
    res.status(500).json({
      success: false,
      message: "Error generating e-receipt",
      error: error.message,
    });
  }
};

// Get a previously generated receipt
export const getReceipt = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), "uploads/receipts", filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Receipt file not found",
      });
    }

    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving receipt",
      error: error.message,
    });
  }
};
