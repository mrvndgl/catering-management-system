import { createContext, useState, useEffect } from "react";
import { assets } from "../assets";

const API_URL = "http://localhost:4000";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [foodList, setFoodList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setIsLoading(true);
    setError(null);

    try {
      console.log("[StoreContext] Fetching food items...");
      const response = await fetch(`${API_URL}/api/products`);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      console.log("[StoreContext] Received products data:", data.length);

      const formattedData = data.map((item) => ({
        _id: item.product_id,
        name: item.product_name,
        description: item.product_details,
        category: item.category_name,
        category_id: item.category_id,
        archived: item.archived || false,
        images: item.images
          ? item.images.map((img) => ({
              ...img,
              url: processImageUrl(img.url),
            }))
          : [],
      }));

      setFoodList(formattedData);
      console.log(
        "[StoreContext] Food items fetched successfully:",
        formattedData.length
      );
    } catch (error) {
      console.error("[StoreContext] Error fetching food items:", error);
      setError(error.message);
      setFoodList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodItems();

    const handleProductUpdate = (event) => {
      console.log(
        "[StoreContext] Product update event received:",
        event.detail ? JSON.stringify(event.detail) : "No details"
      );
      fetchFoodItems();
    };

    // Add event listeners
    window.addEventListener("productUpdate", handleProductUpdate);
    window.addEventListener("imageUpdate", handleProductUpdate);
    window.addEventListener("productDelete", handleProductUpdate);

    return () => {
      // Clean up event listeners
      window.removeEventListener("productUpdate", handleProductUpdate);
      window.removeEventListener("imageUpdate", handleProductUpdate);
      window.removeEventListener("productDelete", handleProductUpdate);
    };
  }, []);

  const contextValue = {
    foodList,
    isLoading,
    error,
    refreshFoodItems: fetchFoodItems,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
