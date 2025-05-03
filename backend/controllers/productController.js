import Product from "../models/Product.js";
import Category from "../models/Category.js";

export const createProduct = async (req, res) => {
  try {
    const { product_id, category_id, product_name, product_details, images } =
      req.body;

    // i convert ang string to number if needed
    const numericProductId = Number(product_id);
    const numericCategoryId = Number(category_id);

    // Validate input fields
    if (!numericProductId) {
      return res.status(400).json({ message: "Invalid Product ID" });
    }
    if (!numericCategoryId) {
      return res.status(400).json({ message: "Invalid Category ID" });
    }
    if (!product_name) {
      return res.status(400).json({ message: "Product Name is required" });
    }
    if (product_name.length > 20) {
      return res
        .status(400)
        .json({ message: "Product Name too long (max 20 characters)" });
    }
    if (product_details && product_details.length > 30) {
      return res
        .status(400)
        .json({ message: "Product Details too long (max 30 characters)" });
    }

    // Check if category exists
    const category = await Category.findOne({ category_id: numericCategoryId });
    if (!category) {
      return res.status(400).json({ message: "Category not found" });
    }

    const newProduct = new Product({
      product_id: numericProductId,
      category_id: numericCategoryId,
      product_name,
      product_details,
      images:
        images?.map((img) => ({
          url: img.url,
          is_primary: img.is_primary || false,
        })) || [],
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error("Detailed error creating product:", error);
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
      details: error.errors
        ? Object.keys(error.errors).map((key) => error.errors[key].message)
        : null,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    // Add more detailed logging
    console.log("Fetching all products");

    const products = await Product.find();

    console.log("Products found:", products.length);

    // Comprehensive error checking
    if (!products || products.length === 0) {
      console.warn("No products found in database");
      return res.status(404).json({
        message: "No products found",
        totalProducts: 0,
      });
    }

    // Log some product details for debugging
    products.forEach((product) => {
      console.log(
        `Product: ID=${product.product_id}, Name=${product.product_name}`
      );
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Detailed error fetching products:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
      details: error.stack,
    });
  }
};

export const refreshArchivedProducts = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(
      "http://localhost:4000/api/products/archived",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch archived products: ${response.status}`);
    }

    const archivedProducts = await response.json();
    return updateArchivedProducts(archivedProducts);
  } catch (error) {
    console.error("Error refreshing archived products:", error);
    return [];
  }
};

export const updateProduct = async (req, res) => {
  try {
    console.log("Received Update Request:", {
      params: req.params,
      body: { ...req.body, images: req.body.images },
      files: req.files,
    });

    const { product_id } = req.params;

    // Make sure images are properly formatted
    let processedImages = req.body.images;

    // If images came as a string, parse them
    if (typeof req.body.images === "string") {
      try {
        processedImages = JSON.parse(req.body.images);
      } catch (parseError) {
        console.error("Error parsing images JSON:", parseError);
        processedImages = [];
      }
    }

    // Ensure images have the required fields
    const validImages = Array.isArray(processedImages)
      ? processedImages.map((img) => ({
          url: img.url,
          filename: img.filename || path.basename(img.url),
          is_primary: !!img.is_primary,
        }))
      : [];

    const updateData = {
      ...req.body,
      images: validImages,
    };

    console.log("Processed Update Data:", updateData);

    // Convert numeric fields
    if (updateData.category_id) {
      updateData.category_id = Number(updateData.category_id);
    }

    // Check if category exists
    if (updateData.category_id) {
      const category = await Category.findOne({
        category_id: updateData.category_id,
      });
      if (!category) {
        return res.status(400).json({ message: "Category not found" });
      }
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { product_id: parseInt(product_id) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Detailed error updating product:", error);
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const getArchivedProducts = async (req, res) => {
  try {
    const archivedProducts = await Product.find({ archived: true });
    res.status(200).json(archivedProducts);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching archived products",
      error: error.message,
    });
  }
};

export const archiveProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    const updatedProduct = await Product.findOneAndUpdate(
      { product_id: parseInt(product_id) },
      { archived: true },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product archived successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error archiving product",
      error: error.message,
    });
  }
};

export const unarchiveProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    const updatedProduct = await Product.findOneAndUpdate(
      { product_id: parseInt(product_id) },
      { archived: false },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product unarchived successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error unarchiving product",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    // First try to find the product
    const product = await Product.findOne({ product_id: parseInt(product_id) });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Perform hard delete
    await Product.deleteOne({ product_id: parseInt(product_id) });

    // Send success response with deleted product info
    res.status(200).json({
      message: "Product deleted successfully",
      deletedProduct: product,
    });
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
};
