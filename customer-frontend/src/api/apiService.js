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
export const getImageUrl = (imagePath) => {
  console.log("Processing image path:", imagePath);

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
    const baseUrl = import.meta.env?.VITE_BASE_URL || "http://localhost:4000";
    console.log(`Converting ${imagePath} to ${baseUrl}${imagePath}`);
    return `${baseUrl}${imagePath}`;
  }

  // A blob URL (for local preview)
  if (imagePath.startsWith("blob:")) {
    return imagePath;
  }

  // Unknown format, return as is but log it
  console.warn("Unknown image path format:", imagePath);
  return imagePath;
};

// Modified fetchMenuItemsByCategory function with better error handling
export const fetchMenuItemsByCategory = async (includeArchived = false) => {
  try {
    const authHeaders = createAuthHeaders();
    console.log("Using auth headers:", authHeaders);

    // Get all products
    console.log("Fetching products from:", `${API_URL}/products`);
    const response = await axios.get(`${API_URL}/products`, {
      headers: authHeaders,
    });

    // Get all categories
    console.log("Fetching categories from:", `${API_URL}/categories`);
    const categoriesResponse = await axios.get(`${API_URL}/categories`, {
      headers: authHeaders,
    });

    const products = response.data;
    const categories = categoriesResponse.data;

    console.log("Products received:", products.length);
    console.log("Categories received:", categories.length);

    // Create a structured menu object
    const menuItemsByCategory = {};

    // Initialize with empty arrays for each category
    categories.forEach((category) => {
      menuItemsByCategory[category.category_name] = [];
    });

    // Populate categories with products
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
          // Include a placeholder for images to avoid null references
          images: product.images || [],
        });
      }
    });

    // Process products to ensure image data is well-formed
    const processedProducts = products.map((product) => {
      // Ensure product has an images array
      if (!product.images) {
        product.images = [];
      }

      // If images is not an array, make it one
      if (!Array.isArray(product.images)) {
        console.warn(
          `Product ${product.product_name} has non-array images:`,
          product.images
        );
        product.images = product.images ? [product.images] : [];
      }

      // Process each image to ensure URLs are valid
      product.images = product.images
        .map((img) => {
          if (!img || typeof img !== "object") {
            console.warn(
              `Invalid image object in ${product.product_name}:`,
              img
            );
            return null;
          }

          // Process the products to ensure image URLs are valid
          products.forEach((product) => {
            if (product.images && Array.isArray(product.images)) {
              product.images = product.images
                .map((img) => {
                  return {
                    ...img,
                    url: getImageUrl(img.url),
                  };
                })
                .filter(Boolean); // Remove null entries
            }

            return product;
          });

          // Process URL using getImageUrl function
          return {
            ...img,
            url: getImageUrl(img.url),
          };
        })
        .filter(Boolean); // Remove null entries

      return product;
    });

    // Update menuItemsByCategory with the processed products
    Object.keys(menuItemsByCategory).forEach((categoryName) => {
      menuItemsByCategory[categoryName] = menuItemsByCategory[categoryName].map(
        (product) => {
          const processedProduct = processedProducts.find(
            (p) => p.product_id === product.product_id
          );
          return processedProduct || product;
        }
      );
    });

    return menuItemsByCategory;
  } catch (error) {
    console.error("Error fetching menu items by category:", error);
    throw error;
  }
};

// Add this function at the top of your apiService.js file
const createAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Add this utility function
export const ensureValidImageUrl = (url) => {
  if (!url) return null;

  // Check for invalid URL patterns
  if (
    url === "undefined" ||
    url.includes("/undefined") ||
    url.includes("/null") ||
    url === "[object Object]"
  ) {
    return null;
  }

  // Make sure server paths have the full URL
  if (url.startsWith("/uploads/")) {
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";
    return `${baseUrl}${url}`;
  }

  return url;
};

// Then use this in your fetch functions
export const fetchProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/products`, {
      headers: createAuthHeaders(),
    });

    const processedData = response.data.map((product) => {
      // Filter and process images
      const processedImages = Array.isArray(product.images)
        ? product.images
            .filter((img) => img && typeof img === "object")
            .map((img) => {
              const validUrl = ensureValidImageUrl(img.url);
              return validUrl ? { ...img, url: validUrl } : null;
            })
            .filter(Boolean) // Remove nulls
        : [];

      // Set primary image
      if (
        processedImages.length > 0 &&
        !processedImages.some((img) => img.is_primary)
      ) {
        processedImages[0].is_primary = true;
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
