import React, { useContext } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";

const FoodDisplay = ({ category }) => {
  const { food_list } = useContext(StoreContext);

  // Debug log to check food_list data
  console.log("Food list:", food_list);

  return (
    <div className="food-display" id="food-display">
      <h2>Menu items</h2>
      <div className="food-display-list">
        {food_list
          .filter((item) => category === "All" || category === item.category)
          .map((item, index) => (
            <FoodItem
              key={item._id || index} // Use unique ID if available
              id={item._id}
              name={item.name}
              description={item.description}
              images={item.images || []} // Pass images array, fallback to empty array
            />
          ))}
      </div>
    </div>
  );
};

export default FoodDisplay;
