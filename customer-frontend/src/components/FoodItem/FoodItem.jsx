import React, { useContext } from "react";
import "./FoodItem.css";

const FoodItem = ({ name, description, image }) => {
  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img className="food-item-image" src={image} alt={name} />
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
