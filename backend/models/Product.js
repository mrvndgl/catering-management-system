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
              // Don't allow undefined or null in the paths
              if (v.includes("/undefined") || v.includes("/null")) {
                return false;
              }

              // Check for valid URL or path
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
    deleted: {
      type: Boolean,
      default: false,
    },
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
  // Filter out any images with invalid URLs
  this.images = this.images.filter(
    (img) =>
      img &&
      img.url &&
      !img.url.includes("/undefined") &&
      !img.url.includes("null")
  );

  // Reset all primary flags
  this.images.forEach((img) => (img.is_primary = false));

  // Ensure at least one primary image if images exist
  if (this.images.length > 0) {
    this.images[0].is_primary = true;
  }

  next();
});

// Virtual for primary image URL
productSchema.virtual("primary_image").get(function () {
  const primary = this.images.find((img) => img.is_primary);
  return primary ? primary.url : null;
});

export default mongoose.model("Product", productSchema);
