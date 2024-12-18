import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    category_id: {
      type: Number,
      required: true,
      unique: true,
    },
    category_name: {
      type: String,
      required: true,
      maxlength: 50,
    },
    category_details: {
      type: String,
      maxlength: 25,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ category_id: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);
