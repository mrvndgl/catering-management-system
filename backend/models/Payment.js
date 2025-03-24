import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  payment_id: {
    type: Number,
    required: true,
    unique: true,
  },
  reservation_id: {
    type: Number,
    required: true,
    ref: "Reservation",
  },
  customer_id: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  payment_status: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded", "Cancelled"],
    default: "Pending",
  },
  payment_method: {
    type: String,
    enum: ["Cash", "GCash"],
    required: true,
  },
  payment_proof: {
    type: String,
    default: null,
  },
  payment_date: {
    type: Date,
    default: null,
  },
  customer_name: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    default: "",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Update the updated_at field before saving
PaymentSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;
