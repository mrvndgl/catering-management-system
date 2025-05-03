import React, { useState, useEffect } from "react";
import "./FoodItem.css";

const FoodItem = ({ name, description, images }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  const PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Cpath d='M35,30h30v40h-30z' fill='%23ddd'/%3E%3Cpath d='M35,50h30M50,30v40' stroke='%23fff' stroke-width='2'/%3E%3C/svg%3E";

  useEffect(() => {
    const processImage = () => {
      // If no images provided, return null
      if (!images) {
        console.log(`No images provided for "${name}"`);
        return null;
      }

      // If images is an array, take the first one
      if (Array.isArray(images)) {
        const firstImage = images[0];
        if (!firstImage) return null;

        // Handle different image object formats
        if (typeof firstImage === "string") {
          return firstImage;
        } else if (firstImage.url) {
          return firstImage.url;
        } else if (firstImage.filename) {
          const baseUrl =
            import.meta.env?.VITE_BASE_URL || "http://localhost:4000";
          return `${baseUrl}/uploads/${firstImage.filename}`;
        }
      }

      // If images is a string, use it directly
      if (typeof images === "string") {
        return images;
      }

      // If images is an object with url property
      if (images?.url) {
        return images.url;
      }

      // If images is an object with filename property
      if (images?.filename) {
        const baseUrl =
          import.meta.env?.VITE_BASE_URL || "http://localhost:4000";
        return `${baseUrl}/uploads/${images.filename}`;
      }

      return null;
    };

    const url = processImage();
    console.log(`Processed image URL for "${name}":`, url);
    setImageUrl(url);
  }, [name, images]);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img
          className="food-item-image"
          src={imageError || !imageUrl ? PLACEHOLDER_IMAGE : imageUrl}
          alt={name || "Food item"}
          onError={handleImageError}
        />
      </div>
      <div className="food-item-info">
        <div className="food-item-name">
          <p>{name || "Unnamed product"}</p>
        </div>
        {description && <p className="food-item-desc">{description}</p>}
      </div>
    </div>
  );
};

export default FoodItem;
