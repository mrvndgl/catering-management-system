import mongoose from "mongoose";
import ProductModel from "./Product.js";

const reservationSchema = new mongoose.Schema(
  {
    reservation_id: { type: Number, unique: true, required: true },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    numberOfPax: { type: Number, required: true },
    timeSlot: { type: String, required: true },
    paymentMode: { type: String, required: true },
    reservation_date: { type: Date, required: true },
    venue: { type: String, required: true },
    selectedProducts: {
      type: Map,
      of: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    additionalItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    total_amount: { type: Number, required: true },
    reservation_status: { type: String, default: "Pending" },
    specialNotes: { type: String, default: "" },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
reservationSchema.index({ reservation_id: 1 }, { unique: true });
reservationSchema.index({ reservation_date: 1 });

// Add a pre-save middleware to validate total amount
reservationSchema.pre("save", function (next) {
  if (this.total_amount < 0) {
    next(new Error("Total amount cannot be negative"));
  }
  next();
});

const ReservationModel = mongoose.model("Reservation", reservationSchema);
export default ReservationModel;
