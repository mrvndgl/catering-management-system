/**
 * imageHelpers.js - Utility functions for handling images in the reservation component
 */

// Default placeholder for when images fail to load
export const PLACEHOLDER_IMAGE = "/images/placeholder-food.png";
export const SVG_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Cpath d='M35,30h30v40h-30z' fill='%23ddd'/%3E%3Cpath d='M35,50h30M50,30v40' stroke='%23fff' stroke-width='2'/%3E%3C/svg%3E";

/**
 * Processes an image url for displaying in components
 * Handles various image data structures and formats
 * @param {Object|Array|string} imageData - The image data to process
 * @returns {string|null} - A valid image URL or null if no image is available
 */
export const processImageUrl = (imageData) => {
  const baseUrl = import.meta.env?.VITE_BASE_URL || "http://localhost:4000";

  // Case 1: No image data
  if (!imageData) {
    return null;
  }

  // Case 2: Image data is already a string URL
  if (typeof imageData === "string") {
    // Check if it's already a complete URL
    if (
      imageData.startsWith("http") ||
      imageData.startsWith("data:") ||
      imageData.startsWith("blob:")
    ) {
      return imageData;
    }

    // Handle relative paths from server
    if (imageData.startsWith("/uploads/")) {
      return `${baseUrl}${imageData}`;
    }

    return imageData;
  }

  // Case 3: Image data is an array of images
  if (Array.isArray(imageData)) {
    // Handle empty array
    if (imageData.length === 0) {
      return null;
    }

    // Try to find primary image first
    const primaryImage = imageData.find((img) => img && img.is_primary);
    const imageToUse = primaryImage || imageData[0];

    // Process the first/primary image
    if (!imageToUse) {
      return null;
    }

    if (typeof imageToUse === "string") {
      return imageToUse;
    }

    if (imageToUse.url) {
      return processImageUrl(imageToUse.url); // Process the URL recursively
    }

    if (imageToUse.filename) {
      return `${baseUrl}/uploads/${imageToUse.filename}`;
    }

    return null;
  }

  // Case 4: Image data is an object with url or filename
  if (typeof imageData === "object") {
    if (imageData.url) {
      return processImageUrl(imageData.url); // Process the URL recursively
    }

    if (imageData.filename) {
      return `${baseUrl}/uploads/${imageData.filename}`;
    }
  }

  return null;
};

/**
 * Handles image loading errors and replaces with placeholder
 * @param {Event} event - The error event from img tag
 */
export const handleImageError = (event) => {
  console.warn("Image failed to load:", event.target.src);
  event.target.onerror = null; // Prevent potential infinite loops
  event.target.src = PLACEHOLDER_IMAGE;
};

/**
 * Gets the best image URL from a product object
 * @param {Object} product - The product object with images array
 * @returns {string} - A valid image URL or placeholder
 */
export const getProductImageUrl = (product) => {
  if (!product) return PLACEHOLDER_IMAGE;

  // No images array
  if (
    !product.images ||
    !Array.isArray(product.images) ||
    product.images.length === 0
  ) {
    return PLACEHOLDER_IMAGE;
  }

  // Try to find primary image first
  const primaryImage = product.images.find((img) => img && img.is_primary);
  const imageToUse = primaryImage || product.images[0];

  if (!imageToUse) return PLACEHOLDER_IMAGE;

  const processedUrl = processImageUrl(imageToUse);
  return processedUrl || PLACEHOLDER_IMAGE;
};

/**
 * Creates an optimized Image component with error handling
 * @param {Object} props - The props for the image
 * @returns {JSX.Element} - The image element
 */
export const ProductImage = ({
  product,
  className = "",
  altText = "Menu Item",
}) => {
  const imageUrl = getProductImageUrl(product);

  return (
    <img
      src={imageUrl}
      alt={altText || product?.product_name || "Food item"}
      className={className}
      onError={handleImageError}
    />
  );
};
