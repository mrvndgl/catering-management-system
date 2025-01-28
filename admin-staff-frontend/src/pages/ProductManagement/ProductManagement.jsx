import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProductManagement.css";

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
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

  // Generate the next available product ID
  const getNextProductId = () => {
    if (products.length === 0) return 1;
    const maxId = Math.max(...products.map((p) => Number(p.product_id)));
    return maxId + 1;
  };

  // Auto-fill product ID when form is reset or component mounts
  useEffect(() => {
    if (!isEditing) {
      setProductForm((prev) => ({
        ...prev,
        product_id: getNextProductId(),
      }));
    }
  }, [products, isEditing]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/categories");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch categories (Status: ${response.status})`
        );
      }
      const data = await response.json();
      setCategories(data.length > 0 ? data : predefinedCategories);
      setError("");
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories(predefinedCategories);
      setError("Using default categories - Unable to connect to server");
    }
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/products");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch products (Status: ${response.status})`
        );
      }
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
      setError("");
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to load products - Please try again later");
      setProducts([]);
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

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing
        ? `http://localhost:4000/api/products/${productForm.product_id}`
        : "http://localhost:4000/api/products/create";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...productForm,
          product_id: Number(productForm.product_id),
          category_id: Number(productForm.category_id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error && data.error.includes("duplicate key error")) {
          throw new Error(
            `Product ID ${productForm.product_id} already exists. Please use a different ID.`
          );
        }
        throw new Error(data.message || "Failed to save product");
      }

      await fetchProducts();
      setProductForm({
        product_id: "",
        category_id: "",
        product_name: "",
        product_details: "",
      });
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

  const handleReturn = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div className="product-management">
      <div className="header-section">
        <h1>Manage Products</h1>
      </div>
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
            <button type="submit">
              {isEditing ? "Update Product" : "Add Product"}
            </button>
            {isEditing && (
              <button
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
