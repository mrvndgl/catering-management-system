import React, { useState, useMemo, useEffect } from "react";
import "./FoodItem.css";
import { assets } from "../../assets";

const FoodItem = ({ name, description, images }) => {
  const [imageError, setImageError] = useState(false);

  // Create a local placeholder image in case the API path doesn't work
  const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%' y='50%' font-family='sans-serif' font-size='14' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

  // Find valid primary image
  const primaryImage = useMemo(() => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return null;
    }

    // Filter invalid URLs first
    const validImages = images.filter(
      (img) =>
        img &&
        img.url &&
        !img.url.includes("/undefined") &&
        !img.url.includes("/null")
    );

    if (validImages.length === 0) return null;

    // Find primary or use first valid image
    return validImages.find((img) => img.is_primary) || validImages[0];
  }, [images]);

  // Get final URL to display
  const imageUrl = useMemo(() => {
    if (imageError || !primaryImage || !primaryImage.url) {
      return PLACEHOLDER_IMAGE;
    }
    return primaryImage.url;
  }, [primaryImage, imageError, PLACEHOLDER_IMAGE]);

  // Handle image load error
  const handleImageError = () => {
    console.error(`Image failed to load for "${name}": ${imageUrl}`);
    setImageError(true);
  };

  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img
          className="food-item-image"
          src={imageUrl}
          alt={name || "Product image"}
          onError={handleImageError}
        />
      </div>
      <div className="food-item-info">
        <div className="food-item-name">
          <p>{name || "Unnamed product"}</p>
        </div>
        <p className="food-item-desc">{description || ""}</p>
      </div>
    </div>
  );
};

export default FoodItem;
