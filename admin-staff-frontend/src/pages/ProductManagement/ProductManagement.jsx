import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Pencil, Archive, Trash2, ArchiveRestore, Edit2 } from "lucide-react";
import "./ProductManagement.css";

const API_URL = "http://localhost:4000";
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='14' fill='%23999' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [menuItems, setMenuItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [productForm, setProductForm] = useState({
    product_id: "",
    category_id: "",
    product_name: "",
    product_details: "",
  });
  const [categoryForm, setCategoryForm] = useState({
    category_id: "",
    category_name: "",
    category_details: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const [pricingSettings, setPricingSettings] = useState({
    basePax: 50,
    pricePerHead: 350,
    additionalItemPrice: 35,
  });

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found - please log in");
        setCategories([]);
        return;
      }

      const response = await fetch("http://localhost:4000/api/categories", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(
          `HTTP Error Response: ${response.status} ${response.statusText}`
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          throw new Error("Authentication required - please log in");
        }

        if (response.status === 404) {
          throw new Error(
            "Categories endpoint not found - please check API route configuration"
          );
        }

        throw new Error(
          `Failed to fetch categories (Status: ${response.status})`
        );
      }

      const data = await response.json();
      setCategories(data.length > 0 ? data : []);
      setError("");
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
      setError(`Failed to fetch categories - ${error.message}`);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:4000/api/products", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const products = await response.json();

      // Get categories
      const categoriesResponse = await fetch(
        "http://localhost:4000/api/categories",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!categoriesResponse.ok) {
        throw new Error(
          `Failed to fetch categories: ${categoriesResponse.status}`
        );
      }

      const categories = await categoriesResponse.json();

      // Organize products by category
      const organizedMenu = {};

      categories.forEach((category) => {
        const categoryProducts = products.filter(
          (product) =>
            product.category_id === category.category_id && !product.archived
        );

        if (categoryProducts.length > 0) {
          organizedMenu[category.category_name] = categoryProducts.map(
            (product) => ({
              product_id: product.product_id,
              category_id: product.category_id,
              product_name: product.product_name,
            })
          );
        }
      });

      setMenuItems(organizedMenu);
      setLoading(false); // Set loading to false on success
    } catch (error) {
      console.error("Error fetching menu items:", error);
      setError(error.message);
      setLoading(false); // Also set loading to false on error
    }
  };

  // Fetch pricing settings from API
  const fetchPricingSettings = async () => {
    try {
      const token = localStorage.getItem("token");

      console.log("Using Token:", token); // Debugging

      const response = await fetch(
        "http://localhost:4000/api/settings/pricing",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response Status:", response.status); // Debugging

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("Pricing settings not found, using defaults.");
          return;
        }
        throw new Error(`Failed to fetch pricing settings: ${response.status}`);
      }

      const settings = await response.json();
      console.log("Fetched Settings:", settings); // Debugging
      setPricingSettings(settings);
    } catch (error) {
      console.error("Error fetching pricing settings:", error);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPricingSettings({
      ...pricingSettings,
      [name]: Number(value),
    });
  };

  // Save pricing settings
  const savePricingSettings = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:4000/api/settings/pricing",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pricingSettings),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save pricing settings: ${response.status}`);
      }

      Swal.fire("Success!", "Pricing settings saved successfully!", "success"); // Using Swal here
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving pricing settings:", error);
      setError(error.message);
      Swal.fire("Error!", error.message, "error"); // Using Swal here
      setTimeout(() => setError(null), 3000);
    }
  };

  const basePrice = pricingSettings.basePax * pricingSettings.pricePerHead;

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchMenuItems(),
          fetchPricingSettings(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [showArchived]);

  const getNextProductId = () => {
    if (products.length === 0) return 1;
    const maxId = Math.max(...products.map((p) => Number(p.product_id)));
    return maxId + 1;
  };

  useEffect(() => {
    if (!isEditing) {
      setProductForm((prev) => ({
        ...prev,
        product_id: getNextProductId(),
      }));
      setProductImages([]);
    }
  }, [products, isEditing]);

  // If you need to create a new category
  const createNewCategory = async (categoryData) => {
    try {
      const response = await fetch(
        "http://localhost:4000/api/products/category/create",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${yourAuthToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category_id: categoryData.id,
            category_name: categoryData.name,
            category_details: categoryData.details,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create category");
      }

      const newCategory = await response.json();
      return newCategory;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB limit

    const processedImages = files
      .map((file, index) => {
        // Validate file size
        if (file.size > maxSize) {
          setError(`File ${file.name} is too large. Maximum size is 5MB`);
          return null;
        }

        // Create a preview URL that we can revoke later
        const previewUrl = URL.createObjectURL(file);

        return {
          file,
          url: previewUrl,
          is_primary: productImages.length === 0 || index === 0,
          isNew: true,
          originalName: file.name,
        };
      })
      .filter(Boolean); // Remove any null entries

    // Update state with new images
    setProductImages((prev) => {
      // Clean up old blob URLs before adding new ones
      prev.forEach((img) => {
        if (img.url.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });
      return [...prev, ...processedImages];
    });
  };

  // Add this cleanup effect right after the handleImageUpload function
  useEffect(() => {
    return () => {
      productImages.forEach((img) => {
        if (img.url.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [productImages]);

  const handleSetPrimaryImage = (imageUrl) => {
    console.log("Setting primary image with URL:", imageUrl);
    console.log("Current images before update:", productImages);

    setProductImages((prev) => {
      const updatedImages = prev.map((img) => ({
        ...img,
        is_primary: img.url === imageUrl,
        file: img.file,
        isNew: img.isNew,
      }));

      console.log("Updated images:", updatedImages);
      return updatedImages;
    });
  };

  const handleReplaceImage = (imageUrl) => {
    // Find the image index
    const imageIndex = productImages.findIndex((img) => img.url === imageUrl);
    if (imageIndex === -1) return;

    // Create a file input element
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    // Handle file selection
    fileInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const newUrl = URL.createObjectURL(file);

        // Update the image in the state
        const updatedImages = [...productImages];
        const isPrimary = updatedImages[imageIndex].is_primary;

        // Revoke old blob URL if it exists
        if (updatedImages[imageIndex].url.startsWith("blob:")) {
          URL.revokeObjectURL(updatedImages[imageIndex].url);
        }

        updatedImages[imageIndex] = {
          file,
          url: newUrl,
          is_primary: isPrimary,
          isNew: true,
          originalName: file.name,
        };

        setProductImages(updatedImages);
      }
    };

    // Trigger click on the file input
    fileInput.click();
  };

  const handleRemoveImage = (imageUrl) => {
    setProductImages((prev) => prev.filter((img) => img.url !== imageUrl));
  };

  const handleEditProduct = (product) => {
    setProductForm({
      product_id: product.product_id,
      category_id: product.category_id,
      product_name: product.product_name,
      product_details: product.product_details,
    });

    // Process images consistently
    if (
      product.images &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      const formattedImages = product.images
        .map((image) => {
          // If no URL information at all, skip this image
          if (!image.url && !image.filename) {
            return null;
          }

          // Create a standardized image object
          return {
            url:
              image.url ||
              (image.filename ? `/uploads/${image.filename}` : null),
            is_primary: Boolean(image.is_primary),
            file: null, // No file object for existing images
            isNew: false,
          };
        })
        .filter(Boolean); // Remove null entries

      setProductImages(formattedImages);
    } else {
      setProductImages([]);
    }

    setIsEditing(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();

    // Check for duplicate product name
    const duplicateProduct = checkDuplicateProductName(
      productForm.product_name
    );

    if (duplicateProduct) {
      Swal.fire({
        title: "Duplicate Product",
        text: `A product with the name "${productForm.product_name}" already exists.`,
        icon: "warning",
      });
      return; // Stop form submission
    }

    try {
      const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/products/${productForm.product_id}`
        : `${import.meta.env.VITE_API_URL}/products/create`;

      const formData = new FormData();

      // Append product details
      formData.append("product_id", productForm.product_id);
      formData.append("category_id", productForm.category_id);
      formData.append("product_name", productForm.product_name);
      formData.append("product_details", productForm.product_details);

      // Handle images
      const processedImages = await Promise.all(
        productImages.map(async (image, index) => {
          // If it's a new file (has file property), upload it
          if (image.file) {
            // If it's a blob URL or local file, upload
            if (image.url.startsWith("blob:") || image.file instanceof File) {
              return {
                is_primary: index === 0,
                isNew: true,
                file: image.file,
              };
            }
          }

          // If it's an existing image with a server URL
          return {
            url: image.url,
            is_primary: image.is_primary || index === 0,
            isNew: false,
          };
        })
      );

      // Separate new files and existing image URLs
      const newFiles = processedImages.filter((img) => img.file);
      const existingImages = processedImages.filter((img) => img.url);

      // Append existing image URLs
      formData.append("images", JSON.stringify(existingImages));

      // Append new image files
      newFiles.forEach((imageData, index) => {
        formData.append("images", imageData.file);
      });

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Log full response for debugging
      const responseBody = await response.json();
      console.log("Full Response:", responseBody);

      if (!response.ok) {
        throw new Error(responseBody.message || "Something went wrong");
      }

      // Reset form and update state
      setProductForm({
        product_id: getNextProductId(),
        category_id: "",
        product_name: "",
        product_details: "",
      });
      setProductImages([]);
      setIsEditing(false);

      // Trigger frontend update
      window.dispatchEvent(new CustomEvent("productUpdate"));

      // Refetch products to update list
      await fetchProducts();

      // Show success message
      Swal.fire({
        title: "Success!",
        text: "Product updated successfully",
        icon: "success",
      });
    } catch (error) {
      console.error("Submission Error:", error);
      setError(error.message);
    }
  };

  // Add this function to check for duplicate product names
  const checkDuplicateProductName = (productName) => {
    // Normalize input by trimming whitespace and converting to lowercase
    const normalizedName = productName.trim().toLowerCase();

    // Find any product with the same name (excluding the current product if editing)
    const existingProduct = products.find(
      (product) =>
        product.product_name.toLowerCase() === normalizedName &&
        (!isEditing || product.product_id !== productForm.product_id)
    );

    return existingProduct;
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Provide real-time validation for product name
    if (name === "product_name" && value.trim() !== "") {
      const duplicateProduct = checkDuplicateProductName(value);
      if (duplicateProduct) {
        // Display warning immediately below the input field
        document.querySelector(".product-name-error")?.remove();
        const errorDiv = document.createElement("div");
        errorDiv.className = "product-name-error";
        errorDiv.textContent = "This product name already exists.";
        errorDiv.style.color = "red";
        errorDiv.style.fontSize = "12px";
        e.target.parentNode.insertBefore(errorDiv, e.target.nextSibling);
      } else {
        // Remove warning if exists
        document.querySelector(".product-name-error")?.remove();
      }
    }
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found - please log in");
        return;
      }

      const response = await fetch("http://localhost:4000/api/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data);

      if (!Array.isArray(data)) {
        throw new Error("Expected an array of products");
      }

      setProducts(data);
      setLoading(false); // Set loading to false on success
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error.message);
      setLoading(false); // Also set loading to false on error
    }
  };

  const handleArchiveProduct = async (product_id) => {
    try {
      const token = localStorage.getItem("token");
      const result = await Swal.fire({
        title: "Archive Product",
        text: "Are you sure you want to archive this product?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#FBC02D", // Confirm button color
        cancelButtonColor: "#ffffff", // White background for cancel button
        confirmButtonText: "Yes, archive it!",
        cancelButtonText: "Cancel",
        customClass: {
          cancelButton: "swal2-cancel-custom",
        },
        didOpen: () => {
          const cancelBtn = document.querySelector(".swal2-cancel-custom");

          // Default styles
          cancelBtn.style.border = "2px solid #FBC02D";
          cancelBtn.style.color = "#FBC02D"; // Text color

          // Hover effect
          cancelBtn.onmouseover = () => {
            cancelBtn.style.backgroundColor = "#FBC02D"; // Yellow background on hover
            cancelBtn.style.color = "#fff"; // White text on hover
          };

          cancelBtn.onmouseout = () => {
            cancelBtn.style.backgroundColor = "#ffffff"; // Back to white
            cancelBtn.style.color = "#FBC02D"; // Back to yellow text
          };
        },
      });

      if (result.isConfirmed) {
        const response = await fetch(
          `http://localhost:4000/api/products/${product_id}/archive`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        await fetchProducts();
        Swal.fire("Archived!", "The product has been archived.", "success");
      }
    } catch (error) {
      console.error("Error archiving product:", error);
      Swal.fire("Error!", "Failed to archive product", "error");
    }
  };

  const handleUnarchiveProduct = async (product_id) => {
    try {
      const token = localStorage.getItem("token");
      const result = await Swal.fire({
        title: "Unarchive Product",
        text: "Are you sure you want to unarchive this product?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, unarchive it!",
      });

      if (result.isConfirmed) {
        const response = await fetch(
          `http://localhost:4000/api/products/${product_id}/unarchive`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        await fetchProducts();
        Swal.fire("Unarchived!", "The product has been unarchived.", "success");
      }
    } catch (error) {
      console.error("Error unarchiving product:", error);
      Swal.fire("Error!", "Failed to unarchive product", "error");
    }
  };

  const handleDeleteProduct = async (product_id) => {
    try {
      const token = localStorage.getItem("token");
      const result = await Swal.fire({
        title: "Delete Product",
        text: "Are you sure you want to delete this product? This action cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const response = await fetch(
          `http://localhost:4000/api/products/${product_id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        await fetchProducts();
        Swal.fire("Deleted!", "The product has been deleted.", "success");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      Swal.fire("Error!", "Failed to delete product", "error");
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const url = "http://localhost:4000/api/categories/create";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_id: Number(categoryForm.category_id),
          category_name: categoryForm.category_name,
          category_details: categoryForm.category_details,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add category");
      }

      setCategoryForm({
        category_id: "",
        category_name: "",
        category_details: "",
      });
      fetchCategories();
      setError("");
    } catch (error) {
      console.error("Error adding category:", error);
      setError(`Failed to add category: ${error.message}`);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="product-management">
      {error && <div className="error-message">{error}</div>}

      <div className="product-forms">
        <div className="product-form">
          <h2>{isEditing ? "Edit Product" : "Add Product"}</h2>
          <form onSubmit={handleProductSubmit}>
            <input
              type="number"
              name="product_id"
              placeholder="Product ID"
              value={productForm.product_id}
              onChange={handleProductInputChange}
              required
              disabled={true} // Always disabled now since we auto-generate IDs
            />
            <select
              name="category_id"
              value={productForm.category_id}
              onChange={handleProductInputChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="product_name"
              placeholder="Product Name"
              value={productForm.product_name}
              onChange={handleProductInputChange}
              required
              maxLength="20"
            />
            <input
              type="text"
              name="product_details"
              placeholder="Product Details"
              value={productForm.product_details}
              onChange={handleProductInputChange}
              maxLength="30"
            />

            <div className="image-upload-section">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="image-upload-input"
              />
              <div className="image-preview-container">
                {productImages.map((image, index) => (
                  <div
                    key={index}
                    className={`image-preview ${
                      image.is_primary ? "primary-image" : ""
                    }`}
                  >
                    <img
                      src={
                        image.isNew
                          ? image.url
                          : image.url
                          ? `${API_URL}${image.url}`
                          : PLACEHOLDER_IMAGE
                      }
                      alt={`Product ${index + 1}`}
                      className="product-image"
                      onError={(e) => {
                        console.error("Image failed to load:", e.target.src);
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    <div className="image-actions">
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(image.url)}
                        className={`image-action-btn primary-btn ${
                          image.is_primary ? "is-primary" : ""
                        }`}
                        disabled={image.is_primary}
                      >
                        {image.is_primary ? "★ Primary" : "Set Primary"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReplaceImage(image.url)}
                        className="image-action-btn replace-btn"
                      >
                        <Edit2 size={16} /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(image.url)}
                        className="image-action-btn remove-btn"
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit">
              {isEditing ? "Update Product" : "Add Product"}
            </button>
            {isEditing && (
              <button
                className="cancel-button"
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setProductForm({
                    product_id: getNextProductId(),
                    category_id: "",
                    product_name: "",
                    product_details: "",
                  });
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        <div className="pricing-management-container">
          <h2>Pricing Management</h2>

          {error && <div className="error-message">{error}</div>}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          <form onSubmit={savePricingSettings} className="pricing-form">
            <div className="form-group">
              <label htmlFor="basePax">Base Number of Guests:</label>
              <input
                id="basePax"
                type="number"
                name="basePax"
                value={pricingSettings.basePax}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pricePerHead">Price Per Person (₱):</label>
              <input
                id="pricePerHead"
                type="number"
                name="pricePerHead"
                value={pricingSettings.pricePerHead}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="additionalItemPrice">
                Additional Item Price (₱):
              </label>
              <input
                id="additionalItemPrice"
                type="number"
                name="additionalItemPrice"
                value={pricingSettings.additionalItemPrice}
                onChange={handleInputChange}
                min="1"
                required
              />
            </div>

            <div className="price-summary">
              <p>
                <strong>
                  Base Package Price: ₱{basePrice.toLocaleString()}
                </strong>{" "}
                (for {pricingSettings.basePax} guests)
              </p>
            </div>

            <button type="submit" className="save-button">
              Save Pricing Settings
            </button>
          </form>
        </div>

        <div className="category-form">
          <h2>Add Category</h2>
          <form onSubmit={handleCategorySubmit}>
            <input
              type="number"
              name="category_id"
              placeholder="Category ID"
              value={categoryForm.category_id}
              onChange={handleCategoryInputChange}
              required
            />
            <input
              type="text"
              name="category_name"
              placeholder="Category Name"
              value={categoryForm.category_name}
              onChange={handleCategoryInputChange}
              required
              maxLength="50"
            />
            <input
              type="text"
              name="category_details"
              placeholder="Category Details"
              value={categoryForm.category_details}
              onChange={handleCategoryInputChange}
              maxLength="25"
            />
            <button type="submit">Add Category</button>
          </form>
        </div>
      </div>

      <div className="product-list">
        <div className="product-list-header">
          <h2>Product List</h2>
          <button
            className={`view-toggle-button ${
              showArchived ? "archived" : "active"
            }`}
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? (
              <>
                <Archive size={16} />
                View Active Products
              </>
            ) : (
              <>
                <ArchiveRestore size={16} />
                View Archived Products
              </>
            )}
          </button>
        </div>
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : products.length === 0 ? (
          <div className="no-products">
            {showArchived
              ? "No archived products found"
              : "No active products found"}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products
                .filter((product) => product.archived === showArchived)
                .map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.product_id}</td>
                    <td>{product.product_name}</td>
                    <td>
                      {categories.find(
                        (c) => c.category_id === parseInt(product.category_id)
                      )?.category_name || "No Category"}
                    </td>
                    <td>{product.product_details}</td>
                    <td>
                      <div className="product-action-buttons">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="icon-button edit"
                          title="Edit"
                        >
                          <Pencil size={20} />
                        </button>
                        {product.archived ? (
                          <button
                            onClick={() =>
                              handleUnarchiveProduct(product.product_id)
                            }
                            className="icon-button unarchive"
                            title="Unarchive"
                          >
                            <ArchiveRestore size={20} />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleArchiveProduct(product.product_id)
                            }
                            className="icon-button archive"
                            title="Archive"
                          >
                            <Archive size={20} />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleDeleteProduct(product.product_id)
                          }
                          className="icon-button delete"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
