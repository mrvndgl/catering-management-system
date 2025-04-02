import { createContext, useState, useEffect } from "react";
import { assets } from "../assets";

const API_URL = "http://localhost:4000";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [foodList, setFoodList] = useState([]);

  const processImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return assets.placeholderImage;
    }

    // Handle data URLs directly
    if (imageUrl.startsWith("data:")) {
      return imageUrl;
    }

    // Handle blob URLs
    if (imageUrl.startsWith("blob:")) {
      return imageUrl; // During editing, we want to keep blob URLs
    }

    // Handle absolute URLs
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }

    // Handle relative paths from backend
    if (imageUrl.startsWith("/uploads/")) {
      return `${API_URL}${imageUrl}`;
    }

    // Fallback to placeholder
    return assets.placeholderImage;
  };

  const fetchFoodItems = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      const data = await response.json();

      const formattedData = data.map((item) => ({
        _id: item.product_id,
        name: item.product_name,
        description: item.product_details,
        category: item.category_name,
        images: item.images
          ? item.images.map((img) => ({
              ...img,
              url: processImageUrl(img.url),
            }))
          : [],
      }));

      setFoodList(formattedData);
    } catch (error) {
      console.error("Error fetching food items:", error);
      setFoodList([]);
    }
  };

  useEffect(() => {
    fetchFoodItems();

    const handleProductUpdate = () => {
      fetchFoodItems();
    };

    window.addEventListener("productUpdate", handleProductUpdate);
    window.addEventListener("imageUpdate", handleProductUpdate);

    return () => {
      window.removeEventListener("productUpdate", handleProductUpdate);
      window.removeEventListener("imageUpdate", handleProductUpdate);
    };
  }, []);

  const contextValue = {
    food_list: foodList,
    refreshFoodItems: fetchFoodItems,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
