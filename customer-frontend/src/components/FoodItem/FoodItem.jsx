import React, { useState, useEffect, useMemo } from "react";
import "./FoodItem.css";
import { assets } from "../../assets";

const API_URL = "http://localhost:4000";

const FoodItem = ({ name, description, images }) => {
  const [imageUrl, setImageUrl] = useState(assets.placeholderImage);
  const [imageError, setImageError] = useState(false);

  // Memoize image URL processing
  const processedImageUrl = useMemo(() => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return assets.placeholderImage;
    }

    // Find primary image or first image
    const primaryImage = images.find((img) => img?.is_primary) || images[0];

    // Handle different URL types
    if (!primaryImage?.url) {
      return assets.placeholderImage;
    }

    // If it's a blob URL or invalid URL, return placeholder
    try {
      new URL(primaryImage.url);
      if (primaryImage.url.startsWith("blob:")) {
        return assets.placeholderImage;
      }
    } catch {
      // If URL is invalid or relative
      if (primaryImage.url.startsWith("/")) {
        return `${API_URL}${primaryImage.url}`;
      }
      return assets.placeholderImage;
    }

    // If we got here, it's a valid full URL
    return primaryImage.url;
  }, [images]);

  useEffect(() => {
    if (processedImageUrl !== imageUrl) {
      setImageUrl(processedImageUrl);
      setImageError(false); // Reset error state when URL changes
    }
  }, [processedImageUrl, imageUrl]);

  const handleImageError = (e) => {
    console.error("Image failed to load:", {
      src: e.target.src,
      originalUrl: images?.[0]?.url,
      imageProps: images?.[0],
    });
    setImageError(true);
    setImageUrl(assets.placeholderImage);
  };

  // ...existing code...

  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img
          className="food-item-image"
          src={imageError ? assets.placeholderImage : imageUrl}
          alt={name}
          onError={handleImageError}
        />
      </div>
      <div className="food-item-info">
        <div className="food-item-name">
          <p>{name}</p>
        </div>
        <p className="food-item-desc">{description}</p>
      </div>
    </div>
  );
};

export default FoodItem;
