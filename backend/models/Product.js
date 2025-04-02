import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    product_id: {
      type: Number,
      required: true,
      unique: true,
    },
    category_id: {
      type: String, // Keep as string but ensure consistent handling
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
        url: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              // Allow both URLs and local paths
              return (
                /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(v) ||
                v.startsWith("/uploads/") ||
                v.startsWith("data:")
              );
            },
            message: (props) =>
              `${props.value} is not a valid URL or file path!`,
          },
        },
        filename: {
          type: String,
          required: false, // Make optional for external URLs
        },
        is_primary: {
          type: Boolean,
          default: false,
        },
        _id: false,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index example
productSchema.index({ product_id: 1, category_id: 1 });

// Validation for primary image
productSchema.pre("validate", function (next) {
  // Ensure at least one primary image if images exist
  if (this.images.length > 0 && !this.images.some((img) => img.is_primary)) {
    this.images[0].is_primary = true;
  }

  const primaryCount = this.images.filter((img) => img.is_primary).length;
  if (primaryCount > 1) {
    return next(new Error("Only one primary image allowed"));
  }
  next();
});

// Virtual for primary image URL
productSchema.virtual("primary_image").get(function () {
  const primary = this.images.find((img) => img.is_primary);
  return primary ? primary.url : null;
});

export default mongoose.model("Product", productSchema);
