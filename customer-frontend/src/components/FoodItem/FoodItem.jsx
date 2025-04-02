import React, { useState, useMemo, useEffect } from "react";
import "./FoodItem.css";
import { assets } from "../../assets";

const FoodItem = ({ name, description, images }) => {
  const [imageError, setImageError] = useState(false);

  // Define a proper placeholder image
  const PLACEHOLDER_IMAGE =
    assets.placeholderImage ||
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%' y='50%' font-family='sans-serif' font-size='14' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

  // Find primary image or first available image
  const primaryImage = useMemo(() => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return null;
    }
    // Find primary image or fallback to first image
    return images.find((img) => img?.is_primary) || images[0];
  }, [images]);

  // Process the image URL - validate URL is valid
  const imageUrl = useMemo(() => {
    if (imageError) return PLACEHOLDER_IMAGE;

    // If no primary image or no URL property
    if (!primaryImage || !primaryImage.url) {
      console.warn("Missing image or URL in FoodItem:", { name, primaryImage });
      return PLACEHOLDER_IMAGE;
    }

    // Check for undefined or invalid URL patterns
    if (
      primaryImage.url === "undefined" ||
      primaryImage.url.includes("/undefined") ||
      primaryImage.url.includes("null")
    ) {
      console.warn("Invalid image URL detected:", primaryImage.url);
      return PLACEHOLDER_IMAGE;
    }

    return primaryImage.url;
  }, [primaryImage, imageError, PLACEHOLDER_IMAGE, name]);

  // Debug logging
  useEffect(() => {
    console.log(`FoodItem "${name}" - Image info:`, {
      primaryImage,
      processedUrl: imageUrl,
      allImages: images,
    });
  }, [primaryImage, imageUrl, images, name]);

  const handleImageError = (e) => {
    console.error(`Image failed to load for "${name}":`, {
      image: primaryImage,
      attemptedUrl: imageUrl,
      error: e,
    });
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
