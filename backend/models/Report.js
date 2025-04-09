import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    report_id: {
      type: String,
      required: true,
      unique: true,
    },
    report_type: {
      type: String,
      required: true,
      enum: ["monthly", "quarterly", "yearly", "custom"],
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    generated_by: {
      type: String,
      required: true,
    },
    generated_at: {
      type: Date,
      default: Date.now,
    },
    reservations_data: {
      accepted: [{ type: mongoose.Schema.Types.Mixed }], // Store as mixed type to handle all reservation fields
      declined: [{ type: mongoose.Schema.Types.Mixed }],
    },
    metrics: {
      total_reservations: { type: Number, default: 0 },
      total_revenue: { type: Number, default: 0 },
      total_guests: { type: Number, default: 0 },
      avg_pax_per_reservation: { type: Number, default: 0 },
      accepted_reservations: { type: Number, default: 0 },
      pending_reservations: { type: Number, default: 0 },
      canceled_reservations: { type: Number, default: 0 },
      completed_reservations: { type: Number, default: 0 },
      declined_reservations: { type: Number, default: 0 }, // Added declined field
    },
    monthly_breakdown: [
      {
        month: { type: String },
        year: { type: Number },
        reservation_count: { type: Number },
        revenue: { type: Number },
        guest_count: { type: Number },
        status_counts: {
          accepted: { type: Number, default: 0 },
          pending: { type: Number, default: 0 },
          canceled: { type: Number, default: 0 },
          completed: { type: Number, default: 0 },
          declined: { type: Number, default: 0 }, // Added declined field
        },
      },
    ],
    daily_breakdown: [
      {
        date: { type: Date },
        reservation_count: { type: Number },
        revenue: { type: Number },
        guest_count: { type: Number },
        status_counts: {
          accepted: { type: Number, default: 0 },
          pending: { type: Number, default: 0 },
          canceled: { type: Number, default: 0 },
          completed: { type: Number, default: 0 },
          declined: { type: Number, default: 0 }, // Added declined field
        },
      },
    ],
    venue_breakdown: [
      {
        venue: { type: String },
        reservation_count: { type: Number },
        revenue: { type: Number },
      },
    ],
    summary: { type: String },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
reportSchema.index({ report_id: 1 }, { unique: true });
reportSchema.index({ report_type: 1 });
reportSchema.index({ start_date: 1, end_date: 1 });
reportSchema.index({ generated_at: 1 });

// Helper method to create unique report ID
reportSchema.statics.generateReportId = function (type, startDate, endDate) {
  const dateFormat = (date) => {
    return date.toISOString().split("T")[0];
  };

  return `${type}-${dateFormat(startDate)}-${dateFormat(endDate)}`;
};

const Report = mongoose.model("Report", reportSchema);
export default Report;
