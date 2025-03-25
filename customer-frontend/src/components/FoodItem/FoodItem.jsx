import React, { useState, useEffect } from "react";
import "./FoodItem.css";
import { assets } from "../../assets";

const API_URL = "http://localhost:4000";

const FoodItem = ({ name, description, images }) => {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    setImageError(false);

    if (!images || !images.length) {
      setImageUrl(assets.placeholderImage);
      return;
    }

    // Find primary image or use first available
    const primaryImage = images.find((img) => img.is_primary);
    const imageToUse = primaryImage || images[0];

    // Handle different URL types
    if (imageToUse.url.startsWith("blob:")) {
      setImageUrl(imageToUse.url);
    } else if (imageToUse.url.startsWith("http")) {
      setImageUrl(imageToUse.url);
    } else {
      setImageUrl(`${API_URL}${imageToUse.url}`);
    }

    console.log("Setting image URL:", imageUrl); // Debug log
  }, [images]);

  const handleImageError = (e) => {
    console.error("Image failed to load:", e.target.src);
    setImageError(true);
    setImageUrl(assets.placeholderImage);
  };

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
