import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    reservation_id: { type: Number, unique: true, required: true },
    reservation_status: { type: String, default: "pending" },
    payment_status: { type: String, default: "pending" },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    numberOfPax: { type: Number, required: true },
    timeSlot: { type: String, required: true },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    paymentMode: { type: String, required: true },
    reservation_date: { type: Date, required: true },
    venue: { type: String, required: true },
    selectedProducts: {
      type: Object,
      required: true,
      default: {},
      // Add validation to ensure values are numbers
      validate: {
        validator: function (obj) {
          return Object.values(obj).every((val) => typeof val === "number");
        },
        message: "Product IDs must be numbers",
      },
    },
    additionalItems: {
      type: [Number],
      default: [],
    },
    total_amount: { type: Number, required: true },
    specialNotes: { type: String, default: "" },
    customer_id: { type: String, required: true },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
reservationSchema.index({ reservation_id: 1 }, { unique: true });
reservationSchema.index({ reservation_date: 1 });
reservationSchema.index({ customer_id: 1 }); // Add index for customer_id

// Add a pre-save middleware to validate total amount
reservationSchema.pre("save", function (next) {
  if (this.total_amount < 0) {
    next(new Error("Total amount cannot be negative"));
  }
  next();
});

reservationSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Add middleware to ensure status consistency
reservationSchema.pre("save", function (next) {
  // Convert all status fields to lowercase for consistency
  if (this.reservation_status) {
    this.reservation_status = this.reservation_status.toLowerCase();
  }
  if (this.status) {
    this.status = this.status.toLowerCase();
  }
  if (this.payment_status) {
    this.payment_status = this.payment_status.toLowerCase();
  }
  next();
});

const ReservationModel = mongoose.model("Reservation", reservationSchema);
export default ReservationModel;
