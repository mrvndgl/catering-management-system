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
    const products = await Product.find().sort({ product_id: 1 });
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const updateData = {
      ...req.body,
      images:
        req.body.images?.map((img) => ({
          url: img.url,
          is_primary: img.is_primary || false,
        })) || [],
    };

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
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { product_id } = req.params;

    const deletedProduct = await Product.findOneAndDelete({
      product_id: parseInt(product_id),
    });

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { category_id, category_name, category_details } = req.body;

    const numericCategoryId = Number(category_id);

    // Check if category_id already exists
    const existingCategory = await Category.findOne({
      category_id: numericCategoryId,
    });
    if (existingCategory) {
      return res.status(400).json({ message: "Category ID already exists" });
    }

    const newCategory = new Category({
      category_id: numericCategoryId,
      category_name,
      category_details,
    });

    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating category", error: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ category_id: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching categories", error: error.message });
  }
};
