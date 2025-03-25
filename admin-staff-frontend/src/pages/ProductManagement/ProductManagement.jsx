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
  const [isLoading, setIsLoading] = useState(true);
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
  const [error, setError] = useState("");

  const predefinedCategories = [
    { category_id: 1, category_name: "Beef" },
    { category_id: 2, category_name: "Pork" },
    { category_id: 3, category_name: "Chicken" },
    { category_id: 4, category_name: "Seafood" },
    { category_id: 5, category_name: "Noodles" },
    { category_id: 6, category_name: "Vegetables" },
    { category_id: 7, category_name: "Dessert" },
  ];

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found - please log in");
        setCategories(predefinedCategories);
        return;
      }

      const response = await fetch(
        "http://localhost:4000/api/products/categories",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          `HTTP Error Response: ${response.status} ${response.statusText}`
        );

        if (response.status === 401) {
          // Clear invalid token
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

      // Keep the original structure from the API
      const formattedCategories = data.map((category) => ({
        category_id: category.category_id,
        category_name: category.category_name,
        category_details: category.category_details,
      }));

      setCategories(
        formattedCategories.length > 0
          ? formattedCategories
          : predefinedCategories
      );
      setError("");
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories(predefinedCategories);
      setError(`Using default categories - ${error.message}`);
    }
  };

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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB limit

    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    const newImages = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      is_primary: productImages.length === 0,
      isNew: true, // Flag to indicate this is a new upload
    }));

    setProductImages((prev) => [...prev, ...newImages]);
  };

  //replace an image //
  const handleReplaceImage = async (imageUrl) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const maxSize = 5 * 1024 * 1024; // 5MB limit

        if (file.size > maxSize) {
          setError("File is too large. Maximum size is 5MB");
          return;
        }

        try {
          // Create a new URL for the file preview
          const newImageUrl = URL.createObjectURL(file);

          // Update the images array with the new file
          setProductImages((prev) =>
            prev.map((img) =>
              img.url === imageUrl
                ? {
                    ...img,
                    url: newImageUrl,
                    file: file,
                    isNew: true,
                  }
                : img
            )
          );
        } catch (error) {
          console.error("Error replacing image:", error);
          setError("Failed to replace image");
        }
      }
    };

    input.click();
  };

  const handleSetPrimaryImage = (imageUrl) => {
    setProductImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_primary: img.url === imageUrl,
      }))
    );
  };

  const handleRemoveImage = (imageUrl) => {
    setProductImages((prev) => prev.filter((img) => img.url !== imageUrl));
  };

  const uploadImage = async (file) => {
    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append("product_name", productForm.product_name);
      formData.append("category_id", productForm.category_id);
      formData.append("product_details", productForm.product_details);

      // Append existing image URLs if updating
      if (productImages.length > 0) {
        formData.append(
          "images",
          JSON.stringify(
            productImages.map((img) => ({
              url: img.url,
              is_primary: img.is_primary,
            }))
          )
        );
      }

      // Append new image files
      productImages.forEach((image) => {
        if (image.file) {
          formData.append("images", image.file);
        }
      });

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      return data.imageUrl; // Assumes backend returns uploaded image URL
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  };

  const handleEditProduct = (product) => {
    setProductForm({
      product_id: product.product_id,
      category_id: product.category_id,
      product_name: product.product_name,
      product_details: product.product_details,
    });

    // Convert product images to the required format
    if (product.images && Array.isArray(product.images)) {
      const formattedImages = product.images.map((image) => ({
        url: image.url.startsWith("/uploads")
          ? image.url
          : `/uploads/${image.filename}`,
        is_primary: image.is_primary,
        file: null,
        isNew: false,
      }));
      setProductImages(formattedImages);
    } else {
      setProductImages([]); // Reset images if none exist
    }

    setIsEditing(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/products/${productForm.product_id}`
        : `${import.meta.env.VITE_API_URL}/products/create`;

      console.log("Submission Details:", {
        url,
        isEditing,
        productForm,
        productImages,
      });

      const formData = new FormData();
      formData.append("product_id", productForm.product_id);
      formData.append("category_id", productForm.category_id);
      formData.append("product_name", productForm.product_name);
      formData.append("product_details", productForm.product_details);

      // Handle images
      const imageData = productImages.map((image) => ({
        url: image.url,
        is_primary: image.is_primary || false,
      }));
      formData.append("images", JSON.stringify(imageData));

      // Append image files
      productImages.forEach((image) => {
        if (image.file) {
          formData.append("images", image.file);
        }
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

      // Refetch products to update list
      await fetchProducts();
    } catch (error) {
      console.error("Submission Error:", error);
      setError(error.message);
    }
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error.message);
      setIsLoading(false);
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
                      src={image.isNew ? image.url : `${API_URL}${image.url}`}
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
        {isLoading ? (
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
