import Category from "../models/Category.js";
import Product from "../models/Product.js";

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

    // Validate required fields
    if (!numericCategoryId) {
      return res.status(400).json({ message: "Invalid Category ID" });
    }
    if (!category_name) {
      return res.status(400).json({ message: "Category Name is required" });
    }

    const newCategory = new Category({
      category_id: numericCategoryId,
      category_name,
      category_details,
    });

    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      message: "Error creating category",
      error: error.message,
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ category_id: 1 });

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        message: "No categories found",
        totalCategories: 0,
      });
    }

    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

export const getDistinctCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching distinct categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { category_id } = req.params;
    const { category_name, category_details } = req.body;

    // Validate input
    if (!category_name) {
      return res.status(400).json({ message: "Category Name is required" });
    }

    const updatedCategory = await Category.findOneAndUpdate(
      { category_id: Number(category_id) },
      { category_name, category_details },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      message: "Error updating category",
      error: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    // Check if any products are using this category
    const productsWithCategory = await Product.countDocuments({
      category_id: Number(category_id),
    });

    if (productsWithCategory > 0) {
      return res.status(400).json({
        message: `Cannot delete category: ${productsWithCategory} products are using this category`,
      });
    }

    const deletedCategory = await Category.findOneAndDelete({
      category_id: Number(category_id),
    });

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      message: "Error deleting category",
      error: error.message,
    });
  }
};
