import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    schedule_id: {
      type: Number,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    reservationDate: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
    },
    eventType: {
      type: String,
      enum: ["Birthday", "Wedding", "Corporate", "Other"],
      default: "Other",
    },
    specialRequirements: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-increment for schedule_id
scheduleSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const lastSchedule = await this.constructor.findOne(
        {},
        {},
        { sort: { schedule_id: -1 } }
      );
      this.schedule_id = lastSchedule ? lastSchedule.schedule_id + 1 : 10000;
    }
    next();
  } catch (error) {
    next(error);
  }
});

export const Schedule = mongoose.model("Schedule", scheduleSchema);
