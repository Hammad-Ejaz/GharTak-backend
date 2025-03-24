import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs"; // ← THIS WAS MISSING


// Create Product (Admin Only)
const createProduct = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can create products");
  }

  const { name, description, price, category, stock } = req.body;

  // Handle image upload
  let imageUrl;
  if (req.file) {
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    if (!cloudinaryResponse?.url) {
      throw new apiError(500, "Failed to upload image to Cloudinary");
    }
    imageUrl = cloudinaryResponse.url;
  }

  // Create product
  const product = await Product.create({
    name,
    description,
    price,
    category,
    stock,
    image: imageUrl || null,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, product, "Product created successfully"));
});

// Update Product (Admin Only)
const updateProduct = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can update products");
  }

  const { productId } = req.params;
  const updateData = req.body;

  // Handle image update
  if (req.file) {
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    if (!cloudinaryResponse?.url) {
      throw new apiError(500, "Failed to upload image to Cloudinary");
    }
    updateData.image = cloudinaryResponse.url;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedProduct) {
    throw new apiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, updatedProduct, "Product updated successfully"));
});

// Get All Products (Public)
const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ available: true });
  return res
    .status(200)
    .json(new apiResponse(200, products, "Products retrieved successfully"));
});

// Get Product by ID (Public)
const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new apiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, product, "Product retrieved successfully"));
});

// Delete Product (Admin Only)
const deleteProduct = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can delete products");
  }

  const { productId } = req.params;
  
  const deletedProduct = await Product.findByIdAndDelete(productId);
  
  if (!deletedProduct) {
    throw new apiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, null, "Product deleted successfully"));
});

// Update Stock (Admin Only)
const updateStock = asyncHandler(async (req, res) => {
  if (!req.user?.admin) {
    throw new apiError(403, "Unauthorized: Only admins can update stock");
  }

  const { productId } = req.params;
  const { newStock } = req.body;

  if (typeof newStock !== "number" || newStock < 0) {
    throw new apiError(400, "Invalid stock value");
  }

  const product = await Product.findByIdAndUpdate(
    productId,
    { stock: newStock },
    { new: true }
  );

  if (!product) {
    throw new apiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, product, "Stock updated successfully"));
});

// Get Products by Category (Public)
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  
  const products = await Product.find({ 
    category: new RegExp(category, 'i'), 
    available: true 
  });

  return res
    .status(200)
    .json(new apiResponse(200, products, `Products in ${category} category retrieved`));
});

export {
  createProduct,
  updateProduct,
  getAllProducts,
  getProductById,
  deleteProduct,
  updateStock,
  getProductsByCategory
};
