import React, { useState, useEffect } from "react";
import "./ProductManagement.css";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productImages, setProductImages] = useState([]);
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
  }, []);

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
      // Get the token from localStorage or your auth storage
      const token = localStorage.getItem("token"); // or 'accessToken' depending on your key name

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
            Authorization: `Bearer ${token}`, // Make sure this matches your backend's expected format
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

      // Transform the data to match your component's needs
      const formattedCategories = data.map((category) => ({
        value: category.category_id,
        label: category.category_name,
        details: category.category_details,
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
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
      is_primary: productImages.length === 0,
    }));
    setProductImages((prev) => [...prev, ...newImages]);
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
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("http://localhost:4000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token"); // or wherever you store your auth token

      if (!token) {
        throw new Error("No authentication token found");
      }

      const formData = new FormData();

      // Add product data
      formData.append("product_id", productForm.product_id);
      formData.append("category_id", productForm.category_id);
      formData.append("product_name", productForm.product_name);
      formData.append("product_details", productForm.product_details);

      // Add existing images data if any
      if (productImages.length > 0) {
        const existingImages = productImages
          .filter((img) => !img.file)
          .map((img) => ({
            url: img.url,
            is_primary: img.is_primary,
          }));
        formData.append("images", JSON.stringify(existingImages));
      }

      // Add new image files
      productImages
        .filter((img) => img.file)
        .forEach((img) => {
          formData.append("images", img.file);
        });

      const url = isEditing
        ? `http://localhost:4000/api/products/${productForm.product_id}`
        : "http://localhost:4000/api/products/create";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`, // Add the authorization header
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save product");
      }

      await fetchProducts();
      setProductForm({
        product_id: "",
        category_id: "",
        product_name: "",
        product_details: "",
      });
      setProductImages([]);
      setIsEditing(false);
      setError("");
    } catch (error) {
      console.error("Error submitting product:", error);
      setError(`Failed to save product: ${error.message}`);
    }
  };

  const handleEditProduct = (product) => {
    setIsEditing(true);
    setProductForm({
      ...product,
      category_id: Number(product.category_id),
    });
    // If product has images, set them
    setProductImages(
      product.images?.map((img) => ({
        url: img.url,
        is_primary: img.is_primary,
        // Note: existing images won't have a file object
      })) || []
    );
    setError("");
  };

  const handleDeleteProduct = async (product_id) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/products/${product_id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete product");
      }

      await fetchProducts();
      setError("");
    } catch (error) {
      console.error("Error deleting product:", error);
      setError(`Failed to delete product: ${error.message}`);
    }
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]:
        name === "category_id" || name === "product_id"
          ? Number(value) || value
          : value,
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
      const response = await fetch("http://localhost:4000/api/products");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      // Optional: Add state for error handling
      // setError(error.message);
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
                <option
                  key={`${category?.label}-${category.category_id}`}
                  value={category.category_id}
                >
                  {category?.label}
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
              />
              <div className="image-preview-container">
                {productImages.map((image) => (
                  <div key={image.url} className="image-preview">
                    <img
                      src={image.url}
                      alt="Product"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                      }}
                    />
                    <div className="image-actions">
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(image.url)}
                        disabled={image.is_primary}
                      >
                        {image.is_primary ? "Primary" : "Set Primary"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(image.url)}
                      >
                        Remove
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
        <h2>Product List</h2>
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
            {products.map((product) => (
              <tr key={product.product_id}>
                <td>{product.product_id}</td>
                <td>{product.product_name}</td>
                <td>
                  {categories.find((c) => c.category_id === product.category_id)
                    ?.category_name || "No Category"}
                </td>
                <td>{product.product_details}</td>
                <td>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.product_id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManagement;
