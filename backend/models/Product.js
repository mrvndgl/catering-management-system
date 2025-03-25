import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    product_id: {
      type: Number,
      required: true,
      unique: true,
    },
    category_id: {
      type: String,
      required: true,
      ref: "Category",
    },
    product_name: {
      type: String,
      required: true,
      maxlength: 20,
    },
    product_details: {
      type: String,
      maxlength: 30,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    images: [
      {
        url: { type: String },
        is_primary: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

productSchema.index({ product_id: 1, category_id: 1 });

export default mongoose.model("Product", productSchema);
