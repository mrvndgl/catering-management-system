import axios from "axios";

// Use environment variables with fallbacks that work in browser
const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:4000/api";
const BASE_URL = import.meta.env?.VITE_BASE_URL || "http://localhost:4000";

// Helper function to determine if FormData should be used
const shouldUseFormData = (data) => {
  if (!data) return false;

  // Check if there are file objects that need FormData
  if (data.images && Array.isArray(data.images)) {
    return data.images.some((img) => img.file instanceof File || img.isNew);
  }

  return false;
};

// Helper to prepare product data with images for submission
const prepareProductData = (productData) => {
  // If no images or no need for FormData, return as is
  if (!shouldUseFormData(productData)) {
    return {
      data: productData,
      headers: { "Content-Type": "application/json" },
    };
  }

  // Create FormData for file uploads
  const formData = new FormData();

  // Add all non-image fields
  Object.keys(productData).forEach((key) => {
    if (key !== "images") {
      formData.append(key, productData[key]);
    }
  });

  // Process images
  if (productData.images && Array.isArray(productData.images)) {
    // Track which images should be included in the JSON (non-file images)
    const imagesToIncludeInJson = productData.images
      .filter((img) => !img.isNew || !(img.file instanceof File))
      .map((img) => ({
        url: img.url,
        filename: img.filename || (img.url ? img.url.split("/").pop() : ""),
        is_primary: !!img.is_primary,
      }));

    // Add existing images as JSON string
    if (imagesToIncludeInJson.length > 0) {
      formData.append("images", JSON.stringify(imagesToIncludeInJson));
    }

    // Add new file uploads
    productData.images.forEach((img) => {
      if (img.file instanceof File) {
        formData.append("images", img.file);
      }
    });
  }

  return {
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  };
};

// Normalized image URL processing
// In your getImageUrl function
export const getImageUrl = (imagePath) => {
  // If path is undefined/null/empty, return placeholder immediately
  if (!imagePath) {
    console.warn("Empty image path provided to getImageUrl");
    return null;
  }

  // Already a complete URL
  if (imagePath.startsWith("http") || imagePath.startsWith("data:")) {
    return imagePath;
  }

  // A relative path from the backend
  if (imagePath.startsWith("/uploads/")) {
    // Extract filename - prevent "/uploads/undefined" URLs
    const filename = imagePath.replace("/uploads/", "");
    if (!filename || filename === "undefined") {
      console.warn("Invalid filename in path:", imagePath);
      return null;
    }
    return `${BASE_URL}${imagePath}`;
  }

  // A blob URL (for local preview)
  if (imagePath.startsWith("blob:")) {
    return imagePath;
  }

  // Unknown format, return as is
  return imagePath;
};

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem("token");

const createAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    console.error("No token found! User might not be logged in.");
    return {}; // Ensure it doesn't send an empty Authorization header
  }
  return { Authorization: `Bearer ${token}` };
};

export const fetchMenuItems = async () => {
  try {
    const response = await axios.get(`${API_URL}/menu-items`, {
      headers: createAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching menu items:", error);
    throw error;
  }
};

export const fetchMenuItemsByCategory = async (includeArchived = false) => {
  try {
    // Get all products
    const response = await axios.get(`${API_URL}/products`, {
      headers: createAuthHeaders(),
    });

    // Get all categories
    const categoriesResponse = await axios.get(`${API_URL}/categories`, {
      headers: createAuthHeaders(),
    });

    const products = response.data;
    const categories = categoriesResponse.data;

    console.log("API products:", products);
    console.log("API categories:", categories);

    // Create a structured menu object
    const menuItemsByCategory = {};

    // Initialize with empty arrays for each category
    categories.forEach((category) => {
      menuItemsByCategory[category.category_name] = [];
    });

    // Populate categories with products (optionally filtering archived ones)
    products.forEach((product) => {
      // Find the category for this product
      const category = categories.find(
        (cat) => cat.category_id === product.category_id
      );

      // Include product if category exists and it's either not archived or we want archived products
      if (category && (includeArchived || !product.is_archived)) {
        menuItemsByCategory[category.category_name].push({
          product_id: product.product_id,
          category_id: product.category_id,
          product_name: product.product_name,
          is_archived: product.is_archived,
        });
      }
    });

    return menuItemsByCategory;
  } catch (error) {
    console.error("Error fetching menu items by category:", error);
    throw error;
  }
};

export const fetchProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/products`, {
      headers: createAuthHeaders(),
    });

    // Process image URLs to ensure they have full paths
    const processedData = response.data.map((product) => {
      // Safely process images array
      const processedImages = Array.isArray(product.images)
        ? product.images
            .filter((img) => img && typeof img === "object") // Ensure valid image objects
            .map((img) => {
              // Skip invalid image objects
              if (!img.url && !img.filename) {
                console.warn(
                  `Missing URL and filename for image in product ${
                    product.product_name || product.product_id
                  }`
                );
                return null;
              }

              // Construct URL properly from filename if needed
              let imageUrl = img.url;
              if (!imageUrl && img.filename) {
                imageUrl = `/uploads/${img.filename}`;
              }

              // Process the URL
              const processedUrl = getImageUrl(imageUrl);

              return {
                ...img,
                url: processedUrl,
              };
            })
            .filter(Boolean) // Remove null entries
        : [];

      // Log processed images for debugging
      if (processedImages.length > 0) {
        console.log(
          `Processed ${processedImages.length} images for ${
            product.product_name || product.product_id
          }`
        );
      } else {
        console.warn(
          `No valid images found for ${
            product.product_name || product.product_id
          }`
        );
      }

      return {
        ...product,
        images: processedImages,
      };
    });

    return processedData;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const fetchCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/categories`, {
      headers: createAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    const { data, headers } = prepareProductData(productData);

    const response = await axios.post(`${API_URL}/products/create`, data, {
      headers: { ...headers, ...createAuthHeaders() },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const { data, headers } = prepareProductData(productData);

    const response = await axios.put(`${API_URL}/products/${productId}`, data, {
      headers: { ...headers, ...createAuthHeaders() },
    });

    return response.data;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const fetchPricingSettings = async () => {
  try {
    const response = await axios.get(`${API_URL}/settings/pricing`, {
      headers: createAuthHeaders(),
    });

    // Calculate the basePrice derived value
    const settings = response.data;
    settings.basePrice = settings.basePax * settings.pricePerHead;

    return settings;
  } catch (error) {
    console.error("Error fetching pricing settings:", error);

    // Return default values if 404 (settings not yet created)
    if (error.response && error.response.status === 404) {
      return {
        basePax: 50,
        pricePerHead: 350,
        additionalItemPrice: 25,
        basePrice: 17500, // 50 * 350
      };
    }

    throw error;
  }
};

export const updatePricingSettings = async (pricingData) => {
  try {
    const response = await axios.post(
      `${API_URL}/settings/pricing`,
      pricingData,
      {
        headers: createAuthHeaders(),
      }
    );

    // Add basePrice derived field to the response data
    const settings = response.data.settings || response.data;
    settings.basePrice = settings.basePax * settings.pricePerHead;

    return settings;
  } catch (error) {
    console.error("Error updating pricing settings:", error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    const response = await axios.delete(`${API_URL}/products/${productId}`, {
      headers: createAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

export const archiveProduct = async (productId) => {
  try {
    const response = await axios.put(
      `${API_URL}/products/${productId}/archive`,
      {},
      {
        headers: createAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error archiving product:", error);
    throw error;
  }
};

export const unarchiveProduct = async (productId) => {
  try {
    const response = await axios.put(
      `${API_URL}/products/${productId}/unarchive`,
      {},
      {
        headers: createAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error unarchiving product:", error);
    throw error;
  }
};

export const getArchivedProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/products/archived`, {
      headers: createAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching archived products:", error);
    throw error;
  }
};
